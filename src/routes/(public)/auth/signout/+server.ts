import { redirect } from '@sveltejs/kit';
import { setFlash } from '$lib/server/flash';
import type { RequestHandler } from './$types';
import { appPath } from '$lib/paths';

// every path ends in "/" (see $lib/paths)
export const trailingSlash = 'always';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	await locals.supabase.auth.signOut({ scope: 'local' });
	setFlash(cookies, 'signedOut');
	redirect(303, appPath('/'));
};
