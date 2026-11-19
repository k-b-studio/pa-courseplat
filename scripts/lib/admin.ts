/** Supabase Admin API client for scripts (SUPABASE_SECRET_KEY). Used only for demo users. */
import { createClient } from '@supabase/supabase-js';

export function adminClient() {
	const url = process.env.PUBLIC_SUPABASE_URL;
	const key = process.env.SUPABASE_SECRET_KEY;
	if (!url || !key || key.startsWith('[')) {
		console.error('PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.');
		process.exit(2);
	}
	return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, db: { schema: 'courseplat' } });
}

export function demoPassword(): string {
	const p = process.env.DEMO_ACCOUNT_PASSWORD;
	if (!p) {
		console.error('DEMO_ACCOUNT_PASSWORD is not set (.env).');
		process.exit(2);
	}
	return p;
}
