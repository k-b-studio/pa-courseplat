/**
 * Syllabus editor (spec 05 R3–R10). Every write goes through a security definer function that
 * checks can_edit_offering in Postgres; this file only re-checks and translates errors.
 */
import { error, fail } from '@sveltejs/kit';
import { z } from 'zod';
import { t } from '$lib/i18n/th';
import { emptySyllabus, strictIssues, SyllabusDraft, type SyllabusDoc } from '$lib/schema/syllabus';
import { instructorsFor, plosMap } from '$lib/server/course-page';
import { courses, sectionsFor, semesters } from '$lib/server/student';
import type { Actions, PageServerLoad } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type SB = App.Locals['supabase'];

async function requireEditable(sb: SB, id: string) {
	if (!UUID.test(id)) error(404, t.common.notFound);
	const { data: allowed, error: e } = await sb.rpc('can_edit_offering', { p_offering: id });
	if (e) error(500, t.common.error);
	if (!allowed) error(403, t.auth.forbidden);
}

async function working(sb: SB, id: string): Promise<{ doc: SyllabusDoc | null; revision: number }> {
	const { data } = await sb.rpc('get_offering_syllabi', { p_ids: [id] });
	const row = (data as { syllabus: SyllabusDoc | null; revision: number }[] | null)?.[0];
	return { doc: row?.syllabus ?? null, revision: row?.revision ?? 0 };
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const sb = locals.supabase;
	const id = params.offeringId;
	await requireEditable(sb, id);
	const { data: off } = await sb.from('offerings').select('id, course_code, semester_id, status, revision, published_revision, published_at, updated_at').eq('id', id).maybeSingle();
	if (!off) error(404, t.common.notFound);
	const code = off.course_code.trim();
	const [catalog, all, wk, sectionsMap, plos, coursePlos, notesRes, versionsRes] = await Promise.all([
		courses(sb),
		semesters(sb),
		working(sb, id),
		sectionsFor(sb, [id]),
		plosMap(sb),
		sb.from('course_plos').select('plo_code').eq('course_code', code),
		sb.from('course_notes').select('id, body, created_at, semester_id, author:profiles(id, title_th, name_th)').eq('course_code', code).order('created_at', { ascending: false }),
		sb.from('offerings').select('id, semester_id, published_revision, semester:semesters(label)').eq('course_code', code).eq('status', 'published').neq('id', id)
	]);
	const sections = sectionsMap.get(id) ?? [];
	const instructors = await instructorsFor(sb, sections);
	const course = catalog.get(code)!;
	const semester = all.find((s) => s.id === off.semester_id)!;

	// history: past published versions of this course (any instructor), with their documents for the diff
	const past = (versionsRes.data ?? []) as unknown as { id: string; semester_id: string; published_revision: number; semester: { label: string } }[];
	const { data: vs } = past.length ? await sb.from('offering_versions').select('id, offering_id, revision, syllabus').in('offering_id', past.map((p) => p.id)) : { data: [] };
	const history = past
		.map((p) => {
			const v = (vs ?? []).find((x: any) => x.offering_id === p.id && x.revision === p.published_revision) as { id: string; syllabus: SyllabusDoc } | undefined;
			return v ? { versionId: v.id, semesterId: p.semester_id, label: p.semester.label, doc: v.syllabus } : null;
		})
		.filter((x): x is NonNullable<typeof x> => !!x)
		.sort((a, b) => b.semesterId.localeCompare(a.semesterId));

	// spec 07 R12: highlight handover notes added since this person last opened the editor
	const { data: lastVisit } = await sb.rpc('touch_course_visit', { p_course: code });
	const semLabel = (sid: string | null) => all.find((s) => s.id === sid)?.label ?? '';

	return {
		offering: { id, status: off.status as string, revision: wk.revision, published_revision: off.published_revision as number | null, updated_at: off.updated_at as string | null },
		doc: wk.doc,
		course,
		semester,
		sections,
		instructors,
		mySectionIds: sections.filter((s) => s.instructors.some((i) => i.id === locals.profile!.id)).map((s) => s.id),
		plos,
		suggestedPlos: ((coursePlos.data ?? []) as { plo_code: string }[]).map((r) => r.plo_code),
		notes: ((notesRes.data ?? []) as any[]).map((n) => ({ id: n.id as string, body: n.body as string, created_at: n.created_at as string, semester: semLabel(n.semester_id), author: n.author, isNew: !!lastVisit && n.created_at > (lastVisit as string) })),
		history,
		cautions: [] as { id: string; severity: string; label: string }[] // spec 06 (P5)
	};
};

const docSchema = z.string().max(300_000).transform((s, ctx) => {
	try {
		return JSON.parse(s);
	} catch {
		ctx.addIssue({ code: 'custom', message: 'invalid json' });
		return z.NEVER;
	}
});

export const actions: Actions = {
	/** autosave (R5): save_syllabus with the revision the editor started from */
	save: async ({ request, params, locals }) => {
		const sb = locals.supabase;
		const f = await request.formData();
		const raw = docSchema.safeParse(f.get('doc'));
		const revision = Number(f.get('revision'));
		if (!raw.success || !Number.isInteger(revision)) return fail(400, { message: t.editor.invalid });
		const parsed = SyllabusDraft.safeParse(raw.data);
		if (!parsed.success) return fail(400, { message: t.editor.invalid });
		const { data, error: e } = await sb.rpc('save_syllabus', { p_offering: params.offeringId, p_doc: parsed.data, p_expected_revision: revision });
		if (e?.code === 'P0409') {
			const latest = await working(sb, params.offeringId);
			return fail(409, { conflict: true, serverRevision: latest.revision, serverDoc: latest.doc });
		}
		if (e?.code === '42501') return fail(403, { message: t.auth.forbidden });
		if (e) return fail(400, { message: t.editor.saveFailed });
		return { revision: data as number, savedAt: new Date().toISOString() };
	},

	/** R6: the server re-validates strict before publish_offering */
	publish: async ({ request, params, locals }) => {
		const sb = locals.supabase;
		const revision = Number((await request.formData()).get('revision'));
		const { doc, revision: current } = await working(sb, params.offeringId);
		if (!doc) return fail(400, { message: t.editor.noDoc });
		if (current !== revision) return fail(409, { conflict: true, serverRevision: current, serverDoc: doc });
		const { data: off } = await sb.from('offerings').select('semester:semesters(weeks)').eq('id', params.offeringId).single();
		const issues = strictIssues(doc, (off as any)?.semester?.weeks ?? 16);
		if (issues.length) return fail(400, { message: t.editor.notReady, issues });
		const { error: e } = await sb.rpc('publish_offering', { p_offering: params.offeringId, p_expected_revision: revision });
		if (e) return fail(400, { message: t.editor.publishFailed });
		// Content Caution run starts here in P5 (spec 06)
		return { published: true, revision };
	},

	unpublish: async ({ params, locals }) => {
		const { error: e } = await locals.supabase.rpc('unpublish_offering', { p_offering: params.offeringId });
		if (e) return fail(400, { message: t.editor.saveFailed });
		return { unpublished: true };
	},

	/** "คัดลอกจากภาคการศึกษาก่อน" / "คัดลอกมาเป็นฉบับร่าง" (R2, R8): clone_offering clears dates and instructors */
	clone: async ({ request, params, locals }) => {
		const versionId = String((await request.formData()).get('versionId') ?? '');
		if (!UUID.test(versionId)) return fail(400, { message: t.editor.invalid });
		const { data, error: e } = await locals.supabase.rpc('clone_offering', { p_target: params.offeringId, p_source_version: versionId });
		if (e) return fail(400, { message: t.editor.saveFailed });
		return { cloned: true, revision: data as number };
	},

	/** "เริ่มจากฟอร์มเปล่า" (R2) */
	blank: async ({ params, locals }) => {
		const sb = locals.supabase;
		const { doc, revision } = await working(sb, params.offeringId);
		if (doc) return { started: true };
		const { data: off } = await sb.from('offerings').select('course:courses(credit_format)').eq('id', params.offeringId).single();
		const { error: e } = await sb.rpc('save_syllabus', { p_offering: params.offeringId, p_doc: emptySyllabus((off as any)?.course?.credit_format), p_expected_revision: revision });
		if (e) return fail(400, { message: t.editor.saveFailed });
		return { started: true };
	},

	addNote: async ({ request, params, locals }) => {
		const sb = locals.supabase;
		const body = String((await request.formData()).get('body') ?? '').trim();
		if (!body || body.length > 4000) return fail(400, { message: t.editor.noteInvalid });
		const { data: off } = await sb.from('offerings').select('course_code, semester_id').eq('id', params.offeringId).single();
		const { error: e } = await sb.from('course_notes').insert({ course_code: off!.course_code, semester_id: off!.semester_id, author_id: locals.profile!.id, body });
		if (e) return fail(400, { message: t.editor.saveFailed });
		return { noteAdded: true };
	},

	/** R9: instructors edit the note and meeting times of their own sections */
	sectionDetails: async ({ request, locals }) => {
		const f = await request.formData();
		const section = String(f.get('section') ?? '');
		const meetings = z
			.array(z.object({ weekday: z.number().int().min(1).max(7), startsAt: z.string().regex(/^\d{2}:\d{2}$/), endsAt: z.string().regex(/^\d{2}:\d{2}$/), room: z.string().max(100), mode: z.enum(['onsite', 'online', 'hybrid']) }).refine((m) => m.endsAt > m.startsAt))
			.max(10)
			.safeParse(JSON.parse(String(f.get('meetings') ?? '[]')));
		if (!UUID.test(section) || !meetings.success) return fail(400, { message: t.editor.invalid });
		const { error: e } = await locals.supabase.rpc('update_section_details', { p_section: section, p_note: String(f.get('note') ?? '').slice(0, 500), p_meetings: meetings.data });
		if (e) return fail(e.code === '42501' ? 403 : 400, { message: e.code === '42501' ? t.auth.forbidden : t.editor.saveFailed });
		return { sectionSaved: section };
	}
};
