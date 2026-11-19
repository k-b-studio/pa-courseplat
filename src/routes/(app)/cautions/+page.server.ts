/** Content Caution dashboard (spec 06 "UI"). The (app) gate already limits it to instructors and staff. */
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { applyFilters, bySeverity, kindBars, matrix, parseFilters, tiles } from '$lib/domain/cautionStats';
import { t } from '$lib/i18n/th';
import { loadCautions } from '$lib/server/cautions/view';
import { teachableOfferings } from '$lib/server/offerings';
import { semesters } from '$lib/server/student';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const sb = locals.supabase;
	const profile = locals.profile!;
	const all = await semesters(sb);
	const semester = all.find((s) => s.id === url.searchParams.get('semester')) ?? all.find((s) => s.status === 'upcoming') ?? all[0];
	const isStaff = profile.role === 'staff';
	const cautions = await loadCautions(sb, profile.id, { semesterId: semester.id });
	const mine = isStaff ? null : (await teachableOfferings(sb, profile, semester.id)).map((o) => ({ id: o.id, code: o.course_code, name: o.course?.name_th ?? '' }));
	const filters = parseFilters(url.searchParams);
	const visible = applyFilters(cautions, filters).sort(bySeverity);
	const hiddenInfo = filters.severities.includes('info') ? 0 : applyFilters(cautions, { ...filters, severities: ['info'] }).length;
	const m = matrix(visible, mine ? mine.map((o) => o.id) : null);
	// opening the dashboard clears the badge (spec 06 R9)
	await sb.rpc('mark_cautions_seen');
	return {
		semesters: all.map((s) => ({ id: s.id, label: s.label })),
		semester,
		isStaff,
		filters,
		cautions: visible,
		total: cautions.length,
		hiddenInfo,
		tiles: tiles(cautions),
		matrix: { rows: m.rows, cols: m.cols, cells: Object.fromEntries(m.rows.flatMap((r) => m.cols.map((k) => [`${r}|${k}`, m.cell(r, k)]))) },
		kinds: kindBars(visible),
		mine: mine?.map((o) => ({
			...o,
			high: cautions.filter((c) => c.status === 'open' && c.severity === 'high' && (c.a_offering_id === o.id || c.b_offering_id === o.id)).length,
			medium: cautions.filter((c) => c.status === 'open' && c.severity === 'medium' && (c.a_offering_id === o.id || c.b_offering_id === o.id)).length
		})),
		myOfferingIds: mine?.map((o) => o.id) ?? []
	};
};

const Resolve = z.object({ id: z.string().uuid(), status: z.enum(['intentional', 'coordinating', 'dismissed', 'open']), note: z.string().max(1000).optional(), relation: z.enum(['duplicate', 'builds_on', 'related']).optional() });

export const actions: Actions = {
	/** status changes go through resolve_caution, which re-checks permission in Postgres */
	resolve: async ({ request, locals }) => {
		const f = Object.fromEntries(await request.formData());
		const p = Resolve.safeParse({ ...f, note: f.note || undefined, relation: f.relation || undefined });
		if (!p.success) return fail(400, { message: t.editor.invalid });
		if (p.data.status === 'dismissed' && !p.data.note?.trim()) return fail(400, { message: t.cautions.noteRequired, id: p.data.id });
		const { error } = await locals.supabase.rpc('resolve_caution', { p_id: p.data.id, p_status: p.data.status, p_note: p.data.note ?? null, p_relation: p.data.relation ?? null });
		if (error) return fail(error.code === '42501' ? 403 : 400, { message: error.message === 'note_required' ? t.cautions.noteRequired : t.editor.saveFailed, id: p.data.id });
		return { resolved: p.data.id };
	},
	comment: async ({ request, locals }) => {
		const f = await request.formData();
		const id = String(f.get('id') ?? '');
		const body = String(f.get('body') ?? '').trim();
		if (!z.string().uuid().safeParse(id).success || !body || body.length > 2000) return fail(400, { message: t.editor.invalid });
		const { error } = await locals.supabase.from('caution_comments').insert({ caution_id: id, author_id: locals.profile!.id, body });
		if (error) return fail(403, { message: t.auth.forbidden, id });
		return { commented: id };
	}
};
