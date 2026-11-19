/**
 * Concept tags (spec 06 Stage 2a): one canonical form per idea, so "stages model" in one syllabus
 * meets "policy cycle" in another. Small and hand-made on purpose; extend it when a real pair is missed.
 */
const SYNONYMS: string[][] = [
	['policy cycle', 'stages model', 'stages heuristic', 'policy process', 'ตัวแบบขั้นตอนนโยบาย', 'กระบวนการนโยบาย'],
	['monitoring and evaluation', 'm&e', 'm and e', 'การติดตามและประเมินผล'],
	['multiple streams', 'multiple streams framework', 'msf', 'กระแสหลายสาย'],
	['logic model', 'ตัวแบบเชิงตรรกะ'],
	['policy evaluation', 'program evaluation', 'programme evaluation', 'การประเมินผลนโยบาย'],
	['impact evaluation', 'impact assessment', 'การประเมินผลกระทบ'],
	['behavioural public policy', 'behavioral public policy', 'behavioural insights', 'behavioral insights', 'นโยบายเชิงพฤติกรรม'],
	['nudge', 'choice architecture'],
	['workforce planning', 'manpower planning', 'การวางแผนกำลังคน'],
	['manpower analysis', 'workforce analysis', 'การวิเคราะห์อัตรากำลัง'],
	['human resource planning', 'hr planning', 'human resources planning', 'การวางแผนทรัพยากรมนุษย์'],
	['budget cycle', 'budgetary cycle', 'วงจรงบประมาณ'],
	['budget process', 'budgetary process', 'กระบวนการงบประมาณ'],
	['classical organization theory', 'classical organisation theory', 'ทฤษฎีองค์การยุคคลาสสิก'],
	['bureaucracy', 'ideal type bureaucracy', 'ระบบราชการ'],
	['scientific management', 'taylorism'],
	['training needs analysis', 'tna', 'การวิเคราะห์ความจำเป็นในการฝึกอบรม'],
	['cost-benefit analysis', 'cost benefit analysis', 'cba', 'การวิเคราะห์ต้นทุนผลประโยชน์'],
	['stakeholder analysis', 'การวิเคราะห์ผู้มีส่วนได้ส่วนเสีย'],
	['implementation', 'policy implementation', 'การนำนโยบายไปปฏิบัติ'],
	['new public management', 'npm']
];

const singular = (w: string) => (/[^s]ies$/.test(w) ? w.slice(0, -3) + 'y' : /[^su]s$/.test(w) && !/(sis|ics)$/.test(w) && w.length > 3 ? w.slice(0, -1) : w);

function base(tag: string): string {
	return tag
		.normalize('NFC')
		.toLowerCase()
		.trim()
		.replace(/[-_/]+/g, ' ')
		.replace(/\s+/g, ' ')
		.split(' ')
		.map(singular)
		.join(' ');
}

const CANON = new Map<string, string>();
for (const group of SYNONYMS) for (const t of group) CANON.set(base(t), base(group[0]));

export function normalizeTag(tag: string): string {
	const b = base(tag);
	return CANON.get(b) ?? b;
}

export function tagSet(tags: string[]): Set<string> {
	return new Set(tags.map(normalizeTag).filter(Boolean));
}
