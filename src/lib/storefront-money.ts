import type { StorefrontCurrency } from "./storefront-destination.ts";

export function isStorefrontCurrency(
  value: unknown,
): value is StorefrontCurrency {
  return value === "JPY" || value === "USD" || value === "SGD";
}

export function formatStorefrontMoney(money: {
  currency: string;
  minorUnits: number;
}): string {
  if (
    !isStorefrontCurrency(money.currency) ||
    !Number.isSafeInteger(money.minorUnits) ||
    money.minorUnits < 0 ||
    Object.is(money.minorUnits, -0)
  ) {
    throw new Error("Unsupported storefront money.");
  }
  if (money.currency === "JPY")
    return `¥${money.minorUnits.toLocaleString("en-US")}`;
  const formatter = new Intl.NumberFormat("en", {
    style: "currency",
    currency: money.currency,
    currencyDisplay: "code",
  });
  const units = BigInt(money.minorUnits);
  return formatter
    .formatToParts(units / BigInt(100))
    .map((part) =>
      part.type === "fraction"
        ? (units % BigInt(100)).toString().padStart(2, "0")
        : part.value,
    )
    .join("");
}
