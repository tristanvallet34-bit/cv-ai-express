import { getStripe, demoMode } from "@/lib/stripe";
import { paypalEnabled } from "@/lib/paypal";
import { json } from "@/lib/http";

export async function GET() {
  const [stripe, paypal, demo] = await Promise.all([getStripe(), paypalEnabled(), demoMode()]);
  return json({ stripe: !!stripe || (demo && !paypal), paypal });
}
