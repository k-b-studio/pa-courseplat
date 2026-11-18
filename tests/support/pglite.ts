/** PGlite with the Supabase shim and our migrations applied: a local Postgres for tests. */
import { readFileSync } from 'node:fs';
import { PGlite, type Transaction } from '@electric-sql/pglite';
import { readMigrations, runMigrations, type MigrationDb } from '../../scripts/lib/migrations';

export function pgliteAdapter(db: PGlite): MigrationDb {
	return {
		exec: async (sql) => {
			await db.exec(sql);
		},
		applied: async () => {
			const r = await db.query<{ name: string; checksum: string }>('select name, checksum from courseplat.schema_migrations');
			return new Map(r.rows.map((x) => [x.name, x.checksum]));
		},
		applyInTransaction: async (f) => {
			await db.transaction(async (tx) => {
				await tx.exec(f.sql);
				await tx.query('insert into courseplat.schema_migrations (name, checksum) values ($1, $2)', [f.name, f.checksum]);
			});
		}
	};
}

export async function freshDb(): Promise<PGlite> {
	const db = new PGlite();
	await db.exec(readFileSync('tests/support/supabase-shim.sql', 'utf-8'));
	await runMigrations(pgliteAdapter(db), readMigrations());
	return db;
}

export type TestUser = { id: string; email: string; provider?: string };

/** Run fn as a signed-in user (role authenticated + JWT claims), rolled back unless it commits. */
export async function as<T>(db: PGlite, user: TestUser | null, fn: (tx: Transaction) => Promise<T>): Promise<T> {
	return db.transaction(async (tx) => {
		const claims = user ? { sub: user.id, email: user.email, role: 'authenticated', app_metadata: { provider: user.provider ?? 'email' } } : {};
		await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims)]);
		await tx.exec(user ? 'set local role authenticated' : 'set local role anon');
		return fn(tx);
	});
}

/** The same, as the hook's role. */
export async function asAuthAdmin<T>(db: PGlite, fn: (tx: Transaction) => Promise<T>): Promise<T> {
	return db.transaction(async (tx) => {
		await tx.exec('set local role supabase_auth_admin');
		return fn(tx);
	});
}
