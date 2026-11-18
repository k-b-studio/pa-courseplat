/**
 * npm run db:migrate — apply supabase/migrations/*.sql to SUPABASE_DB_URL through our own ledger
 * (courseplat.schema_migrations). Safe to re-run: applied files are skipped.
 *
 * Shared project guard: against a non-local database this refuses to run until a snapshot of
 * creditGPAX's public objects exists (npm run db:snapshot -- --label before), spec 02 AC 1.
 */
import { existsSync } from 'node:fs';
import { connect, dbUrl, describeUrl, isLocal } from './lib/pg';
import { readMigrations, runMigrations } from './lib/migrations';

const url = dbUrl();
const files = readMigrations();
console.log(`target: ${describeUrl(url)} — ${files.length} migration file(s)`);

if (!isLocal(url) && !existsSync('.snapshots/public-before.json')) {
	console.error('Refusing: no .snapshots/public-before.json. Run `npm run db:snapshot -- --label before` first.');
	process.exit(3);
}

const sql = connect(url);
try {
	await runMigrations(
		{
			exec: async (text) => {
				await sql.unsafe(text);
			},
			applied: async () => {
				const rows = await sql<{ name: string; checksum: string }[]>`select name, checksum from courseplat.schema_migrations`;
				return new Map(rows.map((r) => [r.name, r.checksum]));
			},
			applyInTransaction: async (f) => {
				await sql.begin(async (tx) => {
					await tx.unsafe(f.sql);
					await tx.unsafe('insert into courseplat.schema_migrations (name, checksum) values ($1, $2)', [f.name, f.checksum]);
				});
			}
		},
		files,
		console.log
	);
} catch (e) {
	console.error('migration failed:', e instanceof Error ? e.message : e);
	process.exitCode = 1;
} finally {
	await sql.end();
}
