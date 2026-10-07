import "server-only";
import { cookies } from "next/headers";
import { resolveLocale } from "./types";

export async function readStorefrontLocale() {
  return resolveLocale((await cookies()).get("atoma-locale")?.value);
}
