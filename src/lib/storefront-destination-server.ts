import "server-only";

import { cookies, headers } from "next/headers";
import {
  DESTINATION_COOKIE,
  parseShippingCountry,
  resolveDestinationPreference,
  type DestinationPreference,
  type ShippingCountryCode,
} from "./storefront-destination";

/** A deployed Vercel hint is advisory only; an explicit choice always wins. */
export async function readStorefrontDestination(): Promise<DestinationPreference> {
  const saved = (await cookies()).get(DESTINATION_COOKIE)?.value;
  const trustHint = process.env.VERCEL === "1";
  const hint = trustHint ? (await headers()).get("x-vercel-ip-country") : null;
  return resolveDestinationPreference(saved, hint, trustHint);
}

/** Call only after a confirmed destination change in a same-origin handler. */
export async function persistStorefrontDestination(
  countryCode: ShippingCountryCode,
): Promise<void> {
  if (!parseShippingCountry(countryCode))
    throw new Error("Invalid destination.");
  (await cookies()).set(DESTINATION_COOKIE, countryCode, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}
