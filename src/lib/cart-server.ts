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

const STOREFRONT_CURRENCY = "JPY" as const;

interface CartCookieStore {
  get(name: string): { readonly value: string } | undefined;
  set(
    name: string,
    value: string,
    options: ReturnType<typeof cartSessionCookieOptions>,
  ): void;
}

interface CartRuntime {
  readonly application: CartApplication;
  readonly environment: StorefrontEnvironment;
  readonly secret: CartSessionSecret;
  readonly sellingPlansEnabled: boolean;
}

export async function loadCurrentCart(): Promise<CartLoadResult> {
  const cookieStore: CartCookieStore = await cookies();
  const sealed = cookieStore.get(
    cartSessionCookieName(process.env.NODE_ENV === "production"),
  )?.value;

  if (sealed === undefined) {
    return Object.freeze({ kind: "empty" });
  }

  const runtime = createRuntime();
  const reference = openReference(sealed, runtime);

  if (reference === null) {
    return Object.freeze({ kind: "empty" });
  }

  return runtime.application.loadCart(reference);
}

export async function addCurrentCartLine(
  command: AddCartLineCommand,
): Promise<CartCommandResult> {
  const context = await createActionContext();
  const result = await context.runtime.application.addLine(
    context.reference,
    command,
  );
  return persistAuthoritativeCart(result, context);
}

export async function updateCurrentCartLine(
  command: UpdateCartLineCommand,
): Promise<CartCommandResult> {
  const context = await createActionContext();
  const result = await context.runtime.application.updateLine(
    context.reference,
    command,
  );
  return persistAuthoritativeCart(result, context);
}

export async function removeCurrentCartLine(
  command: RemoveCartLineCommand,
): Promise<CartCommandResult> {
  const context = await createActionContext();
  const result = await context.runtime.application.removeLine(
    context.reference,
    command,
  );
  return persistAuthoritativeCart(result, context);
}

export async function prepareCurrentCheckout(): Promise<CheckoutResult> {
  const context = await createActionContext();
  return context.runtime.application.prepareCheckout(context.reference);
}

export function createPublishedVariantActionKey(
  reference: CatalogVariantReference,
  sellingPlanReference?: CatalogSellingPlanReference,
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
  );
}

async function createActionContext(): Promise<{
  readonly cookieName: string;
  readonly cookieStore: CartCookieStore;
  readonly isProduction: boolean;
  readonly reference: CartReference | null;
  readonly runtime: CartRuntime;
}> {
  const cookieStore: CartCookieStore = await cookies();
  const runtime = createRuntime();
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

function createRuntime(): CartRuntime {
  const environment = readStorefrontEnvironment();
  if (environment.storeDomain !== CATALOG_SHOP_DOMAIN)
    throw new Error("Cart store configuration is invalid.");
  const secret = readCartSessionSecret();
  const sellingPlansEnabled = false;
  const cartClient = createStorefrontCartClient({
    environment,
    currency: STOREFRONT_CURRENCY,
    sellingPlansEnabled,
  });
  const catalogClient = createStorefrontCatalogClient({
    environment,
    currency: STOREFRONT_CURRENCY,
    sellingPlansEnabled,
  });
  const cartSource: CartSource = {
    createCart: (input) => cartClient.createCart(input),
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
      catalogClient.readPublishedProductByHandle(handle),
  };
  const application = createCartApplication({
    cartSource: Object.freeze(cartSource),
    catalogSource: Object.freeze(catalogSource),
    createLineActionKey: (reference) =>
      createBoundActionKey(environment, secret, "cart_line", reference),
    matchesLineActionKey: (actionKey, reference) =>
      matchesBoundActionKey(
        actionKey,
        environment,
        secret,
        "cart_line",
        reference,
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
): string {
  return createCartActionKey(
    {
      storeDomain: environment.storeDomain,
      kind,
      reference,
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
): boolean {
  return matchesCartActionKey(
    actionKey,
    {
      storeDomain: environment.storeDomain,
      kind,
      reference,
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
