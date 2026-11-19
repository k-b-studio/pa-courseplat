/** Shared app types (no runtime code). */
export type Role = 'student' | 'viewer' | 'instructor' | 'staff';
export type Major = 'GOV' | 'IR' | 'SOC' | 'PA';

/** courseplat.profiles row */
export type Profile = {
	id: string;
	email: string;
	role: Role;
	cohort: number | null;
	major: Major | null;
	title_th: string | null;
	name_th: string | null;
	name_en: string | null;
	office: string | null;
	office_hours: string | null;
	contact_note: string | null;
	is_demo: boolean;
	cautions_seen_at: string | null;
};
