import { error } from '@sveltejs/kit';
import { t } from '$lib/i18n/th';
import { OFFERING_COLUMNS, type OfferingRow } from '$lib/server/offerings';
import type { PageServerLoad } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!UUID.test(params.offeringId)) error(404, t.common.notFound);
	// the permission check lives in Postgres (can_edit_offering); the server asks it before rendering
	const { data: allowed, error: e } = await locals.supabase.rpc('can_edit_offering', { p_offering: params.offeringId });
	if (e) error(500, t.common.error);
	if (!allowed) error(403, t.auth.forbidden);
	const { data } = await locals.supabase.from('offerings').select(OFFERING_COLUMNS).eq('id', params.offeringId).maybeSingle();
	if (!data) error(404, t.common.notFound);
	return { offering: data as unknown as OfferingRow };
};
