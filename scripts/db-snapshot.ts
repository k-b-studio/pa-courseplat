/**
 * npm run db:snapshot -- --label before|after     snapshot creditGPAX's objects in public (read-only)
 * npm run db:snapshot -- --compare before after   diff two snapshots
 *
 * Spec 02 AC 1: the snapshot before and after our migrations must be identical apart from the
 * new public.shared_before_user_created. Snapshots go to .snapshots/ (git-ignored).
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { connect, dbUrl, describeUrl } from './lib/pg';

type Snapshot = Record<string, Record<string, unknown>>;
const ALLOWED_NEW = new Set(['function:public.shared_before_user_created(event jsonb)']);

const args = process.argv.slice(2);
const flag = (name: string) => {
	const i = args.indexOf(name);
	return i >= 0 ? args[i + 1] : undefined;
};

function load(label: string): Snapshot {
	return JSON.parse(readFileSync(`.snapshots/public-${label}.json`, 'utf-8')).objects;
}

function flatten(s: Snapshot): Map<string, string> {
	const m = new Map<string, string>();
	for (const [kind, objs] of Object.entries(s)) for (const [k, v] of Object.entries(objs)) m.set(`${kind}:${k}`, JSON.stringify(v));
	return m;
}

if (args.includes('--compare')) {
	const [a, b] = args.slice(args.indexOf('--compare') + 1);
	const A = flatten(load(a));
	const B = flatten(load(b));
	const added = [...B.keys()].filter((k) => !A.has(k));
	const removed = [...A.keys()].filter((k) => !B.has(k));
	const changed = [...A.keys()].filter((k) => B.has(k) && A.get(k) !== B.get(k));
	const unexpected = added.filter((k) => !ALLOWED_NEW.has(k));
	console.log(`compared ${a} (${A.size} objects) with ${b} (${B.size} objects)`);
	for (const k of added) console.log(`  + ${k}${ALLOWED_NEW.has(k) ? '   (expected: ours)' : ''}`);
	for (const k of removed) console.log(`  - ${k}`);
	for (const k of changed) console.log(`  ~ ${k}`);
	if (unexpected.length || removed.length || changed.length) {
		console.error('DIFFERENT: creditGPAX objects changed.');
		process.exit(1);
	}
	console.log('OK: identical apart from public.shared_before_user_created.');
	process.exit(0);
}

const label = flag('--label') ?? new Date().toISOString().replace(/[:.]/g, '-');
const url = dbUrl();
const sql = connect(url);
try {
	const objects = await sql.begin('read only', async (tx) => {
		const functions = await tx<{ sig: string; def: string; acl: string | null; secdef: boolean }[]>`
			select p.oid::regprocedure::text as sig, pg_get_functiondef(p.oid) as def, p.proacl::text as acl, p.prosecdef as secdef
			from pg_proc p join pg_namespace n on n.oid = p.pronamespace
			where n.nspname = 'public' and p.prokind in ('f','p')`;
		const policies = await tx<Record<string, unknown>[]>`
			select tablename, policyname, permissive, roles::text as roles, cmd, qual, with_check
			from pg_policies where schemaname = 'public'`;
		const tables = await tx<{ name: string; kind: string; rls: boolean; acl: string | null }[]>`
			select c.relname as name, c.relkind::text as kind, c.relrowsecurity as rls, c.relacl::text as acl
			from pg_class c join pg_namespace n on n.oid = c.relnamespace
			where n.nspname = 'public' and c.relkind in ('r','v','m','p')`;
		const columns = await tx<Record<string, unknown>[]>`
			select table_name, column_name, ordinal_position, data_type, is_nullable, column_default
			from information_schema.columns where table_schema = 'public'`;
		const triggers = await tx<{ name: string; def: string }[]>`
			select n.nspname || '.' || c.relname || '.' || t.tgname as name, pg_get_triggerdef(t.oid) as def
			from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
			where not t.tgisinternal and (n.nspname = 'public' or (n.nspname = 'auth' and c.relname = 'users'))`;
		const schema = await tx<{ acl: string | null }[]>`select nspacl::text as acl from pg_namespace where nspname = 'public'`;

		const snap: Snapshot = { function: {}, policy: {}, table: {}, column: {}, trigger: {}, schema: {} };
		for (const f of functions) snap.function[`public.${f.sig.replace(/^public\./, '')}`] = { def: f.def, acl: f.acl, secdef: f.secdef };
		// regprocedure prints arg types only; key functions by name + arg names for readability
		const named = await tx<{ sig: string; key: string }[]>`
			select p.oid::regprocedure::text as sig, n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as key
			from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind in ('f','p')`;
		snap.function = Object.fromEntries(
			named.map((r) => [r.key, snap.function[`public.${r.sig.replace(/^public\./, '')}`]])
		);
		for (const p of policies) snap.policy[`${p.tablename}.${p.policyname}`] = p;
		for (const t of tables) snap.table[t.name] = t;
		for (const c of columns) snap.column[`${c.table_name}.${c.column_name}`] = c;
		for (const t of triggers) snap.trigger[t.name] = t.def;
		snap.schema.public = schema[0];
		return snap;
	});
	mkdirSync('.snapshots', { recursive: true });
	const body = JSON.stringify({ takenAt: new Date().toISOString(), target: describeUrl(url), objects }, null, 2);
	writeFileSync(`.snapshots/public-${label}.json`, body);
	const counts = Object.fromEntries(Object.entries(objects).map(([k, v]) => [k, Object.keys(v).length]));
	console.log(`snapshot "${label}" of ${describeUrl(url)}:`, counts);
	console.log('functions in public:', Object.keys(objects.function).sort().join(', '));
	console.log('sha256:', createHash('sha256').update(JSON.stringify(objects)).digest('hex').slice(0, 16));
} finally {
	await sql.end();
}
