/** Shapes the student pages render (built on the server from RLS-filtered queries). */
export type Semester = { id: string; label: string; status: 'archived' | 'active' | 'upcoming'; starts_on: string; weeks: number; syllabus_due_on: string | null };

export type CourseInfo = {
	code: string;
	name_th: string;
	name_en: string;
	credits: number;
	credit_format: string;
	level: number;
	department: string;
	prerequisite_text: string | null;
	prerequisite_codes: string[];
	description_th: string | null;
	description_en: string | null;
	managed_here: boolean;
};

export type MeetingView = { weekday: number; starts_at: string; ends_at: string; room: string; mode: string };
export type PersonView = { id: string | null; title_th: string | null; name_th: string | null; name_en: string | null; role?: string };
export type SectionView = { id: string; section_no: number; language: string; capacity: number | null; note: string; meetings: MeetingView[]; instructors: PersonView[] };
export type InstructorView = PersonView & { office: string | null; office_hours: string | null; contact_note: string | null; sections: number[] };
export type RelatedCourse = { code: string; name_th: string };

/** One offering on /courses (spec 04 R1): catalog data plus a projection of the published snapshot. */
export type Card = {
	code: string;
	offeringId: string | null;
	name_th: string;
	name_en: string;
	credit_format: string;
	level: number;
	published: boolean;
	badges: string[];
	statusKinds: string[];
	trackIds: string[];
	sectionCount: number;
	firstMeeting: { weekday: number; starts_at: string; ends_at: string } | null;
	weekdays: number[];
	languages: string[];
	instructors: string[];
	evalItems: { type: string; weight: number; title: string }[];
	gradingScheme: string | null;
	hours: number | null;
	keywords: string[];
	lastPublished: { semesterId: string; label: string } | null;
};
