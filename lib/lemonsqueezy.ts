import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "purchases.json");

export type PurchaseRecord = {
  orderId: string;
  email: string;
  createdAt: string;
  status: "paid" | "refunded";
};

async function ensureDataFile() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

export async function readPurchases(): Promise<PurchaseRecord[]> {
  await ensureDataFile();
  const contents = await fs.readFile(DATA_FILE, "utf8");
  try {
    return JSON.parse(contents) as PurchaseRecord[];
  } catch {
    return [];
  }
}

export async function upsertPurchase(record: PurchaseRecord) {
  const purchases = await readPurchases();
  const idx = purchases.findIndex((item) => item.orderId === record.orderId && item.email === record.email);
  if (idx >= 0) purchases[idx] = record;
  else purchases.push(record);
  await fs.writeFile(DATA_FILE, JSON.stringify(purchases, null, 2), "utf8");
}

export async function lookupPurchase(orderId: string, email: string) {
  const purchases = await readPurchases();
  return purchases.find((item) => item.orderId === orderId && item.email.toLowerCase() === email.toLowerCase()) || null;
}

export function verifyLemonSqueezyWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return digest === signature;
}

export function buildCheckoutUrl(email?: string) {
  const storeId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID;
  const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;

  if (!storeId || !productId) {
    return null;
  }

  const base = `https://app.lemonsqueezy.com/checkout/buy/${productId}`;
  if (!email) return base;
  const params = new URLSearchParams({ checkout: "custom", email });
  return `${base}?${params.toString()}`;
}
