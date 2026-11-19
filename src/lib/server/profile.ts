/** Profile edits go through courseplat.update_my_profile (security definer; students can change only their major). */
import type { Major, Profile } from '$lib/types';

export const MAJORS: readonly Major[] = ['GOV', 'IR', 'SOC', 'PA'];
export const isMajor = (v: unknown): v is Major => typeof v === 'string' && (MAJORS as readonly string[]).includes(v);

const text = (f: FormData, k: string, max = 200) => {
	const v = String(f.get(k) ?? '').trim().slice(0, max);
	return v === '' ? null : v;
};

export async function saveMyProfile(supabase: App.Locals['supabase'], profile: Profile, form: FormData) {
	const major = form.get('major');
	if (profile.role === 'student' && !isMajor(major)) return { ok: false as const };
	const { error } = await supabase.rpc('update_my_profile', {
		p_title_th: text(form, 'title_th', 60),
		p_name_th: text(form, 'name_th'),
		p_name_en: text(form, 'name_en'),
		p_office: text(form, 'office'),
		p_office_hours: text(form, 'office_hours'),
		p_contact_note: text(form, 'contact_note', 500),
		p_major: profile.role === 'student' ? major : null
	});
	return { ok: !error };
}
