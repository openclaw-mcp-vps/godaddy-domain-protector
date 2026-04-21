import { NextRequest, NextResponse } from "next/server";

import {
  extractPayerEmail,
  isRecognizedPaidEvent,
  type StripeEventEnvelope,
  verifyStripeWebhookSignature,
} from "@/lib/lemonsqueezy";
import { storeSuccessfulPayment } from "@/lib/database";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const stripeSignature = request.headers.get("stripe-signature");

  if (!verifyStripeWebhookSignature(rawBody, stripeSignature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let event: StripeEventEnvelope;

  try {
    event = JSON.parse(rawBody) as StripeEventEnvelope;
  } catch {
    return NextResponse.json({ error: "Malformed webhook payload." }, { status: 400 });
  }

  if (!isRecognizedPaidEvent(event.type)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const email = extractPayerEmail(event);

  if (!email) {
    return NextResponse.json({ error: "Paid event did not contain customer email." }, { status: 422 });
  }

  await storeSuccessfulPayment({
    email,
    eventId: event.id,
    payload: event,
  });

  return NextResponse.json({ received: true, email });
}
