/**
 * npm run check:secrets — spec 02 AC 6. After `npm run build`: no secret value and no Supabase secret
 * key (`sb_secret_…`) in any client asset, and git tracks neither .env nor the key notes. Prints names, never values.
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SECRET_NAMES = ['GEMINI_API_KEY', 'THAILLM_API_KEY', 'SUPABASE_SECRET_KEY', 'SUPABASE_DB_URL', 'DEMO_ACCOUNT_PASSWORD'];
const secrets = SECRET_NAMES.map((n) => [n, process.env[n]] as const).filter(([, v]) => v && v.length >= 8) as [string, string][];

function walk(dir: string): string[] {
	return readdirSync(dir).flatMap((f) => {
		const p = join(dir, f);
		return statSync(p).isDirectory() ? walk(p) : [p];
	});
}

// a secret key, not the bare prefix: supabase-js itself ships `startsWith('sb_secret_')` to the browser
const SECRET_KEY_SHAPE = /sb_secret_[A-Za-z0-9_-]{16,}/;

let failed = false;
const roots = ['.svelte-kit/output/client', '.vercel/output/static'].filter(existsSync);
if (!roots.length) {
	console.error('No build output: run `npm run build` first.');
	process.exit(2);
}
let scanned = 0;
for (const root of roots) {
	for (const file of walk(root)) {
		scanned++;
		const body = readFileSync(file);
		if (SECRET_KEY_SHAPE.test(body.toString('latin1'))) {
			console.error(`FOUND a Supabase secret key (sb_secret_…) in ${file}`);
			failed = true;
		}
		for (const [name, value] of secrets) {
			if (body.includes(value)) {
				console.error(`FOUND the value of ${name} in ${file}`);
				failed = true;
			}
		}
	}
}
console.log(`scanned ${scanned} client files for sb_secret_ keys and ${secrets.map(([n]) => n).join(', ') || '(no secrets set)'}`);

const tracked = execSync('git ls-files', { encoding: 'utf-8' }).split('\n');
for (const f of ['.env', 'api.md', 'thaillm-api.md']) {
	if (tracked.includes(f)) {
		console.error(`git tracks ${f}`);
		failed = true;
	}
}
console.log(failed ? 'FAIL' : 'OK: no secrets in client assets; .env, api.md, thaillm-api.md untracked');
process.exit(failed ? 1 : 0);
