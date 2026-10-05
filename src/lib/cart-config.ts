import "server-only";

export const SHOPIFY_CHECKOUT_HOST_ENV = "SHOPIFY_CHECKOUT_HOST" as const;

export type CheckoutHostEnvironment = Readonly<
  Record<string, string | undefined>
>;

const HOST_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:\:[1-9][0-9]{0,4})?$/;

export function readCheckoutHost(
  environment: CheckoutHostEnvironment = process.env,
): string {
  const value = environment[SHOPIFY_CHECKOUT_HOST_ENV];

  if (
    value === undefined ||
    value.length === 0 ||
    value.length > 259 ||
    value.trim() !== value ||
    value.toLowerCase() !== value ||
    !HOST_PATTERN.test(value)
  ) {
    throw checkoutConfigurationError();
  }

  try {
    const url = new URL(`https://${value}`);

    if (
      url.host !== value ||
      url.hostname.length > 253 ||
      url.username.length > 0 ||
      url.password.length > 0 ||
      url.pathname !== "/" ||
      url.search.length > 0 ||
      url.hash.length > 0
    ) {
      throw checkoutConfigurationError();
    }
  } catch {
    throw checkoutConfigurationError();
  }

  return value;
}

export function isCheckoutConfigured(
  environment: CheckoutHostEnvironment = process.env,
): boolean {
  try {
    readCheckoutHost(environment);
    return true;
  } catch {
    return false;
  }
}

function checkoutConfigurationError(): Error {
  return new Error("Cart checkout configuration is invalid.");
}
