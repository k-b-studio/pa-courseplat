/**
 * Loads for the student pages (spec 04). Everything runs as the signed-in user, so RLS decides:
 * students see only published offerings, and read content only from published snapshots
 * (offering_versions at published_revision). Nothing here touches Content Caution tables.
 */
import type { CurriculumRow } from '$lib/domain/curriculum';
import type { SyllabusDoc } from '$lib/schema/syllabus';
import type { CourseInfo, MeetingView, SectionView, Semester } from '$lib/view-types';

type SB = App.Locals['supabase'];

export async function semesters(sb: SB): Promise<Semester[]> {
	const { data } = await sb.from('semesters').select('id, label, status, starts_on, weeks, syllabus_due_on').order('id', { ascending: false });
	return (data ?? []) as Semester[];
}

/** spec 04 R1: the upcoming semester if it has a published offering, otherwise the active one. */
export async function defaultSemester(sb: SB, all: Semester[]): Promise<Semester | null> {
	const upcoming = all.find((s) => s.status === 'upcoming');
	if (upcoming) {
		const { count } = await sb.from('offerings').select('id', { count: 'exact', head: true }).eq('semester_id', upcoming.id).eq('status', 'published');
		if ((count ?? 0) > 0) return upcoming;
	}
	return all.find((s) => s.status === 'active') ?? upcoming ?? all[0] ?? null;
}

export async function courses(sb: SB): Promise<Map<string, CourseInfo>> {
	const { data } = await sb.from('courses').select('*');
	return new Map(((data ?? []) as CourseInfo[]).map((c) => [c.code.trim(), { ...c, code: c.code.trim(), prerequisite_codes: (c.prerequisite_codes ?? []).map((x) => x.trim()) }]));
}

export async function curriculumRows(sb: SB): Promise<CurriculumRow[]> {
	const { data } = await sb.from('curriculum_courses').select('curriculum_id, course_code, major, category, track, track_name_th');
	return ((data ?? []) as CurriculumRow[]).map((r) => ({ ...r, course_code: r.course_code.trim() }));
}

/** Every offering in a semester with its status, including unpublished ones (0005: no content). */
export async function listing(sb: SB, semesterId: string): Promise<{ offering_id: string; course_code: string; status: string }[]> {
	const { data } = await sb.rpc('offering_listing', { p_semester: semesterId });
	return ((data ?? []) as { offering_id: string; course_code: string; status: string }[]).map((r) => ({ ...r, course_code: r.course_code.trim() }));
}

const SECTION_SELECT =
	'id, section_no, language, capacity, note, meetings:section_meetings(weekday, starts_at, ends_at, room, mode), instructors:section_instructors(role, guest_name, profile:profiles(id, title_th, name_th, name_en))';

type RawSection = Omit<SectionView, 'instructors'> & { instructors: { role: string; guest_name: string | null; profile: { id: string; title_th: string | null; name_th: string | null; name_en: string | null } | null }[] };

const ROLE_ORDER = ['lead', 'co', 'guest'];
export function toSection(s: RawSection): SectionView {
	return {
		...s,
		meetings: [...s.meetings].sort((a, b) => a.weekday - b.weekday || a.starts_at.localeCompare(b.starts_at)).map(hhmm),
		instructors: [...s.instructors]
			.sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))
			.map((i) => ({ id: i.profile?.id ?? null, title_th: i.profile?.title_th ?? null, name_th: i.profile?.name_th ?? i.guest_name, name_en: i.profile?.name_en ?? null, role: i.role }))
	};
}
const hhmm = (m: MeetingView): MeetingView => ({ ...m, starts_at: m.starts_at.slice(0, 5), ends_at: m.ends_at.slice(0, 5) });

export async function sectionsFor(sb: SB, offeringIds: string[]): Promise<Map<string, SectionView[]>> {
	const out = new Map<string, SectionView[]>();
	if (!offeringIds.length) return out;
	const { data } = await sb.from('sections').select(`offering_id, ${SECTION_SELECT}`).in('offering_id', offeringIds).order('section_no');
	for (const s of (data ?? []) as unknown as (RawSection & { offering_id: string })[]) out.set(s.offering_id, [...(out.get(s.offering_id) ?? []), toSection(s)]);
	return out;
}

/** The published snapshot of each offering (students never read the working draft). */
export async function publishedDocs(sb: SB, offerings: { id: string; published_revision: number | null }[]): Promise<Map<string, { versionId: string; doc: SyllabusDoc; published_at: string }>> {
	const out = new Map<string, { versionId: string; doc: SyllabusDoc; published_at: string }>();
	const want = offerings.filter((o) => o.published_revision != null);
	if (!want.length) return out;
	const { data } = await sb.from('offering_versions').select('id, offering_id, revision, syllabus, published_at').in('offering_id', want.map((o) => o.id));
	for (const v of (data ?? []) as { id: string; offering_id: string; revision: number; syllabus: SyllabusDoc; published_at: string }[]) {
		if (want.find((o) => o.id === v.offering_id)?.published_revision === v.revision) out.set(v.offering_id, { versionId: v.id, doc: v.syllabus, published_at: v.published_at });
	}
	return out;
}

/** Published versions of a course across semesters, newest first (for "ภาคการศึกษาก่อนหน้า" and fallbacks). */
export async function courseVersions(sb: SB, code: string) {
	const { data } = await sb
		.from('offerings')
		.select('id, semester_id, published_revision, published_at, semester:semesters(label, starts_on)')
		.eq('course_code', code)
		.eq('status', 'published')
		.order('semester_id', { ascending: false });
	const rows = (data ?? []) as unknown as { id: string; semester_id: string; published_revision: number; published_at: string; semester: { label: string; starts_on: string } }[];
	if (!rows.length) return [];
	const { data: vs } = await sb.from('offering_versions').select('id, offering_id, revision').in('offering_id', rows.map((r) => r.id));
	return rows.map((r) => ({ ...r, versionId: (vs ?? []).find((v: any) => v.offering_id === r.id && v.revision === r.published_revision)?.id as string | undefined }));
}

export type Summary = {
	overview: SyllabusDoc['overview'];
	evalItems: SyllabusDoc['evaluation']['items'];
	gradingScheme: string;
	methods: string[];
};

/** Card-sized projection of the published snapshots: no weekly plans, readings or work items. */
export async function publishedSummaries(sb: SB, offerings: { id: string; published_revision: number | null }[]): Promise<Map<string, Summary>> {
	const out = new Map<string, Summary>();
	const want = offerings.filter((o) => o.published_revision != null);
	if (!want.length) return out;
	const { data } = await sb
		.from('offering_versions')
		.select('offering_id, revision, overview:syllabus->overview, evalItems:syllabus->evaluation->items, gradingScheme:syllabus->evaluation->>gradingScheme, methods:syllabus->approach->methods')
		.in('offering_id', want.map((o) => o.id));
	for (const v of (data ?? []) as unknown as (Summary & { offering_id: string; revision: number })[])
		if (want.find((o) => o.id === v.offering_id)?.published_revision === v.revision) out.set(v.offering_id, v);
	return out;
}
