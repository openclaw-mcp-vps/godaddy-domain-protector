import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { accessCookieName, verifyAccessToken } from "@/lib/auth";
import { checkDomains } from "@/lib/domain-checker";

const payloadSchema = z.object({
  domains: z.array(z.string()).min(1).max(50)
});

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(accessCookieName)?.value;

  if (!verifyAccessToken(token)) {
    return NextResponse.json({ error: "Paid access required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid domain list." }, { status: 400 });
    }

    const results = await checkDomains(parsed.data.domains);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Unable to complete domain checks." }, { status: 500 });
  }
}
