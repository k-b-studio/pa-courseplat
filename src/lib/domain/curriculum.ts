/**
 * Cohort → curriculum (spec 03 AC 1, spec 04 badge logic). Pure; unit-tested.
 * 2564 covers cohorts 66–68; 2569 covers cohort 69 onwards. Older cohorts fall back to 2564
 * with a notice, because this demo has no earlier curriculum.
 */
export type CurriculumId = 'polsci-2564' | 'polsci-2569';

/** First two digits of a PolSci student ID (`6712345624@…` → 67); null for any other address. */
export function cohortFromEmail(email: string): number | null {
	const m = /^([0-9]{2})[0-9]{6}24@student\.chula\.ac\.th$/.exec(email.trim().toLowerCase());
	return m ? Number(m[1]) : null;
}

export function curriculumForCohort(cohort: number): CurriculumId {
	return cohort >= 69 ? 'polsci-2569' : 'polsci-2564';
}

/** The same, plus whether to show "this cohort predates the curricula in the system". */
export function curriculumFor(cohort: number): { id: CurriculumId; notice: boolean } {
	return { id: curriculumForCohort(cohort), notice: cohort < 66 };
}
