/** Semester weeks → dates (spec 04 Timetable). Week 1 starts on semesters.starts_on. Pure; unit-tested. */

/** ISO date (YYYY-MM-DD) of the first day of week n. Date-only arithmetic in UTC, so no time zone shifts. */
export function weekStart(startsOn: string, week: number): string {
	const d = new Date(`${startsOn}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + 7 * (week - 1));
	return d.toISOString().slice(0, 10);
}

export function weekRange(startsOn: string, week: number): { from: string; to: string } {
	const from = weekStart(startsOn, week);
	const to = new Date(`${from}T00:00:00Z`);
	to.setUTCDate(to.getUTCDate() + 4); // Monday–Friday
	return { from, to: to.toISOString().slice(0, 10) };
}

/** Exam weeks are shaded: noClass rows whose topic names an exam, or a key date marking one. */
export function isExamWeek(topic: string): boolean {
	return /สอบ|exam/i.test(topic);
}
