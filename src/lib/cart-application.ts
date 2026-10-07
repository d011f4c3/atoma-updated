import type {
  CartCheckout,
  CartLineReference,
  CartMutationResult as AdapterCartMutationResult,
  CartReference,
  CartSnapshot,
  CatalogMoney,
  CatalogProductSummary,
  CatalogVariantReference,
  CatalogSellingPlanReference,
} from "@jmm/shopify-storefront";

function formatDeliveryInterval(plan: {
  deliveryInterval: string;
  deliveryIntervalCount: number;
}): string {
  return plan.deliveryIntervalCount === 1
    ? `Every ${plan.deliveryInterval}`
    : `Every ${plan.deliveryIntervalCount} ${plan.deliveryInterval}s`;
}

import type {
  CartLineViewModel,
  CartLoadResult,
  CartViewModel,
} from "./cart-types";

const MAX_GRAPHQL_INT = 2_147_483_647;
const MAX_PRODUCT_HANDLE_LENGTH = 255;
const PRODUCT_HANDLE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMPTY_RESULT = Object.freeze({ kind: "empty" } as const);
const MISSING_RESULT = Object.freeze({ kind: "missing" } as const);
const REJECTED_RESULT = Object.freeze({ kind: "rejected" } as const);
const REJECTED_WITH_REVIEW_RESULT = Object.freeze({
  kind: "rejected" as const,
  reviewRequired: true,
});
const UNAVAILABLE_RESULT = Object.freeze({ kind: "unavailable" } as const);
const ERROR_RESULT = Object.freeze({ kind: "error" } as const);
const AMBIGUOUS_RESULT = Object.freeze({ kind: "ambiguous" } as const);

export interface CartSource {
  readCart(reference: CartReference): Promise<Readonly<CartSnapshot> | null>;
  createCart(input: {
    readonly merchandiseId: CatalogVariantReference;
    readonly quantity: number;
    readonly sellingPlanId?: CatalogSellingPlanReference;
  }): Promise<AdapterCartMutationResult>;
  addCartLine(
    reference: CartReference,
    input: {
      readonly merchandiseId: CatalogVariantReference;
      readonly quantity: number;
      readonly sellingPlanId?: CatalogSellingPlanReference;
    },
  ): Promise<AdapterCartMutationResult>;
  updateCartLine(
    reference: CartReference,
    input: {
      readonly lineId: CartLineReference;
      readonly quantity: number;
    },
  ): Promise<AdapterCartMutationResult>;
  removeCartLine(
    reference: CartReference,
    input: { readonly lineId: CartLineReference },
  ): Promise<AdapterCartMutationResult>;
  readCheckout(
    reference: CartReference,
  ): Promise<Readonly<CartCheckout> | null>;
}

export interface FreshCatalogSource {
  readPublishedProductByHandle(
    handle: string,
  ): Promise<Readonly<CatalogProductSummary> | null>;
}

export type CartErrorClassification =
  "retryable" | "nonretryable" | "ambiguous" | null;

export interface CartApplicationDependencies {
  readonly cartSource: CartSource;
  readonly catalogSource: FreshCatalogSource;
  readonly createLineActionKey: (reference: CartLineReference) => string;
  readonly matchesLineActionKey: (
    actionKey: string,
    reference: CartLineReference,
  ) => boolean;
  readonly matchesVariantActionKey: (
    actionKey: string,
    reference: CatalogVariantReference,
    sellingPlanReference?: CatalogSellingPlanReference,
  ) => boolean;
  readonly classifyError: (error: unknown) => CartErrorClassification;
}

export interface AddCartLineCommand {
  readonly productHandle: string;
  readonly variantKey: string;
  readonly quantity: number;
}

export interface UpdateCartLineCommand {
  readonly lineKey: string;
  readonly quantity: number;
}

export interface RemoveCartLineCommand {
  readonly lineKey: string;
}

export type CartCommandResult =
  | CartCommandCartResult
  | typeof MISSING_RESULT
  | typeof REJECTED_RESULT
  | typeof REJECTED_WITH_REVIEW_RESULT
  | typeof UNAVAILABLE_RESULT
  | typeof ERROR_RESULT
  | typeof AMBIGUOUS_RESULT;

export type CartCommandCartResult = Readonly<{
  kind: "success" | "warning" | "rejected";
  cart: CartViewModel;
  reviewRequired: boolean;
  /** Non-enumerable at runtime and consumed only by the server session boundary. */
  sessionReference: CartReference;
}>;

export type CheckoutResult =
  | Readonly<{
      kind: "ready";
      totalQuantity: number;
      /** Non-enumerable at runtime and consumed only by an immediate redirect. */
      checkoutUrl: string;
    }>
  | typeof EMPTY_RESULT
  | typeof MISSING_RESULT
  | typeof UNAVAILABLE_RESULT
  | typeof ERROR_RESULT;

export interface CartApplication {
  loadCart(reference: CartReference | null): Promise<CartLoadResult>;
  addLine(
    reference: CartReference | null,
    command: AddCartLineCommand,
  ): Promise<CartCommandResult>;
  updateLine(
    reference: CartReference | null,
    command: UpdateCartLineCommand,
  ): Promise<CartCommandResult>;
  removeLine(
    reference: CartReference | null,
    command: RemoveCartLineCommand,
  ): Promise<CartCommandResult>;
  prepareCheckout(reference: CartReference | null): Promise<CheckoutResult>;
}

export function createCartApplication(
  dependencies: CartApplicationDependencies,
): CartApplication {
  const application: CartApplication = {
    async loadCart(reference): Promise<CartLoadResult> {
      if (reference === null) {
        return EMPTY_RESULT;
      }

      const cart = await readCart(reference, dependencies);

      if (isFailureResult(cart)) {
        return cart;
      }

      if (cart === null) {
        return MISSING_RESULT;
      }

      if (cart.lines.length === 0) {
        return EMPTY_RESULT;
      }

      return Object.freeze({
        kind: "ready" as const,
        cart: mapCart(cart, dependencies),
      });
    },

    async addLine(reference, command): Promise<CartCommandResult> {
      if (!isValidAddCommand(command)) {
        return REJECTED_RESULT;
      }

      let productRead: Promise<Readonly<CatalogProductSummary> | null>;

      try {
        productRead = dependencies.catalogSource.readPublishedProductByHandle(
          command.productHandle,
        );
      } catch (error: unknown) {
        return classifyFailure(error, dependencies.classifyError, false);
      }

      // Product authorization and the existing Cart freshness check are
      // independent. Start both Shopify reads together so an ordinary add pays
      // one preflight roundtrip rather than two. Settle the Cart read eagerly so
      // a rejected Product cannot leave an unhandled background rejection.
      const currentCartRead =
        reference === null
          ? null
          : readCart(reference, dependencies).then(
              (value) => ({ kind: "resolved" as const, value }),
              (error: unknown) => ({ kind: "threw" as const, error }),
            );
      let product: Readonly<CatalogProductSummary> | null;

      try {
        product = await productRead;
      } catch (error: unknown) {
        return classifyFailure(error, dependencies.classifyError, false);
      }

      if (product === null || product.handle !== command.productHandle) {
        return REJECTED_RESULT;
      }

      // Resolve the opaque locator against the freshly published variant/plan
      // allocation. The browser never supplies a Shopify plan or a price, and
      // a removed plan must never fall back to a one-time purchase.
      const matchingPurchases = product.variants.flatMap((variant) => {
        const candidates: {
          variant: typeof variant;
          sellingPlanId?: CatalogSellingPlanReference;
        }[] = [];
        if (
          !product.requiresSellingPlan &&
          dependencies.matchesVariantActionKey(
            command.variantKey,
            variant.reference,
          )
        ) {
          candidates.push({ variant });
        }
        for (const plan of variant.sellingPlans) {
          if (
            dependencies.matchesVariantActionKey(
              command.variantKey,
              variant.reference,
              plan.reference,
            )
          ) {
            candidates.push({ variant, sellingPlanId: plan.reference });
          }
        }
        return candidates;
      });

      if (matchingPurchases.length !== 1) {
        return REJECTED_RESULT;
      }

      const { variant, sellingPlanId } = matchingPurchases[0]!;

      if (
        product.purchaseStatus !== "purchasable" ||
        variant.purchaseStatus !== "purchasable" ||
        !satisfiesQuantityRule(command.quantity, variant.quantityRule)
      ) {
        return REJECTED_RESULT;
      }

      let currentReference = reference;
      let beforeCart: Readonly<CartSnapshot> | null = null;

      if (currentReference !== null && currentCartRead !== null) {
        const settledCart = await currentCartRead;

        if (settledCart.kind === "threw") {
          throw settledCart.error;
        }

        const currentCart = settledCart.value;

        if (isFailureResult(currentCart)) {
          return currentCart;
        }

        // An expired Shopify Cart must not permanently trap the browser on a
        // stale cookie. A subsequent valid add starts a replacement Cart.
        if (currentCart === null) {
          currentReference = null;
        } else {
          beforeCart = currentCart;
        }
      }

      try {
        const result =
          currentReference === null
            ? await dependencies.cartSource.createCart({
                merchandiseId: variant.reference,
                quantity: command.quantity,
                ...(sellingPlanId === undefined ? {} : { sellingPlanId }),
              })
            : await dependencies.cartSource.addCartLine(currentReference, {
                merchandiseId: variant.reference,
                quantity: command.quantity,
                ...(sellingPlanId === undefined ? {} : { sellingPlanId }),
              });
        return mapConfirmedMutationResult(result, dependencies, {
          kind: "add",
          variantReference: variant.reference,
          sellingPlanReference: sellingPlanId ?? null,
          quantity: command.quantity,
          beforeCart,
        });
      } catch (error: unknown) {
        return classifyFailure(error, dependencies.classifyError, true);
      }
    },

    async updateLine(reference, command): Promise<CartCommandResult> {
      if (reference === null) {
        return MISSING_RESULT;
      }

      if (
        !isActionKey(command.lineKey) ||
        !isPositiveGraphqlInt(command.quantity)
      ) {
        return REJECTED_RESULT;
      }

      const cart = await readCart(reference, dependencies);

      if (isFailureResult(cart)) {
        return cart;
      }

      if (cart === null) {
        return MISSING_RESULT;
      }

      const line = resolveLine(cart, command.lineKey, dependencies);

      if (
        line === null ||
        !line.instructions.canUpdateQuantity ||
        !satisfiesQuantityRule(command.quantity, line.merchandise.quantityRule)
      ) {
        return REJECTED_RESULT;
      }

      try {
        const result = await dependencies.cartSource.updateCartLine(reference, {
          lineId: line.reference,
          quantity: command.quantity,
        });
        return mapConfirmedMutationResult(result, dependencies, {
          kind: "update",
          variantReference: line.merchandise.reference,
          sellingPlanReference: line.sellingPlan?.reference ?? null,
          quantity: command.quantity,
          beforeCart: cart,
        });
      } catch (error: unknown) {
        return classifyFailure(error, dependencies.classifyError, true);
      }
    },

    async removeLine(reference, command): Promise<CartCommandResult> {
      if (reference === null) {
        return MISSING_RESULT;
      }

      if (!isActionKey(command.lineKey)) {
        return REJECTED_RESULT;
      }

      const cart = await readCart(reference, dependencies);

      if (isFailureResult(cart)) {
        return cart;
      }

      if (cart === null) {
        return MISSING_RESULT;
      }

      const line = resolveLine(cart, command.lineKey, dependencies);

      if (line === null || !line.instructions.canRemove) {
        return REJECTED_RESULT;
      }

      try {
        const result = await dependencies.cartSource.removeCartLine(reference, {
          lineId: line.reference,
        });
        return mapConfirmedMutationResult(result, dependencies);
      } catch (error: unknown) {
        return classifyFailure(error, dependencies.classifyError, true);
      }
    },

    async prepareCheckout(reference): Promise<CheckoutResult> {
      if (reference === null) {
        return EMPTY_RESULT;
      }

      try {
        const cart = await dependencies.cartSource.readCart(reference);
        if (cart === null) return MISSING_RESULT;
        if (cart.totalQuantity === 0) return EMPTY_RESULT;
        if (
          cart.lines.some(
            (line) =>
              line.merchandise.purchaseStatus !== "purchasable" ||
              !satisfiesQuantityRule(
                line.quantity,
                line.merchandise.quantityRule,
              ),
          )
        )
          return ERROR_RESULT;
        const checkout = await dependencies.cartSource.readCheckout(reference);

        if (checkout === null) {
          return MISSING_RESULT;
        }

        if (checkout.totalQuantity === 0) {
          return EMPTY_RESULT;
        }
        if (checkout.totalQuantity !== cart.totalQuantity) return ERROR_RESULT;

        const result = {
          kind: "ready" as const,
          totalQuantity: checkout.totalQuantity,
        } as Extract<CheckoutResult, { kind: "ready" }>;
        Object.defineProperty(result, "checkoutUrl", {
          value: checkout.checkoutUrl,
          enumerable: false,
          writable: false,
          configurable: false,
        });
        return Object.freeze(result);
      } catch (error: unknown) {
        const failure = classifyFailure(
          error,
          dependencies.classifyError,
          false,
        );
        return failure.kind === "ambiguous" || failure.kind === "rejected"
          ? ERROR_RESULT
          : failure;
      }
    },
  };

  return Object.freeze(application);
}

async function readCart(
  reference: CartReference,
  dependencies: CartApplicationDependencies,
): Promise<
  | Readonly<CartSnapshot>
  | null
  | typeof UNAVAILABLE_RESULT
  | typeof ERROR_RESULT
> {
  try {
    return await dependencies.cartSource.readCart(reference);
  } catch (error: unknown) {
    const failure = classifyFailure(error, dependencies.classifyError, false);
    return failure.kind === "ambiguous" || failure.kind === "rejected"
      ? ERROR_RESULT
      : failure;
  }
}

function resolveLine(
  cart: Readonly<CartSnapshot>,
  actionKey: string,
  dependencies: CartApplicationDependencies,
) {
  const matches = cart.lines.filter((line) =>
    dependencies.matchesLineActionKey(actionKey, line.reference),
  );
  return matches.length === 1 ? matches[0]! : null;
}

function mapMutationResult(
  result: AdapterCartMutationResult,
  dependencies: CartApplicationDependencies,
): CartCommandResult {
  if (result.cart === null) {
    return result.warnings.length > 0
      ? REJECTED_WITH_REVIEW_RESULT
      : REJECTED_RESULT;
  }

  const cart = result.cart;
  const kind =
    result.kind === "rejected"
      ? "rejected"
      : result.warnings.length > 0
        ? "warning"
        : "success";
  const mapped = {
    kind,
    cart: mapCart(cart, dependencies),
    reviewRequired: result.warnings.length > 0,
  } as CartCommandCartResult;

  Object.defineProperty(mapped, "sessionReference", {
    value: cart.reference,
    enumerable: false,
    writable: false,
    configurable: false,
  });
  return Object.freeze(mapped);
}

interface ExpectedPurchaseMutation {
  readonly kind: "add" | "update";
  readonly variantReference: CatalogVariantReference;
  readonly sellingPlanReference: CatalogSellingPlanReference | null;
  readonly quantity: number;
  readonly beforeCart: Readonly<CartSnapshot> | null;
}

function mapConfirmedMutationResult(
  result: AdapterCartMutationResult,
  dependencies: CartApplicationDependencies,
  expectedPurchase?: ExpectedPurchaseMutation,
): CartCommandResult {
  try {
    if (
      result.kind === "success" &&
      expectedPurchase !== undefined &&
      !confirmsPurchaseMutation(
        result.cart,
        result.warnings.length > 0,
        expectedPurchase,
      )
    ) {
      // Existing lines cannot mask a write to a different purchase mode. A
      // mismatch after an accepted write needs a fresh Cart review, not retry.
      return AMBIGUOUS_RESULT;
    }
    return mapMutationResult(result, dependencies);
  } catch {
    // Shopify has already accepted and answered the mutation. If local mapping
    // cannot preserve its authoritative state, telling the buyer to retry could
    // duplicate the write.
    return AMBIGUOUS_RESULT;
  }
}

function confirmsPurchaseMutation(
  afterCart: Readonly<CartSnapshot>,
  hasWarnings: boolean,
  expected: ExpectedPurchaseMutation,
): boolean {
  const before = purchaseQuantities(expected.beforeCart?.lines ?? []);
  const after = purchaseQuantities(afterCart.lines);
  if (before === null || after === null) return false;

  const target = purchaseIdentity(
    expected.variantReference,
    expected.sellingPlanReference,
  );
  const previousQuantity = before.get(target) ?? 0;
  const returnedQuantity = after.get(target);
  if (returnedQuantity === undefined) return false;

  const expectedQuantity =
    expected.kind === "add"
      ? previousQuantity + expected.quantity
      : expected.quantity;
  if (
    returnedQuantity > expectedQuantity ||
    (!hasWarnings && returnedQuantity !== expectedQuantity)
  )
    return false;

  // A Shopify warning may explain a reduced/adjusted quantity, which remains
  // visibly review-required. It never authorizes another plan or one-time
  // purchase to grow or appear instead of the requested identity.
  for (const [identity, quantity] of after) {
    if (identity === target) continue;
    const previous = before.get(identity) ?? 0;
    if (quantity > previous || (!hasWarnings && quantity !== previous))
      return false;
  }
  if (!hasWarnings) {
    for (const identity of before.keys()) {
      if (identity !== target && !after.has(identity)) return false;
    }
  }
  return true;
}

function purchaseQuantities(
  lines: Readonly<CartSnapshot>["lines"],
): Map<string, number> | null {
  const quantities = new Map<string, number>();
  for (const line of lines) {
    const identity = purchaseIdentity(
      line.merchandise.reference,
      line.sellingPlan?.reference ?? null,
    );
    if (quantities.has(identity)) return null;
    quantities.set(identity, line.quantity);
  }
  return quantities;
}

function purchaseIdentity(
  variant: CatalogVariantReference,
  plan: CatalogSellingPlanReference | null,
): string {
  return JSON.stringify([variant, plan]);
}

function mapCart(
  cart: Readonly<CartSnapshot>,
  dependencies: CartApplicationDependencies,
): CartViewModel {
  return Object.freeze({
    totalQuantity: cart.totalQuantity,
    subtotalLabel: formatJpy(cart.cost.subtotalAmount),
    totalLabel: formatJpy(cart.cost.totalAmount),
    lines: Object.freeze(
      cart.lines.map<CartLineViewModel>((line) =>
        Object.freeze({
          lineKey: dependencies.createLineActionKey(line.reference),
          productHandle: line.merchandise.productHandle,
          productTitle: line.merchandise.productTitle,
          variantTitle: line.merchandise.title,
          options: Object.freeze(
            line.merchandise.options.map((option) =>
              Object.freeze({ ...option }),
            ),
          ),
          quantity: line.quantity,
          unitPriceLabel: formatJpy(line.cost.amountPerQuantity),
          lineTotalLabel: formatJpy(line.cost.totalAmount),
          sellingPlan:
            line.sellingPlan === null
              ? null
              : Object.freeze({
                  name: line.sellingPlan.name,
                  description: line.sellingPlan.description,
                  deliveryLabel: formatDeliveryInterval(line.sellingPlan),
                  priceLabel: formatJpy(line.sellingPlan.price),
                }),
          purchaseState: line.merchandise.purchaseStatus,
          quantityRule: Object.freeze({ ...line.merchandise.quantityRule }),
          canUpdateQuantity: line.instructions.canUpdateQuantity,
          canRemove: line.instructions.canRemove,
          image:
            line.merchandise.image === null
              ? null
              : Object.freeze({
                  src: line.merchandise.image.url,
                  alt: line.merchandise.image.altText,
                  width: line.merchandise.image.width,
                  height: line.merchandise.image.height,
                }),
        }),
      ),
    ),
  });
}

function classifyFailure(
  error: unknown,
  classifyError: CartApplicationDependencies["classifyError"],
  mutation: boolean,
):
  | typeof UNAVAILABLE_RESULT
  | typeof ERROR_RESULT
  | typeof AMBIGUOUS_RESULT
  | typeof REJECTED_RESULT {
  const classification = classifyError(error);

  if (classification === "ambiguous") {
    return mutation ? AMBIGUOUS_RESULT : ERROR_RESULT;
  }

  if (classification === "retryable") {
    return UNAVAILABLE_RESULT;
  }

  if (classification === "nonretryable") {
    return ERROR_RESULT;
  }

  throw error;
}

function isFailureResult(
  value: unknown,
): value is typeof UNAVAILABLE_RESULT | typeof ERROR_RESULT {
  return value === UNAVAILABLE_RESULT || value === ERROR_RESULT;
}

function isValidAddCommand(command: AddCartLineCommand): boolean {
  return (
    isCanonicalProductHandle(command.productHandle) &&
    isActionKey(command.variantKey) &&
    isPositiveGraphqlInt(command.quantity)
  );
}

function isCanonicalProductHandle(value: string): boolean {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_PRODUCT_HANDLE_LENGTH &&
    PRODUCT_HANDLE_PATTERN.test(value)
  );
}

function isActionKey(value: string): boolean {
  return typeof value === "string" && /^v1_[A-Za-z0-9_-]{43}$/.test(value);
}

function isPositiveGraphqlInt(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= MAX_GRAPHQL_INT;
}

function satisfiesQuantityRule(
  quantity: number,
  rule: Readonly<{
    minimum: number;
    maximum: number | null;
    increment: number;
  }>,
): boolean {
  return (
    isPositiveGraphqlInt(quantity) &&
    isPositiveGraphqlInt(rule.minimum) &&
    isPositiveGraphqlInt(rule.increment) &&
    quantity >= rule.minimum &&
    (rule.maximum === null ||
      (isPositiveGraphqlInt(rule.maximum) && quantity <= rule.maximum)) &&
    quantity % rule.increment === 0
  );
}

function formatJpy(money: Readonly<CatalogMoney>): string {
  if (money.currency !== "JPY") {
    throw new Error("Unsupported storefront currency.");
  }

  return `¥${money.minorUnits.toLocaleString("en-US")}`;
}
