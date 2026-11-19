/**
 * Cautions for the dashboard and the editor (spec 06 "Data loading"). The rows come from the user's
 * client, so RLS decides scope (staff: all; instructors: either side editable). Display context for
 * those same rows (course codes, the other side's instructors, who started the last run) is added with
 * the secret-key client, because RLS hides another instructor's draft offering and run rows.
 */
import { adminClient } from '../supabase-admin';

export type { CautionDetail } from '$lib/caution-types';
import type { CautionDetail } from '$lib/caution-types';

const name = (p: { title_th: string | null; name_th: string | null } | null) => (p ? `${p.title_th ?? ''}${p.name_th ?? ''}` : null);

export async function loadCautions(sb: App.Locals['supabase'], userId: string, scope: { semesterId?: string; offeringId?: string }): Promise<CautionDetail[]> {
	let q = sb
		.from('content_cautions')
		.select('*, caution_comments(id, body, created_at, author:profiles(title_th, name_th)), caution_events(id, status, relation, note, created_at, actor:profiles(title_th, name_th))');
	if (scope.semesterId) q = q.eq('semester_id', scope.semesterId);
	if (scope.offeringId) q = q.or(`a_offering_id.eq.${scope.offeringId},b_offering_id.eq.${scope.offeringId}`);
	const { data } = await q;
	const rows = (data ?? []) as any[];
	if (!rows.length) return [];

	const admin = adminClient();
	const offIds = [...new Set(rows.flatMap((r) => [r.a_offering_id, r.b_offering_id]))];
	const runIds = [...new Set(rows.map((r) => r.last_run_id).filter(Boolean))];
	const [{ data: offs }, { data: secs }, { data: runs }] = await Promise.all([
		admin.from('offerings').select('id, course_code, semester_id').in('id', offIds),
		admin.from('sections').select('offering_id, section_instructors(profile:profiles(title_th, name_th))').in('offering_id', offIds),
		runIds.length ? admin.from('caution_runs').select('id, triggered_by').in('id', runIds) : Promise.resolve({ data: [] as any[] })
	]);
	const off = new Map(((offs ?? []) as any[]).map((o) => [o.id, { code: o.course_code.trim(), semester: o.semester_id }]));
	const people = new Map<string, string[]>();
	for (const s of (secs ?? []) as any[]) for (const si of s.section_instructors ?? []) if (si.profile) people.set(s.offering_id, [...new Set([...(people.get(s.offering_id) ?? []), name(si.profile)!])]);
	const runBy = new Map(((runs ?? []) as any[]).map((r) => [r.id, r.triggered_by]));

	return rows.map((r) => ({
		id: r.id,
		kind: r.kind,
		relation: r.relation,
		severity: r.severity,
		status: r.status,
		similarity: Number(r.similarity),
		a_offering_id: r.a_offering_id,
		b_offering_id: r.b_offering_id,
		a_code: off.get(r.a_offering_id)?.code ?? r.a_label.slice(0, 7),
		b_code: off.get(r.b_offering_id)?.code ?? r.b_label.slice(0, 7),
		a_semester: off.get(r.a_offering_id)?.semester ?? '',
		b_semester: off.get(r.b_offering_id)?.semester ?? '',
		a_ref: r.a_ref,
		b_ref: r.b_ref,
		a_label: r.a_label,
		b_label: r.b_label,
		reason_th: r.reason_th,
		suggestion_th: r.suggestion_th,
		source: r.source,
		resolution_note: r.resolution_note,
		updated_at: r.updated_at,
		a_instructors: people.get(r.a_offering_id) ?? [],
		b_instructors: people.get(r.b_offering_id) ?? [],
		byOther: !!r.last_run_id && runBy.get(r.last_run_id) != null && runBy.get(r.last_run_id) !== userId,
		comments: (r.caution_comments ?? []).map((c: any) => ({ id: c.id, body: c.body, created_at: c.created_at, author: name(c.author) })).sort((a: any, b: any) => a.created_at.localeCompare(b.created_at)),
		events: (r.caution_events ?? []).map((e: any) => ({ id: e.id, status: e.status, relation: e.relation, note: e.note, created_at: e.created_at, actor: name(e.actor) })).sort((a: any, b: any) => a.created_at.localeCompare(b.created_at))
	}));
}

/** R9: open cautions on my offerings, changed since I last looked, by a run someone else started */
export async function cautionBadge(sb: App.Locals['supabase'], userId: string, seenAt: string | null): Promise<number> {
	let q = sb.from('content_cautions').select('id, last_run_id').eq('status', 'open').not('last_run_id', 'is', null);
	if (seenAt) q = q.gt('updated_at', seenAt);
	const { data } = await q;
	const rows = (data ?? []) as { id: string; last_run_id: string }[];
	if (!rows.length) return 0;
	const { data: runs } = await adminClient().from('caution_runs').select('id, triggered_by').in('id', [...new Set(rows.map((r) => r.last_run_id))]);
	const other = new Set(((runs ?? []) as any[]).filter((r) => r.triggered_by && r.triggered_by !== userId).map((r) => r.id));
	return rows.filter((r) => other.has(r.last_run_id)).length;
}
