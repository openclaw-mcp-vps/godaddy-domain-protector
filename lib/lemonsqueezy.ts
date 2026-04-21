import crypto from "crypto";

export interface StripeEventEnvelope {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
  created: number;
}

function timingSafeHexCompare(expected: string, candidate: string) {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const candidateBuffer = Buffer.from(candidate, "utf8");

  if (expectedBuffer.length !== candidateBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, candidateBuffer);
}

function parseStripeSignatureHeader(header: string) {
  const entries = header.split(",").map((part) => part.trim());
  const result: Record<string, string[]> = {};

  for (const entry of entries) {
    const [key, value] = entry.split("=");
    if (!key || !value) {
      continue;
    }

    if (!result[key]) {
      result[key] = [];
    }

    result[key].push(value);
  }

  return result;
}

export function verifyStripeWebhookSignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !signatureHeader) {
    return false;
  }

  const parsed = parseStripeSignatureHeader(signatureHeader);
  const timestamp = parsed.t?.[0];
  const signatures = parsed.v1 ?? [];

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");

  return signatures.some((signature) => timingSafeHexCompare(expected, signature));
}

function stringValue(candidate: unknown) {
  return typeof candidate === "string" ? candidate : null;
}

export function isRecognizedPaidEvent(eventType: string) {
  return [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "invoice.paid",
    "payment_intent.succeeded",
    "charge.succeeded",
  ].includes(eventType);
}

export function extractPayerEmail(event: StripeEventEnvelope) {
  const object = event.data.object;

  const customerDetails = object.customer_details as { email?: unknown } | undefined;
  const billingDetails = object.billing_details as { email?: unknown } | undefined;

  return (
    stringValue(customerDetails?.email) ||
    stringValue(object.customer_email) ||
    stringValue(object.receipt_email) ||
    stringValue(billingDetails?.email)
  );
}
