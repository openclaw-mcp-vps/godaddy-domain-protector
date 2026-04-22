import crypto from "node:crypto";

import type { NextRequest } from "next/server";

export const ACCESS_COOKIE_NAME = "gdp_access";
export const ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface AccessTokenPayload {
  email: string;
  grantedAt: number;
  exp: number;
}

function getAuthSecret(): string {
  return process.env.ACCESS_TOKEN_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "dev-insecure-change-me";
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

export function createAccessToken(email: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessTokenPayload = {
    email: email.trim().toLowerCase(),
    grantedAt: now,
    exp: now + ACCESS_MAX_AGE_SECONDS
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAccessToken(token: string | undefined | null): AccessTokenPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expected = sign(encodedPayload);
  const candidateBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (candidateBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(candidateBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(encodedPayload)) as AccessTokenPayload;

    if (!parsed.email || typeof parsed.exp !== "number" || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getAccessFromRequest(request: NextRequest): AccessTokenPayload | null {
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  return verifyAccessToken(token);
}

export function makeAccessCookieValue(email: string): string {
  return createAccessToken(email);
}
