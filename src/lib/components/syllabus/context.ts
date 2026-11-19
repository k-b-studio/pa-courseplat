import type { SyllabusDoc } from '$lib/schema/syllabus';
import type { CourseInfo, InstructorView, SectionView, Semester } from '$lib/view-types';

/** Everything a syllabus block may render. Built on the server from published snapshots. */
export type SyllabusContext = {
	doc: SyllabusDoc;
	course: CourseInfo;
	semester: Semester;
	sections: SectionView[];
	instructors: InstructorView[];
	plos: Record<string, string>;
};

export const methodLabel = (m: string, labels: Record<string, string>) => labels[m] ?? m;
