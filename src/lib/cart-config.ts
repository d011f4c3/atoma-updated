import "server-only";

import {
  readCheckoutHost as readHost,
  type CheckoutHostEnvironment,
} from "./checkout-policy.ts";
export {
  SHOPIFY_CHECKOUT_HOST_ENV,
  isLocalTestCheckoutRequest,
} from "./checkout-policy.ts";
export type { CheckoutHostEnvironment } from "./checkout-policy.ts";

export function readCheckoutHost(
  environment: CheckoutHostEnvironment = process.env,
): string {
  return readHost(environment);
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
