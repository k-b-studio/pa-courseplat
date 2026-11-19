import { redirect } from '@sveltejs/kit';
import { setFlash } from '$lib/server/flash';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	await locals.supabase.auth.signOut({ scope: 'local' });
	setFlash(cookies, 'signedOut');
	redirect(303, '/');
};
