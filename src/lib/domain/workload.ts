/** Weekly assessed load (spec 04 "Workload"). Pure; unit-tested. */
import { selfStudyHours, type SyllabusDoc } from '$lib/schema/syllabus';

export type LoadItem = { title: string; weight: number; course?: string };
export type WeeklyLoad = {
	/** index 0 = week 1 */
	load: number[];
	items: LoadItem[][];
	/** finals usually fall after the last teaching week: shown as a separate column */
	finals: LoadItem[];
	/** weighted items with no week anywhere (participation, weekly exercises…) */
	undated: LoadItem[];
};

const isExam = (t: string, label: RegExp) => label.test(t);

export function weeklyLoad(doc: Pick<SyllabusDoc, 'evaluation' | 'keyDates'>, weeks = 16, course?: string): WeeklyLoad {
	const load = Array.from({ length: weeks }, () => 0);
	const items: LoadItem[][] = Array.from({ length: weeks }, () => []);
	const finals: LoadItem[] = [];
	const undated: LoadItem[] = [];
	const keyWeek = (re: RegExp) => doc.keyDates.find((k) => re.test(k.label) && k.week != null)?.week ?? null;

	for (const e of doc.evaluation.items) {
		const item = { title: e.title, weight: e.weightPercent, course };
		let week = e.dueWeek;
		if (week == null && e.type === 'midterm_exam') week = keyWeek(/กลางภาค|midterm/i);
		if (week == null && e.type === 'final_exam') week = keyWeek(/ปลายภาค|final/i);
		if (week != null && week >= 1 && week <= weeks) {
			load[week - 1] += e.weightPercent;
			items[week - 1].push(item);
		} else if (e.type === 'final_exam' || isExam(e.title, /ปลายภาค/)) finals.push(item);
		else undated.push(item);
	}
	return { load, items, finals, undated };
}

export type Basket = { rows: WeeklyLoad[]; total: number[]; totalFinals: number };

export function basketLoad(docs: { doc: Pick<SyllabusDoc, 'evaluation' | 'keyDates'>; course: string }[], weeks = 16): Basket {
	const rows = docs.map((d) => weeklyLoad(d.doc, weeks, d.course));
	const total = Array.from({ length: weeks }, (_, i) => rows.reduce((s, r) => s + r.load[i], 0));
	const totalFinals = rows.reduce((s, r) => s + r.finals.reduce((a, f) => a + f.weight, 0), 0);
	return { rows, total, totalFinals };
}

/** Weeks where the combined weight is heavy enough to outline (spec 04 R3: ≥ 40%). */
export const HEAVY_WEEK = 40;

export function hoursPerWeek(doc: Pick<SyllabusDoc, 'overview'>, creditFormat: string | null | undefined): number | null {
	return doc.overview.workloadHoursPerWeek ?? selfStudyHours(creditFormat);
}
