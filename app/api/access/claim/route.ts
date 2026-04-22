import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ACCESS_COOKIE_NAME, ACCESS_MAX_AGE_SECONDS, makeAccessCookieValue } from "@/lib/auth";
import { findPurchaseByEmail } from "@/lib/database";

const claimSchema = z.object({
  email: z.string().email()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = claimSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const purchase = await findPurchaseByEmail(normalizedEmail);

  if (!purchase) {
    return NextResponse.json(
      {
        error: "No completed purchase found for this email yet. If you just paid, wait 10-20 seconds for webhook sync."
      },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: ACCESS_COOKIE_NAME,
    value: makeAccessCookieValue(normalizedEmail),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ACCESS_MAX_AGE_SECONDS,
    path: "/"
  });

  return NextResponse.json({ ok: true });
}
