import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { Pool } from "pg";

interface PaymentInsert {
  email: string;
  eventId?: string;
  payload: unknown;
}

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("localhost") ? undefined : { rejectUnauthorized: false },
    })
  : null;

let tablesInitialized = false;
const fallbackPath = path.join(process.cwd(), ".data", "payments.json");
const fallbackCache = new Set<string>();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function ensureTables() {
  if (!pool || tablesInitialized) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_payments (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      event_id TEXT UNIQUE,
      payload JSONB NOT NULL,
      paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (email)
    );
  `);

  tablesInitialized = true;
}

async function loadFallbackPayments() {
  try {
    const content = await readFile(fallbackPath, "utf8");
    const parsed = JSON.parse(content) as { payments: string[] };

    for (const email of parsed.payments) {
      fallbackCache.add(normalizeEmail(email));
    }
  } catch {
    await mkdir(path.dirname(fallbackPath), { recursive: true });
    await writeFile(fallbackPath, JSON.stringify({ payments: [] }, null, 2), "utf8");
  }
}

let fallbackLoaded = false;

async function ensureFallbackLoaded() {
  if (fallbackLoaded) {
    return;
  }

  await loadFallbackPayments();
  fallbackLoaded = true;
}

async function persistFallback() {
  await mkdir(path.dirname(fallbackPath), { recursive: true });
  await writeFile(
    fallbackPath,
    JSON.stringify({ payments: [...fallbackCache].sort() }, null, 2),
    "utf8",
  );
}

export async function storeSuccessfulPayment(input: PaymentInsert) {
  const email = normalizeEmail(input.email);

  if (pool) {
    await ensureTables();
    await pool.query(
      `
      INSERT INTO customer_payments (email, event_id, payload)
      VALUES ($1, $2, $3)
      ON CONFLICT (email)
      DO UPDATE SET
        payload = EXCLUDED.payload,
        event_id = COALESCE(EXCLUDED.event_id, customer_payments.event_id),
        paid_at = NOW();
      `,
      [email, input.eventId ?? null, JSON.stringify(input.payload)],
    );

    return;
  }

  await ensureFallbackLoaded();
  fallbackCache.add(email);
  await persistFallback();
}

export async function hasActivePayment(email: string) {
  const normalized = normalizeEmail(email);

  if (pool) {
    await ensureTables();
    const result = await pool.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM customer_payments WHERE email = $1) AS exists",
      [normalized],
    );

    return Boolean(result.rows[0]?.exists);
  }

  await ensureFallbackLoaded();
  return fallbackCache.has(normalized);
}
