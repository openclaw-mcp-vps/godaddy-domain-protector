import { NextResponse } from "next/server";

import { upsertPurchase, verifyLemonSqueezyWebhook, type PurchaseRecord } from "@/lib/lemonsqueezy";

type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
  };
  data?: {
    id?: string;
    attributes?: {
      user_email?: string;
      refunded?: boolean;
    };
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyLemonSqueezyWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as LemonWebhookPayload;
  const eventName = payload.meta?.event_name;
  const orderId = payload.data?.id;
  const email = payload.data?.attributes?.user_email;

  if (!eventName || !orderId || !email) {
    return NextResponse.json({ ok: true });
  }

  const status: PurchaseRecord["status"] =
    eventName === "order_refunded" || payload.data?.attributes?.refunded ? "refunded" : "paid";

  await upsertPurchase({
    orderId,
    email,
    createdAt: new Date().toISOString(),
    status
  });

  return NextResponse.json({ ok: true });
}
