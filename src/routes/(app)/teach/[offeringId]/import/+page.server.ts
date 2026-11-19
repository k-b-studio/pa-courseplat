import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { t } from '$lib/i18n/th';
import { aiConfigFrom } from '$lib/server/ai/config';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const { data: allowed } = await locals.supabase.rpc('can_edit_offering', { p_offering: params.offeringId });
	if (!allowed) error(403, t.auth.forbidden);
	const { data: off } = await locals.supabase.from('offerings').select('id, course_code, course:courses(name_th), semester:semesters(label)').eq('id', params.offeringId).single();
	const cfg = aiConfigFrom(env);
	return {
		offering: off as unknown as { id: string; course_code: string; course: { name_th: string }; semester: { label: string } },
		freeTier: cfg.tier === 'free', // spec 05 AC 13: the data notice
		offline: cfg.offline,
		tab: url.searchParams.get('tab') === 'text' ? 'text' : 'file'
	};
};
