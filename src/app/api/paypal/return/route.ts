import { NextResponse } from "next/server";
import { captureOrder, syncSubscription } from "@/lib/paypal";
import { SITE } from "@/lib/config";

// Retour du client après validation sur PayPal
export async function GET(req: Request) {
  const u = new URL(req.url);
  const origin = process.env.NEXT_PUBLIC_SITE_URL ? SITE.url : u.origin;
  try {
    if (u.searchParams.get("kind") === "order") {
      const orderId = u.searchParams.get("token");
      if (!orderId || !(await captureOrder(orderId))) return NextResponse.redirect(`${origin}/tarifs?paypal=error`);
    } else {
      const subId = u.searchParams.get("subscription_id");
      if (!subId || !(await syncSubscription(subId))) return NextResponse.redirect(`${origin}/tarifs?paypal=error`);
    }
    return NextResponse.redirect(`${origin}/compte?success=1&via=paypal`);
  } catch (e) {
    console.error("[paypal] retour", e);
    return NextResponse.redirect(`${origin}/tarifs?paypal=error`);
  }
}
