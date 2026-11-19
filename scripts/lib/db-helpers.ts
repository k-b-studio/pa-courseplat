/**
 * Script-side database helpers (postgres.js, SUPABASE_DB_URL). Everything here writes only to
 * schema courseplat (spec 02 rule 6). Never import from src/.
 */
import type { Sql, TransactionSql } from 'postgres';

export type Tx = TransactionSql<Record<string, unknown>> | Sql<Record<string, unknown>>;

const IDENT = /^[a-z_][a-z0-9_]*$/;
const ident = (s: string) => {
	if (!IDENT.test(s)) throw new Error(`bad identifier: ${s}`);
	return s;
};

/**
 * Upsert rows into courseplat.<table> by natural key, updating only rows that actually differ,
 * so a second seed run changes nothing (spec 08 R1). Rows go through jsonb_populate_recordset,
 * which also converts JSON arrays to Postgres arrays.
 */
export async function upsert(tx: Tx, table: string, rows: Record<string, unknown>[], conflict: string[], returning = '') {
	if (!rows.length) return [];
	const cols = Object.keys(rows[0]).map(ident);
	const upd = cols.filter((c) => !conflict.includes(c));
	const t = `courseplat.${ident(table)}`;
	const action = upd.length
		? `do update set (${upd.join(', ')}) = row(${upd.map((c) => `excluded.${c}`).join(', ')})
		   where (${upd.map((c) => `t.${c}`).join(', ')}) is distinct from (${upd.map((c) => `excluded.${c}`).join(', ')})`
		: 'do nothing';
	return tx.unsafe(
		`insert into ${t} as t (${cols.join(', ')})
		 select ${cols.join(', ')} from jsonb_populate_recordset(null::${t}, ($1::text)::jsonb)
		 on conflict (${conflict.map(ident).join(', ')}) ${action}
		 ${returning ? `returning ${returning}` : ''}`,
		[JSON.stringify(rows)]
	);
}

export type AsUser = { id: string; email: string; provider?: string };

/**
 * Run fn as a signed-in user, exactly as PostgREST does: role authenticated plus JWT claims,
 * so auth.uid(), RLS and the security definer checks behave as in the app.
 */
export async function asUser<T>(sql: Sql<Record<string, unknown>>, user: AsUser, fn: (tx: TransactionSql<Record<string, unknown>>) => Promise<T>): Promise<T> {
	const claims = { sub: user.id, email: user.email, role: 'authenticated', aud: 'authenticated', app_metadata: { provider: user.provider ?? 'email' } };
	return sql.begin(async (tx) => {
		await tx`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true), set_config('request.jwt.claim.sub', ${user.id}, true)`;
		await tx.unsafe('set local role authenticated');
		return fn(tx);
	}) as Promise<T>;
}
