/** Data for one course page (spec 04 R2) — current semester or a past published version. */
import { courseStatusFor, curriculumFor, staffBadges, statusLabel } from '$lib/domain/curriculum';
import type { SyllabusDoc } from '$lib/schema/syllabus';
import type { Profile } from '$lib/types';
import type { CourseInfo, InstructorView, RelatedCourse, SectionView } from '$lib/view-types';
import { courses, curriculumRows } from './student';

type SB = App.Locals['supabase'];

export async function badgesFor(sb: SB, profile: Profile, course: CourseInfo, rows?: Awaited<ReturnType<typeof curriculumRows>>) {
	rows ??= await curriculumRows(sb);
	if (profile.role === 'student' && profile.cohort != null) {
		const c = curriculumFor(profile.cohort);
		return [statusLabel(courseStatusFor(course.code, c.id, profile.major, rows, course.department))];
	}
	return staffBadges(course.code, rows, course.department);
}

/** Prerequisites of this course and courses that list it as one: catalog only, never caution data (spec 04 R2). */
export function related(catalog: Map<string, CourseInfo>, course: CourseInfo): { requires: RelatedCourse[]; buildsFor: RelatedCourse[] } {
	const ref = (code: string) => ({ code, name_th: catalog.get(code)?.name_th ?? code });
	return {
		requires: course.prerequisite_codes.map(ref),
		buildsFor: [...catalog.values()].filter((c) => c.prerequisite_codes.includes(course.code)).map((c) => ref(c.code))
	};
}

export async function plosMap(sb: SB): Promise<Record<string, string>> {
	const { data } = await sb.from('plos').select('code, text_th');
	return Object.fromEntries(((data ?? []) as { code: string; text_th: string }[]).map((p) => [p.code, p.text_th]));
}

/** One card per instructor with the sections they teach (spec 04 R2 Professor block). */
export async function instructorsFor(sb: SB, sections: SectionView[]): Promise<InstructorView[]> {
	const ids = [...new Set(sections.flatMap((s) => s.instructors.map((i) => i.id)).filter((x): x is string => !!x))];
	const { data } = ids.length ? await sb.from('profiles').select('id, title_th, name_th, name_en, office, office_hours, contact_note').in('id', ids) : { data: [] };
	const byId = new Map(((data ?? []) as InstructorView[]).map((p) => [p.id, p]));
	const out: InstructorView[] = [];
	for (const s of sections)
		for (const i of s.instructors) {
			const existing = out.find((o) => (i.id ? o.id === i.id : o.name_th === i.name_th));
			if (existing) {
				if (!existing.sections.includes(s.section_no)) existing.sections.push(s.section_no);
				continue;
			}
			const p = i.id ? byId.get(i.id) : undefined;
			out.push({ id: i.id, title_th: p?.title_th ?? i.title_th, name_th: p?.name_th ?? i.name_th, name_en: p?.name_en ?? i.name_en, office: p?.office ?? null, office_hours: p?.office_hours ?? null, contact_note: p?.contact_note ?? null, sections: [s.section_no] });
		}
	return out;
}

/** sections_snapshot (0002) → SectionView, for read-only past versions */
export function snapshotSections(snap: unknown): SectionView[] {
	return ((snap ?? []) as any[]).map((s) => ({
		id: s.id,
		section_no: s.sectionNo,
		language: s.language,
		capacity: s.capacity,
		note: s.note ?? '',
		meetings: (s.meetings ?? []).map((m: any) => ({ weekday: m.weekday, starts_at: m.startsAt, ends_at: m.endsAt, room: m.room ?? '', mode: m.mode ?? 'onsite' })),
		instructors: (s.instructors ?? []).map((i: any) => ({ id: i.profileId ?? null, title_th: i.titleTh ?? null, name_th: i.nameTh ?? i.guestName ?? null, name_en: i.nameEn ?? null, role: i.role }))
	}));
}

export async function catalogAndRows(sb: SB) {
	const [catalog, rows] = await Promise.all([courses(sb), curriculumRows(sb)]);
	return { catalog, rows };
}

export type CoursePageDoc = { doc: SyllabusDoc; versionId: string; published_at: string };
