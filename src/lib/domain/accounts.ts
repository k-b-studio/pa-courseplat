/**
 * Address rules (spec 03 R2). The same patterns are enforced in Postgres by
 * public.shared_before_user_created and courseplat.ensure_profile (0004_auth.sql); the
 * regex table test keeps the two in step. The browser never decides access with these.
 */
import type { Role } from '$lib/types';

/** 10-digit student ID ending in faculty code 24 (Political Science) — creditGPAX's rule. */
export const STUDENT_EMAIL = /^[0-9]{8}24@student\.chula\.ac\.th$/;
/** Any Chula staff address. */
export const STAFF_EMAIL = /^[a-z0-9._%+-]+@chula\.ac\.th$/;

export const isStudentEmail = (email: string) => STUDENT_EMAIL.test(email.trim().toLowerCase());
export const isStaffEmail = (email: string) => STAFF_EMAIL.test(email.trim().toLowerCase());

/** Where each role lands after signing in (spec 03 flow). */
export function homeRouteFor(profile: { role: Role; major: string | null } | null): string {
	if (!profile) return '/';
	if (profile.role === 'student' && !profile.major) return '/onboarding';
	if (profile.role === 'instructor') return '/teach';
	if (profile.role === 'staff') return '/admin';
	return '/courses';
}

/** Which areas a role may open (spec 03 R5). The server enforces this; menus only mirror it. */
export const canTeach = (role: Role | undefined) => role === 'instructor' || role === 'staff';
export const isStaffRole = (role: Role | undefined) => role === 'staff';

/** Demo accounts behind the landing-page buttons (spec 03, spec 08). Emails are not secret. */
export const DEMO_BUTTONS = [
	{ key: 'student', email: 'student.pa67@courseplat.test', label: 'นิสิตตัวอย่าง (PA ปี 3)', role: 'student' },
	{ key: 'prof-natthida', email: 'natthida.k@courseplat.test', label: 'อ.ดร.ณัฐธิดา แก้วมณี', role: 'instructor' },
	{ key: 'prof-thanakrit', email: 'thanakrit.w@courseplat.test', label: 'ผศ.ดร.ธนกฤต วงศ์ประเสริฐ', role: 'instructor' },
	{ key: 'staff', email: 'onuma.j@courseplat.test', label: 'คุณอรอุมา ใจงาม (เจ้าหน้าที่)', role: 'staff' }
] as const satisfies readonly { key: string; email: string; label: string; role: Role }[];

export type DemoKey = (typeof DEMO_BUTTONS)[number]['key'];
export const demoButton = (key: string) => DEMO_BUTTONS.find((b) => b.key === key);
