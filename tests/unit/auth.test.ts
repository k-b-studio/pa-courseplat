import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STAFF_EMAIL, STUDENT_EMAIL, homeRouteFor, isStaffEmail, isStudentEmail } from '$lib/domain/accounts';
import { cohortFromEmail, curriculumFor, curriculumForCohort } from '$lib/domain/curriculum';

describe('spec 03 AC 1 — cohort and curriculum', () => {
	it('reads the cohort from a PolSci student address', () => {
		expect(cohortFromEmail('6712345624@student.chula.ac.th')).toBe(67);
		expect(cohortFromEmail('6712345621@student.chula.ac.th')).toBeNull();
		expect(cohortFromEmail('somchai.j@chula.ac.th')).toBeNull();
	});
	it('maps cohorts to curricula', () => {
		expect(curriculumForCohort(67)).toBe('polsci-2564');
		expect(curriculumForCohort(69)).toBe('polsci-2569');
		expect(curriculumForCohort(70)).toBe('polsci-2569');
		expect(curriculumFor(65)).toEqual({ id: 'polsci-2564', notice: true });
		expect(curriculumFor(66)).toEqual({ id: 'polsci-2564', notice: false });
	});
});

describe('spec 03 AC 2 — address rules', () => {
	const accepted = ['6712345624@student.chula.ac.th', 'somchai.j@chula.ac.th'];
	const refused = ['6712345621@student.chula.ac.th', '671234524@student.chula.ac.th', 'someone@gmail.com', 'x@chula.ac.th.evil.com'];
	it.each(accepted)('accepts %s', (e) => expect(isStudentEmail(e) || isStaffEmail(e)).toBe(true));
	it.each(refused)('refuses %s', (e) => expect(isStudentEmail(e) || isStaffEmail(e)).toBe(false));

	it('uses exactly the patterns in the SQL hook and ensure_profile', () => {
		const sql = readFileSync('supabase/migrations/0004_auth.sql', 'utf-8');
		const inSql = [...sql.matchAll(/~ '([^']+)'/g)].map((m) => m[1]);
		expect(inSql).toContain(STUDENT_EMAIL.source);
		expect(inSql).toContain(STAFF_EMAIL.source);
		expect(new Set(inSql)).toEqual(new Set([STUDENT_EMAIL.source, STAFF_EMAIL.source]));
	});
});

describe('home route by role', () => {
	it('sends each role to its area', () => {
		expect(homeRouteFor(null)).toBe('/');
		expect(homeRouteFor({ role: 'student', major: null })).toBe('/onboarding');
		expect(homeRouteFor({ role: 'student', major: 'PA' })).toBe('/courses');
		expect(homeRouteFor({ role: 'viewer', major: null })).toBe('/courses');
		expect(homeRouteFor({ role: 'instructor', major: null })).toBe('/teach');
		expect(homeRouteFor({ role: 'staff', major: null })).toBe('/admin');
	});
});
