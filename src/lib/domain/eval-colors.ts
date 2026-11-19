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
