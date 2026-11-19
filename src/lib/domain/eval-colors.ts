/** One palette for evaluation types across every course (spec 04 "Visual direction"). */
export type EvalGroup = 'exam' | 'quiz' | 'paper' | 'project' | 'presentation' | 'participation' | 'other';

const GROUP: Record<string, EvalGroup> = {
	midterm_exam: 'exam',
	final_exam: 'exam',
	quiz: 'quiz',
	paper: 'paper',
	policy_brief: 'paper',
	case_analysis: 'paper',
	project: 'project',
	presentation: 'presentation',
	participation: 'participation',
	attendance: 'participation',
	reflection: 'other',
	other: 'other'
};

export const evalGroup = (type: string): EvalGroup => GROUP[type] ?? 'other';
/** CSS custom property defined in app.css (@theme) */
export const evalColor = (type: string) => `var(--color-ev-${evalGroup(type)})`;

/** Stacking order: the validated categorical order of the palette in app.css, so neighbouring segments always differ enough */
export const EVAL_ORDER: EvalGroup[] = ['exam', 'quiz', 'paper', 'project', 'presentation', 'participation', 'other'];
export const evalRank = (type: string) => EVAL_ORDER.indexOf(evalGroup(type));
