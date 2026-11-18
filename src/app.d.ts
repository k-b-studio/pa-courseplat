import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

export type Role = 'student' | 'viewer' | 'instructor' | 'staff';

export type Profile = {
	id: string;
	email: string;
	role: Role;
	cohort: number | null;
	major: 'GOV' | 'IR' | 'SOC' | 'PA' | null;
	title_th: string | null;
	name_th: string | null;
	name_en: string | null;
	office: string | null;
	office_hours: string | null;
	contact_note: string | null;
	is_demo: boolean;
	cautions_seen_at: string | null;
};

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<any, 'courseplat'>;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
			profile: Profile | null;
		}
		interface PageData {
			profile?: Profile | null;
		}
		interface Error {
			message: string;
		}
	}
}

export {};
