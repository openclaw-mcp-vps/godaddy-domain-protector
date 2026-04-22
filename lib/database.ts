import fs from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

const purchaseSchema = z.object({
  email: z.string().email(),
  source: z.string(),
  eventId: z.string(),
  purchasedAt: z.string()
});

const lookupSchema = z.object({
  id: z.string(),
  ownerEmail: z.string().email().optional(),
  checkedAt: z.string(),
  domains: z.array(z.string()),
  availableCount: z.number().int().nonnegative(),
  takenCount: z.number().int().nonnegative()
});

const storeSchema = z.object({
  purchases: z.array(purchaseSchema),
  lookups: z.array(lookupSchema)
});

type PurchaseRecord = z.infer<typeof purchaseSchema>;
type LookupRecord = z.infer<typeof lookupSchema>;
type Store = z.infer<typeof storeSchema>;

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

let writeChain: Promise<unknown> = Promise.resolve();

async function ensureStoreFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    const initialStore: Store = { purchases: [], lookups: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialStore, null, 2), "utf8");
  }
}

async function readStore(): Promise<Store> {
  await ensureStoreFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return storeSchema.parse(parsed);
  } catch {
    const recovered: Store = { purchases: [], lookups: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(recovered, null, 2), "utf8");
    return recovered;
  }
}

async function writeStore(nextStore: Store): Promise<void> {
  await ensureStoreFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(nextStore, null, 2), "utf8");
}

async function updateStore(mutator: (store: Store) => Store | Promise<Store>): Promise<Store> {
  const run = async (): Promise<Store> => {
    const current = await readStore();
    const updated = await mutator(current);
    await writeStore(updated);
    return updated;
  };

  writeChain = writeChain.then(run, run);
  return writeChain as Promise<Store>;
}

export async function findPurchaseByEmail(email: string): Promise<PurchaseRecord | null> {
  const normalized = email.trim().toLowerCase();
  const store = await readStore();
  return store.purchases.find((purchase) => purchase.email === normalized) ?? null;
}

export async function hasProcessedWebhookEvent(eventId: string): Promise<boolean> {
  const store = await readStore();
  return store.purchases.some((purchase) => purchase.eventId === eventId);
}

export async function upsertPurchase(record: PurchaseRecord): Promise<void> {
  const normalized: PurchaseRecord = {
    ...record,
    email: record.email.trim().toLowerCase()
  };

  await updateStore((store) => {
    const existingIndex = store.purchases.findIndex((purchase) => purchase.email === normalized.email);

    if (existingIndex >= 0) {
      store.purchases[existingIndex] = normalized;
    } else {
      store.purchases.push(normalized);
    }

    return store;
  });
}

export async function addLookupRecord(record: LookupRecord): Promise<void> {
  await updateStore((store) => {
    const capped = store.lookups.slice(-199);
    capped.push(record);
    store.lookups = capped;
    return store;
  });
}
