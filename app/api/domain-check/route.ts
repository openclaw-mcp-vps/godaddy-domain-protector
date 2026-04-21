import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { verifyAccessToken } from "@/lib/access";
import { ACCESS_COOKIE_NAME } from "@/lib/constants";
import { consumeDomainCheckRateLimit } from "@/lib/rate-limiter";
import { checkDomainAvailability } from "@/lib/whois-lookup";

const requestSchema = z.object({
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^(?=.{3,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/,
      "Provide a valid root domain (example: velocitylabs.io)",
    ),
});

function extractClientIp(request: NextRequest) {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const access = verifyAccessToken(accessToken);

  if (!access) {
    return NextResponse.json({ error: "Payment required. Unlock access from the landing page first." }, { status: 402 });
  }

  const rateKey = `${access.email}:${extractClientIp(request)}`;
  const rateLimit = await consumeDomainCheckRateLimit(rateKey);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit reached. Retry in ${rateLimit.retryAfterSeconds}s.`,
      },
      {
        status: 429,
      },
    );
  }

  let payload: z.infer<typeof requestSchema>;

  try {
    payload = requestSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request body." }, { status: 400 });
    }

    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  try {
    const result = await checkDomainAvailability(payload.domain);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        error: "Lookup failed across all proxy routes. Please retry in a moment.",
      },
      { status: 502 },
    );
  }
}
