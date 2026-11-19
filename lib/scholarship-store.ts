import { Pool } from 'pg';
import type { ScholarshipSeed } from '@/lib/match';

declare global {
  var __sakukampusScholarshipPool: Pool | undefined;
  var __sakukampusScholarshipSchema: Promise<void> | undefined;
}

export type PublishedScholarship = {
  scholarship: ScholarshipSeed;
  sourceUrl: string;
  contentHash: string;
};

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  globalThis.__sakukampusScholarshipPool ??= new Pool({
    connectionString,
    max: 3,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  });

  return globalThis.__sakukampusScholarshipPool;
}

async function ensureSchema(pool: Pool) {
  globalThis.__sakukampusScholarshipSchema ??= pool
    .query(`
      CREATE TABLE IF NOT EXISTS sakukampus_auto_scholarships (
        source_url TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        payload JSONB NOT NULL,
        evidence JSONB NOT NULL,
        content_hash TEXT NOT NULL,
        last_verified_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    .then(() => undefined)
    .catch((error: unknown) => {
      globalThis.__sakukampusScholarshipSchema = undefined;
      throw error;
    });

  await globalThis.__sakukampusScholarshipSchema;
}

export async function getPublishedScholarships(): Promise<PublishedScholarship[]> {
  const pool = getPool();
  if (!pool) return [];

  await ensureSchema(pool);
  const result = await pool.query<{
    source_url: string;
    payload: ScholarshipSeed;
    content_hash: string;
  }>(
    `SELECT source_url, payload, content_hash
     FROM sakukampus_auto_scholarships
     ORDER BY payload->>'name'`,
  );

  return result.rows.map((row) => ({
    scholarship: row.payload,
    sourceUrl: row.source_url,
    contentHash: row.content_hash,
  }));
}

export async function publishScholarship(
  scholarship: ScholarshipSeed,
  evidence: string[],
  contentHash: string,
) {
  const pool = getPool();
  if (!pool) throw new Error('DATABASE_URL belum dikonfigurasi.');

  await ensureSchema(pool);
  await pool.query(
    `INSERT INTO sakukampus_auto_scholarships
       (source_url, slug, payload, evidence, content_hash, last_verified_at)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6)
     ON CONFLICT (slug) DO UPDATE SET
       source_url = EXCLUDED.source_url,
       payload = EXCLUDED.payload,
       evidence = EXCLUDED.evidence,
       content_hash = EXCLUDED.content_hash,
       last_verified_at = EXCLUDED.last_verified_at,
       updated_at = NOW()`,
    [
      scholarship.source_url,
      scholarship.slug,
      JSON.stringify(scholarship),
      JSON.stringify(evidence),
      contentHash,
      scholarship.last_verified_at,
    ],
  );
}
