import crypto from "crypto";

const COOKIE_NAME = "gdp_access";
const ACCESS_DAYS = 30;

function getSecret() {
  return process.env.ACCESS_TOKEN_SECRET || process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "dev-secret-change-me";
}

export function createAccessToken(orderId: string, email: string) {
  const expiresAt = Date.now() + ACCESS_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${orderId}:${email.toLowerCase()}:${expiresAt}`;
  const signature = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}:${signature}`;
}

export function verifyAccessToken(token: string | undefined | null) {
  if (!token) return false;

  const [orderId, email, expiresAtRaw, signature] = token.split(":");
  if (!orderId || !email || !expiresAtRaw || !signature) return false;

  const payload = `${orderId}:${email.toLowerCase()}:${expiresAtRaw}`;
  const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  if (expected !== signature) return false;

  const expiresAt = Number(expiresAtRaw);
  if (Number.isNaN(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}

export function buildAccessCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ACCESS_DAYS * 24 * 60 * 60
    }
  };
}

export const accessCookieName = COOKIE_NAME;
