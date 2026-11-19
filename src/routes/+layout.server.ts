import { env } from '$env/dynamic/public';
import { takeFlash } from '$lib/server/flash';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => ({
	profile: locals.profile,
	flash: takeFlash(cookies),
	// read at run time, so one build can be checked with demo mode on and off (spec 03 AC 6)
	demoMode: env.PUBLIC_DEMO_MODE === 'true'
});
