/**
 * Secret-key client (server only; spec 02: ai_calls and caution writes). Never imported by client
 * code; check:secrets fails the build if the key reaches the bundle.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

let client: SupabaseClient<any, 'courseplat'> | null = null;
export function adminClient(): SupabaseClient<any, 'courseplat'> {
	if (!env.SUPABASE_SECRET_KEY) throw new Error('SUPABASE_SECRET_KEY is not set');
	client ??= createClient<any, 'courseplat'>(PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false }, db: { schema: 'courseplat' } });
	return client;
}
