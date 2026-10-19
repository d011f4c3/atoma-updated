import "server-only";

import type {
  CartReference,
  CatalogVariantReference,
  CatalogSellingPlanReference,
} from "@jmm/shopify-storefront";
import {
  createStorefrontCartClient,
  createStorefrontCatalogClient,
  isStorefrontError,
  readStorefrontEnvironment,
  type StorefrontEnvironment,
} from "@jmm/shopify-storefront/server";
import { cookies } from "next/headers";
import { CATALOG_SHOP_DOMAIN } from "./catalog-model";

import {
  createCartActionKey,
  matchesCartActionKey,
  type CartActionKind,
} from "./cart-session";
import {
  createCartApplication,
  type AddCartLineCommand,
  type CartApplication,
  type CartSource,
  type CartCommandResult,
  type CheckoutResult,
  type FreshCatalogSource,
  type RemoveCartLineCommand,
  type UpdateCartLineCommand,
} from "./cart-application";
import { readCheckoutHost } from "./cart-config";
import {
  cartSessionCookieOptions,
  cartSessionCookieName,
  openCartSession,
  readCartSessionSecret,
  sealCartSession,
  type CartSessionSecret,
} from "./cart-session";
import type { CartLoadResult } from "./cart-types";
import {
  readStorefrontDestination,
  persistStorefrontDestination,
} from "./storefront-destination-server";
import { readShopifyDestination } from "./storefront-market-server";
import {
  SHIPPING_COUNTRIES,
  type DestinationContext,
  type ShippingCountryCode,
} from "./storefront-destination";
import {
  readProductPurchaseOptions,
  sellingPlansEnabled as readSellingPlansEnabled,
} from "./selling-plan-policy";

type DestinationMetadata = {
  readonly destination?: DestinationContext | null;
  readonly destinationReviewRequired?: boolean;
};

interface CartCookieStore {
  get(name: string): { readonly value: string } | undefined;
  set(
    name: string,
    value: string,
    options: ReturnType<typeof cartSessionCookieOptions>,
  ): void;
}

interface CartRuntime {
  readonly destination: DestinationContext;
  readonly application: CartApplication;
  readonly environment: StorefrontEnvironment;
  readonly secret: CartSessionSecret;
  readonly sellingPlansEnabled: boolean;
}

export async function loadCurrentCart(): Promise<
  CartLoadResult & DestinationMetadata
> {
  const context = await createActionContext();
  const result = await context.runtime.application.loadCart(context.reference);
  return withDestination(result, context.runtime.destination);
}

export async function loadCurrentDestination() {
  let preference = await readStorefrontDestination();
  try {
    const result = await loadCurrentCart();
    if (!["ready", "empty", "missing"].includes(result.kind))
      throw new Error("Destination unavailable.");
    const destination = result.destination ?? null;
    // A timed-out country write may have committed. Reconcile the preference
    // only from an authoritative read; never replay the Shopify mutation.
    if (destination && destination.countryCode !== preference.countryCode) {
      await persistStorefrontDestination(destination.countryCode);
      preference = { countryCode: destination.countryCode, source: "manual" };
    }
    const expected = destination
      ? await readShopifyDestination(destination.countryCode)
      : null;
    return {
      kind: "ready" as const,
      preference,
      destination,
      countries: SHIPPING_COUNTRIES,
      reviewRequired:
        destination === null || destination.currency !== expected?.currency,
    };
  } catch {
    return {
      kind: "unavailable" as const,
      preference,
      destination: null,
      countries: SHIPPING_COUNTRIES,
      reviewRequired: true,
    };
  }
}

export async function changeCurrentDestination(
  countryCode: ShippingCountryCode,
) {
  const context = await createActionContext(countryCode);
  const result =
    context.reference === null
      ? { kind: "success" as const }
      : await context.runtime.application.updateDestination(
          context.reference,
          countryCode,
        );
  const persisted =
    "sessionReference" in result
      ? persistAuthoritativeCart(result, context)
      : result;
  if (
    persisted.kind === "success" ||
    persisted.kind === "warning" ||
    persisted.kind === "missing"
  ) {
    try {
      await persistStorefrontDestination(countryCode);
    } catch {
      return { kind: "ambiguous" as const };
    }
    return withDestination(
      persisted.kind === "missing" ? { kind: "success" as const } : persisted,
      context.runtime.destination,
    );
  }
  // A rejected result may include the old authoritative Cart; never claim the
  // requested destination merely because the request was made.
  return "cart" in persisted
    ? withDestination(persisted, context.runtime.destination)
    : persisted;
}

function withDestination<
  T extends {
    kind: string;
    cart?: { destination?: DestinationContext | null };
    destination?: DestinationContext | null;
  },
>(result: T, expected: DestinationContext): T & DestinationMetadata {
  const destination = result.cart
    ? (result.cart.destination ?? null)
    : Object.hasOwn(result, "destination")
      ? (result.destination ?? null)
      : ["empty", "missing", "success"].includes(result.kind)
        ? expected
        : undefined;
  return {
    ...result,
    ...(destination === undefined
      ? {}
      : {
          destination,
          destinationReviewRequired:
            !destination ||
            destination.countryCode !== expected.countryCode ||
            destination.currency !== expected.currency,
        }),
  };
}

export async function addCurrentCartLine(
  command: AddCartLineCommand,
): Promise<CartCommandResult & DestinationMetadata> {
  const context = await createActionContext();
  const result = await context.runtime.application.addLine(
    context.reference,
    command,
  );
  return withDestination(
    persistAuthoritativeCart(result, context),
    context.runtime.destination,
  );
}

export async function updateCurrentCartLine(
  command: UpdateCartLineCommand,
): Promise<CartCommandResult & DestinationMetadata> {
  const context = await createActionContext();
  const result = await context.runtime.application.updateLine(
    context.reference,
    command,
  );
  return withDestination(
    persistAuthoritativeCart(result, context),
    context.runtime.destination,
  );
}

export async function removeCurrentCartLine(
  command: RemoveCartLineCommand,
): Promise<CartCommandResult & DestinationMetadata> {
  const context = await createActionContext();
  const result = await context.runtime.application.removeLine(
    context.reference,
    command,
  );
  return withDestination(
    persistAuthoritativeCart(result, context),
    context.runtime.destination,
  );
}

export async function prepareCurrentCheckout(): Promise<CheckoutResult> {
  const context = await createActionContext();
  return context.runtime.application.prepareCheckout(context.reference);
}

export function createPublishedVariantActionKey(
  reference: CatalogVariantReference,
  sellingPlanReference?: CatalogSellingPlanReference,
  destination?: DestinationContext,
): string {
  const environment = readStorefrontEnvironment();
  if (environment.storeDomain !== CATALOG_SHOP_DOMAIN)
    throw new Error("Cart store configuration is invalid.");
  const secret = readCartSessionSecret();
  return createBoundActionKey(
    environment,
    secret,
    sellingPlanReference === undefined
      ? "product_variant"
      : "product_subscription",
    purchaseReference(reference, sellingPlanReference),
    destination,
  );
}

export function createCatalogSelectionKey(
  reference: CatalogVariantReference,
  sellingPlanReference?: CatalogSellingPlanReference,
): string {
  const environment = readStorefrontEnvironment();
  if (environment.storeDomain !== CATALOG_SHOP_DOMAIN)
    throw new Error("Invalid storefront.");
  return createBoundActionKey(
    environment,
    readCartSessionSecret(),
    sellingPlanReference === undefined
      ? "selection_variant"
      : "selection_subscription",
    purchaseReference(reference, sellingPlanReference),
  );
}

async function createActionContext(countryCode?: ShippingCountryCode): Promise<{
  readonly cookieName: string;
  readonly cookieStore: CartCookieStore;
  readonly isProduction: boolean;
  readonly reference: CartReference | null;
  readonly runtime: CartRuntime;
}> {
  const cookieStore: CartCookieStore = await cookies();
  const runtime = await createRuntime(countryCode);
  const isProduction = process.env.NODE_ENV === "production";
  const cookieName = cartSessionCookieName(isProduction);
  const sealed = cookieStore.get(cookieName)?.value;
  const reference =
    sealed === undefined ? null : openReference(sealed, runtime);
  return Object.freeze({
    cookieName,
    cookieStore,
    isProduction,
    reference,
    runtime,
  });
}

async function createRuntime(
  countryCode?: ShippingCountryCode,
): Promise<CartRuntime> {
  const destination = await readShopifyDestination(
    countryCode ?? (await readStorefrontDestination()).countryCode,
  );
  const requestContext = { countryCode: destination.countryCode };
  const environment = readStorefrontEnvironment();
  if (environment.storeDomain !== CATALOG_SHOP_DOMAIN)
    throw new Error("Cart store configuration is invalid.");
  const secret = readCartSessionSecret();
  const sellingPlansEnabled = readSellingPlansEnabled(process.env);
  const cartClient = createStorefrontCartClient({
    discountCodesEnabled: true,
    destinationContextEnabled: true,
    environment,
    currency: destination.currency,
    sellingPlansEnabled,
  });
  const catalogClient = createStorefrontCatalogClient({
    environment,
    currency: destination.currency,
    sellingPlansEnabled,
  });
  const oneTimeCatalogClient = sellingPlansEnabled
    ? createStorefrontCatalogClient({
        environment,
        currency: destination.currency,
        sellingPlansEnabled: false,
      })
    : catalogClient;
  const cartSource: CartSource = {
    createCart: (input) => cartClient.createCart(input, requestContext),
    updateBuyerCountry: (reference, country) =>
      cartClient.updateBuyerCountry(reference, country),
    readCart: (reference) => cartClient.readCart(reference),
    addCartLine: (reference, input) => cartClient.addCartLine(reference, input),
    updateCartLine: (reference, input) =>
      cartClient.updateCartLine(reference, input),
    removeCartLine: (reference, input) =>
      cartClient.removeCartLine(reference, input),
    readCheckout: (reference) =>
      cartClient.readCheckout(reference, readCheckoutHost()),
  };
  const catalogSource: FreshCatalogSource = {
    readPublishedProductByHandle: (handle) =>
      readProductPurchaseOptions(
        handle,
        sellingPlansEnabled,
        (value) =>
          oneTimeCatalogClient.readPublishedProductByHandle(
            value,
            requestContext,
          ),
        (value) =>
          catalogClient.readPublishedProductByHandle(value, requestContext),
      ),
  };
  const application = createCartApplication({
    destination,
    cartSource: Object.freeze(cartSource),
    catalogSource: Object.freeze(catalogSource),
    createLineActionKey: (reference) =>
      createBoundActionKey(
        environment,
        secret,
        "cart_line",
        reference,
        destination,
      ),
    matchesLineActionKey: (actionKey, reference) =>
      matchesBoundActionKey(
        actionKey,
        environment,
        secret,
        "cart_line",
        reference,
        destination,
      ),
    matchesVariantActionKey: (actionKey, reference, sellingPlanReference) =>
      matchesBoundActionKey(
        actionKey,
        environment,
        secret,
        sellingPlanReference === undefined
          ? "product_variant"
          : "product_subscription",
        purchaseReference(reference, sellingPlanReference),
        destination,
      ),
    classifyError(error) {
      if (!isStorefrontError(error)) {
        return null;
      }

      if (error.code === "MUTATION_OUTCOME_UNKNOWN") {
        return "ambiguous";
      }

      return error.retryable ? "retryable" : "nonretryable";
    },
  });

  return Object.freeze({
    destination,
    application,
    environment,
    secret,
    sellingPlansEnabled,
  });
}

function createBoundActionKey(
  environment: StorefrontEnvironment,
  secret: CartSessionSecret,
  kind: CartActionKind,
  reference: string,
  destination?: DestinationContext,
): string {
  return createCartActionKey(
    {
      storeDomain: environment.storeDomain,
      kind,
      reference: destination
        ? JSON.stringify([
            destination.countryCode,
            destination.currency,
            reference,
          ])
        : reference,
    },
    secret,
  );
}

function matchesBoundActionKey(
  actionKey: string,
  environment: StorefrontEnvironment,
  secret: CartSessionSecret,
  kind: CartActionKind,
  reference: string,
  destination?: DestinationContext,
): boolean {
  return matchesCartActionKey(
    actionKey,
    {
      storeDomain: environment.storeDomain,
      kind,
      reference: destination
        ? JSON.stringify([
            destination.countryCode,
            destination.currency,
            reference,
          ])
        : reference,
    },
    secret,
  );
}

function openReference(
  sealed: string,
  runtime: CartRuntime,
): CartReference | null {
  return openCartSession(sealed, {
    storeDomain: runtime.environment.storeDomain,
    secret: runtime.secret,
    sellingPlansEnabled: runtime.sellingPlansEnabled,
  }) as CartReference | null;
}

function purchaseReference(
  reference: CatalogVariantReference,
  sellingPlanReference?: CatalogSellingPlanReference,
): string {
  return sellingPlanReference === undefined
    ? reference
    : JSON.stringify([reference, sellingPlanReference]);
}

function persistAuthoritativeCart(
  result: CartCommandResult,
  context: Readonly<{
    cookieName: string;
    cookieStore: CartCookieStore;
    isProduction: boolean;
    reference: CartReference | null;
    runtime: CartRuntime;
  }>,
): CartCommandResult {
  if (!("sessionReference" in result)) {
    return result;
  }

  // Shopify normally preserves the Cart reference across line mutations. Do
  // not rewrite an equivalent cookie: in a Server Action, any cookie mutation
  // makes Next.js re-render the current route and invalidate client route data.
  // A first Cart or a genuinely rotated reference must still be persisted.
  if (result.sessionReference === context.reference) {
    return result;
  }

  try {
    const sealed = sealCartSession(
      {
        cartReference: result.sessionReference,
        storeDomain: context.runtime.environment.storeDomain,
        sellingPlansEnabled: context.runtime.sellingPlansEnabled,
      },
      context.runtime.secret,
    );
    context.cookieStore.set(
      context.cookieName,
      sealed,
      cartSessionCookieOptions(context.isProduction),
    );
    return result;
  } catch {
    return Object.freeze({ kind: "ambiguous" });
  }
}
