import { prepareCurrentCheckout } from "@/lib/cart-server";
import { handleCheckoutStudyRequest } from "@/lib/checkout-study-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleCheckoutStudyRequest(request, {
    environment: process.env,
    prepareCheckout: prepareCurrentCheckout,
  });
}
