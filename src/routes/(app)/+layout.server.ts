import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// hooks.server.ts gates every (app) request first; this is the per-route re-check (spec 03 R7)
export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user || !locals.profile) redirect(303, '/');
	return { profile: locals.profile };
};
