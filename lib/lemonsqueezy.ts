import crypto from "node:crypto";

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

export function getStripePaymentLink(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "";
}

function parseStripeSignature(signatureHeader: string): { timestamp: number; signatures: string[] } | null {
  const parts = signatureHeader.split(",").map((entry) => entry.trim());
  let timestamp: number | null = null;
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (!key || !value) {
      continue;
    }

    if (key === "t") {
      timestamp = Number.parseInt(value, 10);
      continue;
    }

    if (key === "v1") {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    return null;
  }

  return { timestamp, signatures };
}

function secureCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function verifyStripeWebhookSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  const parsed = parseStripeSignature(signatureHeader);
  if (!parsed) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const maxSkewInSeconds = 5 * 60;

  if (Math.abs(now - parsed.timestamp) > maxSkewInSeconds) {
    return false;
  }

  const payload = `${parsed.timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");

  return parsed.signatures.some((candidate) => secureCompare(candidate, expected));
}

export function parseWebhookEvent(rawBody: string): StripeWebhookEvent | null {
  try {
    const parsed = JSON.parse(rawBody) as StripeWebhookEvent;
    if (!parsed?.id || !parsed?.type || !parsed?.data?.object) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
