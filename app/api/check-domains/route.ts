import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ACCESS_COOKIE_NAME, verifyAccessToken } from "@/lib/auth";
import { addLookupRecord } from "@/lib/database";
import { getDomainProxyService } from "@/lib/domain-proxy";

const requestSchema = z.object({
  domains: z.array(z.string().min(3)).min(1).max(100)
});

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const access = verifyAccessToken(token);

  if (!access) {
    return NextResponse.json({ error: "Payment required" }, { status: 402 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  const lookupService = getDomainProxyService();
  const results = await lookupService.checkDomains(parsed.data.domains);

  await addLookupRecord({
    id: randomUUID(),
    ownerEmail: access.email,
    checkedAt: new Date().toISOString(),
    domains: results.map((result) => result.domain),
    availableCount: results.filter((result) => result.status === "available").length,
    takenCount: results.filter((result) => result.status === "taken").length
  });

  return NextResponse.json({
    results,
    summary: {
      total: results.length,
      available: results.filter((result) => result.status === "available").length,
      taken: results.filter((result) => result.status === "taken").length,
      unknown: results.filter((result) => result.status === "unknown").length
    }
  });
}
