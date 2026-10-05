export type CartPurchaseState = "purchasable" | "not_purchasable";

export interface CartImageViewModel {
  readonly src: string;
  readonly alt: string | null;
  readonly width: number | null;
  readonly height: number | null;
}

export interface CartOptionViewModel {
  readonly name: string;
  readonly value: string;
}

export interface CartQuantityRuleViewModel {
  readonly minimum: number;
  readonly maximum: number | null;
  readonly increment: number;
}

export interface CartLineViewModel {
  /** Non-reversible action locator; never a Shopify resource identifier. */
  readonly lineKey: string;
  readonly productHandle: string;
  readonly productTitle: string;
  readonly variantTitle: string;
  readonly options: readonly CartOptionViewModel[];
  readonly quantity: number;
  readonly unitPriceLabel: string;
  readonly lineTotalLabel: string;
  readonly purchaseState: CartPurchaseState;
  readonly quantityRule: CartQuantityRuleViewModel;
  readonly canUpdateQuantity: boolean;
  readonly canRemove: boolean;
  readonly image: CartImageViewModel | null;
  readonly sellingPlan?: Readonly<{
    name: string;
    description: string | null;
    deliveryLabel: string;
    priceLabel: string;
  }> | null;
}

export interface CartViewModel {
  readonly totalQuantity: number;
  readonly subtotalLabel: string;
  readonly totalLabel: string;
  readonly lines: readonly CartLineViewModel[];
}

export type CartLoadResult =
  | Readonly<{ kind: "empty" }>
  | Readonly<{ kind: "ready"; cart: CartViewModel }>
  | Readonly<{ kind: "missing" }>
  | Readonly<{ kind: "unavailable" }>
  | Readonly<{ kind: "error" }>;

export type CartViewState = Readonly<{ kind: "loading" }> | CartLoadResult;

export type CartNotice =
  "added" | "adjusted" | "updated" | "removed" | "review" | "not_changed";

/** API projection; opaque Cart references and checkout URLs never serialize. */
export interface CartResponse {
  kind:
    | "empty"
    | "ready"
    | "missing"
    | "unavailable"
    | "error"
    | "success"
    | "warning"
    | "rejected"
    | "ambiguous";
  cart?: CartViewModel;
  reviewRequired?: boolean;
  checkoutEnabled: boolean;
}
export type CartLine = CartLineViewModel;
export type CartData = CartViewModel;
