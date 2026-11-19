/** Stage 3 — relation adjustment, severity table, pair keys (spec 06; pure, unit-tested). */
export type Kind = 'topic' | 'reading' | 'assignment' | 'objective';
export type Relation = 'duplicate' | 'builds_on' | 'related';
export type Severity = 'high' | 'medium' | 'info';
export type Side = { code: string; semester: string; ref: string };

export const sideKey = (s: Side) => `${s.code}@${s.semester}#${s.ref}`;

/** kind|side1|side2 with the two sides sorted, so either order gives the same key (AC 1) */
export function pairKey(kind: Kind, a: Side, b: Side): string {
	const [x, y] = [sideKey(a), sideKey(b)].sort();
	return `${kind}|${x}|${y}`;
}
/** canonical a/b order, as stored in content_cautions */
export const canonical = <T extends Side>(a: T, b: T): [T, T] => (sideKey(a) <= sideKey(b) ? [a, b] : [b, a]);

export const ADJUST_NOTE = " (ระบบปรับเป็น 'ต่อยอด' เนื่องจากเป็นวิชาต่อเนื่องตามลำดับชั้นปี/วิชาบังคับก่อน)";
export const DUE_NOTE = ' — กำหนดส่งห่างกันไม่เกิน 1 สัปดาห์';

export type CourseFacts = { code: string; prerequisites: string[] };
const level = (code: string) => Number(code[4]);

/** duplicate → builds_on when one course is a prerequisite of the other or their levels differ by ≥ 2 */
export function adjustRelation(relation: Relation, a: CourseFacts, b: CourseFacts): { relation: Relation; adjusted: boolean } {
	if (relation !== 'duplicate') return { relation, adjusted: false };
	const linked = a.prerequisites.includes(b.code) || b.prerequisites.includes(a.code);
	if (linked || Math.abs(level(a.code) - level(b.code)) >= 2) return { relation: 'builds_on', adjusted: true };
	return { relation, adjusted: false };
}

/** the severity table (first matching row wins) */
export function severityFor(p: { kind: Kind; relation: Relation; similarity: number; sameSemester: boolean; bothRequired?: boolean }): Severity {
	if (p.kind === 'assignment' && p.relation === 'duplicate') return p.similarity >= 0.75 && p.sameSemester ? 'high' : 'medium';
	if (p.kind === 'topic' && p.relation === 'duplicate') {
		if (p.similarity >= 0.85) return 'high';
		if (p.similarity >= 0.7) return 'medium';
	}
	if (p.kind === 'reading' && p.bothRequired && p.sameSemester) return 'medium';
	return 'info';
}

/** high/medium assignment pairs due within a week of each other in the same semester */
export function dueNote(p: { kind: Kind; severity: Severity; sameSemester: boolean; weekA: number | null; weekB: number | null }): string {
	return p.kind === 'assignment' && p.severity !== 'info' && p.sameSemester && p.weekA != null && p.weekB != null && Math.abs(p.weekA - p.weekB) <= 1 ? DUE_NOTE : '';
}

export const similarityWord = (s: number) => (s >= 0.85 ? 'สูงมาก' : s >= 0.7 ? 'สูง' : 'ปานกลาง');
