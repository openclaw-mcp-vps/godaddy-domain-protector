import crypto from "crypto";

export interface AccessPayload {
  email: string;
  iat: number;
  exp: number;
}

function getSigningSecret() {
  return (
    process.env.STRIPE_WEBHOOK_SECRET ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "local-dev-access-secret"
  );
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signSegment(payloadSegment: string) {
  return crypto.createHmac("sha256", getSigningSecret()).update(payloadSegment).digest("base64url");
}

function timingSafeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function issueAccessToken(email: string, lifetimeDays = 30) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessPayload = {
    email: email.toLowerCase().trim(),
    iat: now,
    exp: now + lifetimeDays * 24 * 60 * 60,
  };

  const payloadSegment = base64UrlEncode(JSON.stringify(payload));
  const signature = signSegment(payloadSegment);

  return `${payloadSegment}.${signature}`;
}

export function verifyAccessToken(token?: string | null): AccessPayload | null {
  if (!token) {
    return null;
  }

  const [payloadSegment, providedSignature] = token.split(".");

  if (!payloadSegment || !providedSignature) {
    return null;
  }

  const expectedSignature = signSegment(payloadSegment);

  if (!timingSafeEqual(expectedSignature, providedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadSegment)) as AccessPayload;
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp <= now || !payload.email) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
