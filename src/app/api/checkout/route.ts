import { prepareCurrentCheckout } from "@/lib/cart-server";
import { handleCheckoutRequest } from "@/lib/checkout-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleCheckoutRequest(request, {
    environment: process.env,
    prepareCheckout: prepareCurrentCheckout,
  });
}
