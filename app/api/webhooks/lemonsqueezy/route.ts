import { NextResponse } from "next/server";

import { hasProcessedWebhookEvent, upsertPurchase } from "@/lib/database";
import { parseWebhookEvent, verifyStripeWebhookSignature } from "@/lib/lemonsqueezy";

function extractCustomerEmail(eventType: string, object: Record<string, unknown>): string | null {
  if (eventType === "checkout.session.completed") {
    const customerEmail = typeof object.customer_email === "string" ? object.customer_email : null;
    if (customerEmail) {
      return customerEmail;
    }

    const customerDetails = object.customer_details as { email?: unknown } | undefined;
    if (customerDetails && typeof customerDetails.email === "string") {
      return customerDetails.email;
    }
  }

  if (eventType === "payment_intent.succeeded") {
    const receiptEmail = typeof object.receipt_email === "string" ? object.receipt_email : null;
    if (receiptEmail) {
      return receiptEmail;
    }
  }

  return null;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  const isVerified = verifyStripeWebhookSignature(rawBody, signature, secret);
  if (!isVerified) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const event = parseWebhookEvent(rawBody);
  if (!event) {
    return NextResponse.json({ error: "Invalid event payload." }, { status: 400 });
  }

  const alreadyProcessed = await hasProcessedWebhookEvent(event.id);
  if (alreadyProcessed) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const email = extractCustomerEmail(event.type, event.data.object);

  if (email) {
    await upsertPurchase({
      email,
      source: "stripe",
      eventId: event.id,
      purchasedAt: new Date().toISOString()
    });
  }

  return NextResponse.json({ ok: true });
}
