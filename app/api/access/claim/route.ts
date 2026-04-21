import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { issueAccessToken } from "@/lib/access";
import { ACCESS_COOKIE_NAME } from "@/lib/constants";
import { hasActivePayment } from "@/lib/database";

const claimSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter the same email used during checkout."),
});

export async function POST(request: NextRequest) {
  let body: z.infer<typeof claimSchema>;

  try {
    body = claimSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }

    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const paid = await hasActivePayment(body.email);

  if (!paid) {
    return NextResponse.json(
      {
        error:
          "No completed payment found for that email yet. If you just paid, wait 30 seconds for Stripe webhook sync.",
      },
      { status: 404 },
    );
  }

  const token = issueAccessToken(body.email);
  const response = NextResponse.json({ message: "Access unlocked. Redirecting to dashboard." });

  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
