/**
 * Review screen (spec 05 R14–R17): the original next to the pre-filled form. Accepting writes a
 * draft through save_syllabus; nothing is ever published from here (R17).
 */
import { error, fail, redirect } from '@sveltejs/kit';
import { aiFlags, fillEmpty, withSuggestions } from '$lib/server/ai/extract';
import { ExtractionResult } from '$lib/schema/extraction';
import { SyllabusDraft, type SyllabusDoc } from '$lib/schema/syllabus';
import { t } from '$lib/i18n/th';
import { instructorsFor, plosMap } from '$lib/server/course-page';
import { docxToHtml, sanitizeHtml } from '$lib/server/docx';
import { courses, sectionsFor, semesters } from '$lib/server/student';
import type { Actions, PageServerLoad } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type SB = App.Locals['supabase'];

async function guard(sb: SB, offeringId: string, extractionId: string) {
	if (!UUID.test(offeringId) || !UUID.test(extractionId)) error(404, t.common.notFound);
	const { data: allowed } = await sb.rpc('can_edit_offering', { p_offering: offeringId });
	if (!allowed) error(403, t.auth.forbidden);
	const { data: x } = await sb.from('extractions').select('id, offering_id, source_kind, storage_path, status, result, model, offline, error').eq('id', extractionId).maybeSingle();
	if (!x || x.offering_id !== offeringId) error(404, t.common.notFound);
	return x as { id: string; offering_id: string; source_kind: string; storage_path: string | null; status: string; result: (ExtractionResult & { sourceText?: string }) | null; model: string | null; offline: boolean; error: string | null };
}

async function working(sb: SB, id: string) {
	const { data } = await sb.rpc('get_offering_syllabi', { p_ids: [id] });
	const row = (data as { syllabus: SyllabusDoc | null; revision: number }[] | null)?.[0];
	return { doc: row?.syllabus ?? null, revision: row?.revision ?? 0 };
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const sb = locals.supabase;
	const x = await guard(sb, params.offeringId, params.extractionId);
	if (x.status !== 'succeeded' || !x.result) return { failed: true as const, offeringId: params.offeringId, status: x.status, error: x.error };
	const result = ExtractionResult.parse(x.result);

	// the original, for the left pane
	let source: { kind: 'pdf' | 'image' | 'html' | 'text'; url?: string; html?: string; text?: string } = { kind: 'text', text: x.result.sourceText ?? '' };
	if (x.storage_path) {
		if (x.source_kind === 'docx') {
			const { data: blob } = await sb.storage.from('syllabus-uploads').download(x.storage_path);
			source = { kind: 'html', html: blob ? sanitizeHtml(await docxToHtml(new Uint8Array(await blob.arrayBuffer()))) : '' };
		} else {
			const { data: signed } = await sb.storage.from('syllabus-uploads').createSignedUrl(x.storage_path, 600);
			source = { kind: x.source_kind === 'pdf' ? 'pdf' : 'image', url: signed?.signedUrl };
		}
	}

	const { data: off } = await sb.from('offerings').select('course_code, semester_id').eq('id', params.offeringId).single();
	const code = off!.course_code.trim();
	const [catalog, all, sectionsMap, plos, coursePlos, current] = await Promise.all([courses(sb), semesters(sb), sectionsFor(sb, [params.offeringId]), plosMap(sb), sb.from('course_plos').select('plo_code').eq('course_code', code), working(sb, params.offeringId)]);
	const sections = sectionsMap.get(params.offeringId) ?? [];
	const doc = withSuggestions(result);
	return {
		failed: false as const,
		offeringId: params.offeringId,
		extractionId: x.id,
		offline: x.offline,
		fallback: (x.model ?? '').startsWith('thaillm'),
		result: { meta: result.meta, warnings: result.warnings, sectionHints: result.sectionHints },
		doc,
		flags: aiFlags(doc, result),
		source,
		hasDraft: !!current.doc,
		course: catalog.get(code)!,
		semester: all.find((s) => s.id === off!.semester_id)!,
		sections,
		instructors: await instructorsFor(sb, sections),
		mySectionIds: sections.filter((s) => s.instructors.some((i) => i.id === locals.profile!.id)).map((s) => s.id),
		plos,
		suggestedPlos: ((coursePlos.data ?? []) as { plo_code: string }[]).map((r) => r.plo_code)
	};
};

export const actions: Actions = {
	/** R16: becomes the draft, or fills only the empty sections of an existing draft */
	accept: async ({ request, params, locals }) => {
		const sb = locals.supabase;
		await guard(sb, params.offeringId, params.extractionId);
		const f = await request.formData();
		let incoming: unknown;
		try {
			incoming = JSON.parse(String(f.get('doc') ?? ''));
		} catch {
			return fail(400, { message: t.editor.invalid });
		}
		const parsed = SyllabusDraft.safeParse(incoming);
		if (!parsed.success) return fail(400, { message: t.editor.invalid });
		const mode = f.get('mode') === 'fill' ? 'fill' : 'replace';
		const current = await working(sb, params.offeringId);
		const doc = mode === 'fill' && current.doc ? fillEmpty(current.doc, parsed.data) : parsed.data;
		const { error: e } = await sb.rpc('save_syllabus', { p_offering: params.offeringId, p_doc: doc, p_expected_revision: current.revision });
		if (e) return fail(400, { message: t.editor.saveFailed });
		redirect(303, `/teach/${params.offeringId}/edit`);
	},

	/** R15: staff, or the instructor of that section, apply a section hint with one click */
	applyHint: async ({ request, params, locals }) => {
		const sb = locals.supabase;
		const x = await guard(sb, params.offeringId, params.extractionId);
		const i = Number((await request.formData()).get('hint'));
		const hint = ExtractionResult.parse(x.result).sectionHints[i];
		if (!hint || hint.sectionNo == null) return fail(400, { message: t.editor.invalid });
		const { data: s } = await sb.from('sections').select('id, note').eq('offering_id', params.offeringId).eq('section_no', hint.sectionNo).maybeSingle();
		if (!s) return fail(404, { message: t.common.notFound });
		const meetings = hint.weekday && hint.startsAt && hint.endsAt ? [{ weekday: hint.weekday, startsAt: hint.startsAt, endsAt: hint.endsAt, room: hint.room ?? '', mode: 'onsite' }] : null;
		const { error: e } = await sb.rpc('update_section_details', { p_section: s.id, p_note: s.note, p_meetings: meetings });
		if (e) return fail(e.code === '42501' ? 403 : 400, { message: e.code === '42501' ? t.auth.forbidden : t.editor.saveFailed });
		return { hintApplied: i };
	}
};
