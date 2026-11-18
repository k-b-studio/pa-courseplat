/**
 * Our own migration ledger (spec 02 rule 2): supabase/migrations/*.sql applied in name order,
 * each in a transaction, recorded in courseplat.schema_migrations with a checksum. A second run
 * applies nothing. Never `supabase db push` / `db reset` against the shared project.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type MigrationFile = { name: string; sql: string; checksum: string };

export const LEDGER_SQL = `
create schema if not exists courseplat;
create table if not exists courseplat.schema_migrations (
  name text primary key,
  checksum text not null,
  applied_at timestamptz not null default now()
);`;

export function readMigrations(dir = 'supabase/migrations'): MigrationFile[] {
	return readdirSync(dir)
		.filter((f) => /^\d{4}_.+\.sql$/.test(f))
		.sort()
		.map((name) => {
			const sql = readFileSync(join(dir, name), 'utf-8');
			return { name, sql, checksum: createHash('sha256').update(sql).digest('hex').slice(0, 16) };
		});
}

export type Plan = { pending: MigrationFile[]; changed: MigrationFile[] };

/** Which files still need applying; `changed` lists applied files whose content has since changed. */
export function planMigrations(files: MigrationFile[], applied: Map<string, string>): Plan {
	return {
		pending: files.filter((f) => !applied.has(f.name)),
		changed: files.filter((f) => applied.has(f.name) && applied.get(f.name) !== f.checksum)
	};
}

/** Minimal adapter so the same runner drives postgres.js (real DB) and PGlite (tests). */
export type MigrationDb = {
	exec(sql: string): Promise<void>;
	applied(): Promise<Map<string, string>>;
	/** run `sql` and record it, atomically */
	applyInTransaction(file: MigrationFile): Promise<void>;
};

export async function runMigrations(db: MigrationDb, files: MigrationFile[], log: (s: string) => void = () => {}) {
	await db.exec(LEDGER_SQL);
	const plan = planMigrations(files, await db.applied());
	if (plan.changed.length) {
		throw new Error(
			`Applied migrations have changed on disk: ${plan.changed.map((f) => f.name).join(', ')}. ` +
				'Add a new migration instead of editing an applied one.'
		);
	}
	for (const f of plan.pending) {
		log(`applying ${f.name} …`);
		await db.applyInTransaction(f);
	}
	log(plan.pending.length ? `applied ${plan.pending.length} migration(s)` : 'nothing to apply');
	return plan.pending.map((f) => f.name);
}
