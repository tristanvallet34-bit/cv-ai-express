import { verifyWebhook, handleWebhook, paypalEnabled } from "@/lib/paypal";

export async function POST(req: Request) {
  if (!(await paypalEnabled())) return new Response("PayPal non configuré", { status: 503 });
  const event = await req.json().catch(() => null);
  if (!event?.event_type) return new Response("Événement invalide", { status: 400 });
  try {
    if (!(await verifyWebhook(req.headers, event))) return new Response("Signature invalide", { status: 400 });
    await handleWebhook(event);
  } catch (e) {
    console.error("[paypal] webhook", event.event_type, e);
    return new Response("Erreur de traitement", { status: 500 });
  }
  return new Response("ok");
}
