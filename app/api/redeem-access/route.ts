import { NextResponse } from "next/server";
import { z } from "zod";

import { buildAccessCookie, createAccessToken } from "@/lib/auth";
import { lookupPurchase } from "@/lib/lemonsqueezy";

const redeemSchema = z.object({
  orderId: z.string().min(1),
  email: z.string().email()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = redeemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid order payload." }, { status: 400 });
    }

    const purchase = await lookupPurchase(parsed.data.orderId, parsed.data.email);

    if (!purchase || purchase.status !== "paid") {
      return NextResponse.json(
        {
          error:
            "No paid order found for that email and order ID yet. Wait for webhook processing, then try again."
        },
        { status: 403 }
      );
    }

    const token = createAccessToken(parsed.data.orderId, parsed.data.email);
    const cookie = buildAccessCookie(token);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch {
    return NextResponse.json({ error: "Unable to redeem access." }, { status: 500 });
  }
}
