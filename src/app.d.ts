import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Profile } from '$lib/types';

export type { Profile, Role } from '$lib/types';

declare global {
	namespace App {
		interface Locals {
			/** per-request client acting as the signed-in user (RLS applies); schema courseplat */
			supabase: SupabaseClient<any, 'courseplat'>;
			/** validates the session with auth.getUser(), never trusts the cookie alone (spec 03) */
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
