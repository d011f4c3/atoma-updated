import { CATALOG_SHOP_DOMAIN } from "./catalog-model.ts";

export const SHOPIFY_CHECKOUT_HOST_ENV = "SHOPIFY_CHECKOUT_HOST" as const;
export const TEST_CHECKOUT_ENABLED_ENV = "ATOMA_TEST_CHECKOUT_ENABLED" as const;
export type CheckoutHostEnvironment = Readonly<
  Record<string, string | undefined>
>;

const HOST_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:\:[1-9][0-9]{0,4})?$/;

export function readCheckoutHost(environment: CheckoutHostEnvironment): string {
  const value = environment[SHOPIFY_CHECKOUT_HOST_ENV];
  try {
    if (!value || value.length > 259 || !HOST_PATTERN.test(value))
      throw new Error();
    const url = new URL(`https://${value}`);
    if (
      url.host !== value ||
      url.hostname.length > 253 ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw new Error();
    return value;
  } catch {
    throw new Error("Cart checkout configuration is invalid.");
  }
}

/** Only the explicitly enabled local test shop may disclose a checkout handoff. */
export function isLocalTestCheckoutRequest(
  request: Request,
  environment: CheckoutHostEnvironment,
): boolean {
  if (
    environment[TEST_CHECKOUT_ENABLED_ENV] !== "true" ||
    !["development", "test"].includes(environment.NODE_ENV ?? "") ||
    environment.SHOPIFY_STORE_DOMAIN !== CATALOG_SHOP_DOMAIN
  )
    return false;
  try {
    if (readCheckoutHost(environment) !== CATALOG_SHOP_DOMAIN) return false;
    const protocol = new URL(request.url).protocol;
    const host = request.headers.get("host");
    if (!host || !["http:", "https:"].includes(protocol)) return false;
    const origin = new URL(`${protocol}//${host}`);
    if (
      origin.host !== host ||
      !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname) ||
      origin.username ||
      origin.password ||
      origin.pathname !== "/" ||
      origin.search ||
      origin.hash
    )
      return false;
    // Next supplies these locally. They must not override the actual Host.
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProtocol = request.headers.get("x-forwarded-proto");
    return (
      !request.headers.has("forwarded") &&
      (forwardedHost === null || forwardedHost === host) &&
      (forwardedProtocol === null || `${forwardedProtocol}:` === protocol)
    );
  } catch {
    return false;
  }
}

export function isSameOriginCheckoutPost(request: Request): boolean {
  return (
    request.method === "POST" &&
    request.headers.get("origin") ===
      `${new URL(request.url).protocol}//${request.headers.get("host")}` &&
    !["cross-site", "same-site"].includes(
      request.headers.get("sec-fetch-site") ?? "",
    )
  );
}

/** Defense in depth around the adapter's exact-host validation. */
export function isExpectedCheckoutUrl(
  value: string,
  expectedHost: string,
): boolean {
  try {
    const url = new URL(value);
    return (
      value.length <= 8192 &&
      !/[\u0000-\u0020\u007f]/.test(value) &&
      url.protocol === "https:" &&
      url.host === expectedHost &&
      !url.username &&
      !url.password &&
      !url.hash
    );
  } catch {
    return false;
  }
}
