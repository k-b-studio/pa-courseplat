/** Demo mode and demo sign-in (spec 03). DEMO_ACCOUNT_PASSWORD never leaves the server. */
import { error } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { demoButton } from '$lib/domain/accounts';

export const demoMode = () => publicEnv.PUBLIC_DEMO_MODE === 'true';

/** 404 unless demo mode is on, so the route does not exist for a real deployment (AC 6). */
export function requireDemoMode() {
	if (!demoMode()) error(404, 'Not found');
}

/** Sign the request's client in as one of the four landing-page demo accounts. */
export async function signInDemo(supabase: App.Locals['supabase'], key: string) {
	requireDemoMode();
	const button = demoButton(key);
	const password = privateEnv.DEMO_ACCOUNT_PASSWORD;
	if (!button || !password) return { ok: false as const };
	await supabase.auth.signOut({ scope: 'local' });
	const { error: e } = await supabase.auth.signInWithPassword({ email: button.email, password });
	return e ? { ok: false as const } : { ok: true as const };
}
