import type { CourseInfo, InstructorView, SectionView, Semester } from '$lib/view-types';

export type FormCtx = { course: CourseInfo; semester: Semester; instructors: InstructorView[]; plos: Record<string, string>; suggestedPlos: string[]; sections: SectionView[] };
export type MetaKey = 'overview' | 'objectives' | 'approach' | 'weeklyPlan' | 'evaluation' | 'resources' | 'work' | 'keyDates';
export type SectionMeta = Partial<Record<MetaKey, { confidence: string; evidence: string }>>;

/** strict-schema issue path → editor card id (spec 05 R6) */
export function cardFor(path: (string | number)[]): string {
	const head = String(path[0] ?? 'overview');
	return head === 'weeklyPlan' || head === 'keyDates' ? 'timetable' : head;
}
export function anchorFor(path: (string | number)[]): string {
	return typeof path[1] === 'number' && ['objectives', 'evaluation', 'resources', 'work', 'weeklyPlan'].includes(String(path[0])) ? `f-${path[0]}-${path[1]}` : cardFor(path);
}
