/**
 * Field-level comparison of two syllabi (spec 05 R10): weeks by number, evaluation items by
 * type + title, readings by their identifiers (as reading_key does), objectives by text.
 * A compact list for people, not a JSON diff. Pure; unit-tested.
 */
import type { SyllabusDoc } from '$lib/schema/syllabus';
import { readingKeys } from './compare';

export type DocDiff = {
	weeks: { added: { week: number; topic: string }[]; removed: { week: number; topic: string }[]; changed: { week: number; from: string; to: string }[] };
	evaluation: { added: { title: string; weight: number }[]; removed: { title: string; weight: number }[]; changed: { title: string; from: number; to: number }[] };
	readings: { added: string[]; removed: string[] };
	objectives: { added: string[]; removed: string[] };
	focusChanged: boolean;
};

const norm = (s: string) => s.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');

/** from = older version, to = newer version */
export function diffDocs(from: SyllabusDoc, to: SyllabusDoc): DocDiff {
	const wFrom = new Map(from.weeklyPlan.map((w) => [w.week, w]));
	const wTo = new Map(to.weeklyPlan.map((w) => [w.week, w]));
	const weeks: DocDiff['weeks'] = { added: [], removed: [], changed: [] };
	for (const [n, w] of wTo) {
		const old = wFrom.get(n);
		if (!old) weeks.added.push({ week: n, topic: w.topic });
		else if (norm(old.topic) !== norm(w.topic)) weeks.changed.push({ week: n, from: old.topic, to: w.topic });
	}
	for (const [n, w] of wFrom) if (!wTo.has(n)) weeks.removed.push({ week: n, topic: w.topic });
	weeks.changed.sort((a, b) => a.week - b.week);

	// evaluation: same type and title is the same item; otherwise fall back to the id
	const key = (e: SyllabusDoc['evaluation']['items'][number]) => `${e.type}|${norm(e.title)}`;
	const evaluation: DocDiff['evaluation'] = { added: [], removed: [], changed: [] };
	const matched = new Set<string>();
	for (const e of to.evaluation.items) {
		const old = from.evaluation.items.find((x) => key(x) === key(e)) ?? from.evaluation.items.find((x) => x.id === e.id && x.type === e.type);
		if (!old) evaluation.added.push({ title: e.title, weight: e.weightPercent });
		else {
			matched.add(old.id);
			if (old.weightPercent !== e.weightPercent) evaluation.changed.push({ title: e.title, from: old.weightPercent, to: e.weightPercent });
		}
	}
	for (const e of from.evaluation.items) if (!matched.has(e.id)) evaluation.removed.push({ title: e.title, weight: e.weightPercent });

	const has = (doc: SyllabusDoc, r: SyllabusDoc['resources']['readings'][number]) => {
		const k = readingKeys(r);
		return doc.resources.readings.some((x) => readingKeys(x).some((y) => k.includes(y)));
	};
	const readings = {
		added: to.resources.readings.filter((r) => !has(from, r)).map((r) => r.citation),
		removed: from.resources.readings.filter((r) => !has(to, r)).map((r) => r.citation)
	};

	const objFrom = new Set(from.objectives.map((o) => norm(o.text)));
	const objTo = new Set(to.objectives.map((o) => norm(o.text)));
	const objectives = {
		added: to.objectives.filter((o) => !objFrom.has(norm(o.text))).map((o) => o.text),
		removed: from.objectives.filter((o) => !objTo.has(norm(o.text))).map((o) => o.text)
	};

	return { weeks, evaluation, readings, objectives, focusChanged: norm(from.overview.focus) !== norm(to.overview.focus) };
}

export function isEmptyDiff(d: DocDiff): boolean {
	return (
		!d.focusChanged &&
		[d.weeks.added, d.weeks.removed, d.weeks.changed, d.evaluation.added, d.evaluation.removed, d.evaluation.changed, d.readings.added, d.readings.removed, d.objectives.added, d.objectives.removed].every((l) => l.length === 0)
	);
}

/** Which top-level sections differ (the conflict dialog lists them, spec 05 R5). */
export const SECTION_KEYS = ['overview', 'objectives', 'approach', 'weeklyPlan', 'evaluation', 'resources', 'work', 'keyDates'] as const;
export function changedSections(a: SyllabusDoc, b: SyllabusDoc): (typeof SECTION_KEYS)[number][] {
	return SECTION_KEYS.filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
}
