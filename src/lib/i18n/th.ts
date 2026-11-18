/**
 * All UI copy (Thai). Section titles show Thai first with the brief's English name.
 */
import vocab from '../../../data/plos-2569.json';
import type { EvalType, ReadingType, TeachingMethod, WorkType } from '$lib/schema/syllabus';

export const APP_NAME = 'PA CoursePlat';
export const APP_NAME_TH = 'แพลตฟอร์มกลางรายวิชา ภาควิชารัฐประศาสนศาสตร์';

export const t = {
	appName: APP_NAME,
	appNameTh: APP_NAME_TH,
	dept: 'ภาควิชารัฐประศาสนศาสตร์ คณะรัฐศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย',
	footer: 'ต้นแบบเพื่อการนำเสนอ — ไม่ใช่ระบบทางการของจุฬาลงกรณ์มหาวิทยาลัย',
	demoData: 'ข้อมูลตัวอย่างเพื่อการสาธิต',
	demoBadge: 'ข้อมูลตัวอย่าง',

	nav: {
		courses: 'รายวิชา',
		compare: 'เปรียบเทียบ',
		curriculum: 'แผนที่หลักสูตร',
		teach: 'รายวิชาที่สอน',
		cautions: 'ข้อควรระวังด้านเนื้อหา',
		admin: 'ภาควิชา',
		semesters: 'ภาคการศึกษา',
		people: 'บุคลากร',
		profile: 'โปรไฟล์',
		signOut: 'ออกจากระบบ',
		switchDemo: 'สลับบัญชีตัวอย่าง',
		menu: 'เมนู'
	},

	roles: { student: 'นิสิต', viewer: 'ผู้เยี่ยมชม', instructor: 'อาจารย์', staff: 'เจ้าหน้าที่' } as Record<string, string>,

	auth: {
		signInChula: 'เข้าสู่ระบบด้วยบัญชีจุฬาฯ',
		signInHint: 'ใช้บัญชี Google ของจุฬาฯ: นิสิตคณะรัฐศาสตร์ (…24@student.chula.ac.th) หรือบุคลากร (@chula.ac.th)',
		demoPanel: 'บัญชีตัวอย่างสำหรับการสาธิต',
		demoPanelHint: 'บุคคลและประมวลรายวิชาทั้งหมดเป็นข้อมูลสมมติ',
		errorTitle: 'เข้าสู่ระบบไม่สำเร็จ',
		refused: 'อีเมลนี้ใช้เข้าระบบไม่ได้ ระบบรองรับเฉพาะนิสิตคณะรัฐศาสตร์ (…24@student.chula.ac.th) และบุคลากรจุฬาฯ (@chula.ac.th)',
		genericError: 'เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ โปรดลองอีกครั้ง',
		backHome: 'กลับหน้าแรก',
		viewerBanner:
			'บัญชีของคุณยังไม่มีสิทธิ์แก้ไขรายวิชา หากคุณเป็นอาจารย์ในภาควิชารัฐประศาสนศาสตร์ โปรดติดต่อเจ้าหน้าที่ภาควิชาเพื่อเพิ่มอีเมลของคุณในระบบ',
		wrongRole: 'หน้านี้สำหรับอาจารย์และเจ้าหน้าที่ภาควิชาเท่านั้น',
		staffOnly: 'หน้านี้สำหรับเจ้าหน้าที่ภาควิชาเท่านั้น',
		forbidden: 'คุณไม่มีสิทธิ์แก้ไขรายวิชานี้'
	},

	onboarding: {
		title: 'เลือกสาขาวิชาของคุณ',
		lead: 'ระบบจะใช้สาขาวิชาเพื่อบอกว่ารายวิชาใดเป็นวิชาบังคับหรือวิชาเลือกสำหรับคุณ เปลี่ยนได้ภายหลังในหน้าโปรไฟล์',
		save: 'บันทึก'
	},

	majors: {
		GOV: 'การปกครอง (GOV)',
		IR: 'ความสัมพันธ์ระหว่างประเทศ (IR)',
		SOC: 'สังคมวิทยาและมานุษยวิทยา (SOC)',
		PA: 'รัฐประศาสนศาสตร์ (PA)'
	} as Record<string, string>,

	/** The nine sections, Thai first with the brief's English name (spec 01). */
	sections: {
		overview: { th: 'ภาพรวมรายวิชา', en: 'Course Overview' },
		objectives: { th: 'วัตถุประสงค์และผลลัพธ์การเรียนรู้', en: 'Objectives' },
		approach: { th: 'แนวทางการจัดการเรียนการสอน', en: 'Classroom Approach' },
		evaluation: { th: 'การวัดและประเมินผล', en: 'Evaluation' },
		resources: { th: 'เอกสารและทรัพยากรการเรียนรู้', en: 'Class Resources' },
		work: { th: 'งานที่มอบหมาย', en: 'Work' },
		professors: { th: 'อาจารย์ผู้สอน', en: 'Professor (Section)' },
		timetable: { th: 'ตารางเรียนและแผนการสอน', en: 'Timetable' },
		sections: { th: 'ตอนเรียน', en: 'Section' }
	},

	offeringStatus: { not_started: 'ยังไม่เริ่ม', draft: 'ฉบับร่าง', published: 'เผยแพร่แล้ว' } as Record<string, string>,
	semesterStatus: { archived: 'สิ้นสุดแล้ว', active: 'กำลังเรียน', upcoming: 'ภาคถัดไป' } as Record<string, string>,

	language: { th: 'ภาษาไทย', en: 'ภาษาอังกฤษ', th_en: 'ไทยและอังกฤษ' } as Record<string, string>,
	deliveryMode: { onsite: 'ในห้องเรียน', online: 'ออนไลน์', hybrid: 'ผสมผสาน' } as Record<string, string>,
	aiPolicy: {
		not_allowed: 'ไม่อนุญาตให้ใช้ AI',
		allowed_with_disclosure: 'ใช้ AI ได้ โดยต้องระบุการใช้',
		allowed: 'ใช้ AI ได้',
		unspecified: 'ไม่ได้ระบุนโยบาย AI'
	} as Record<string, string>,
	gradingScheme: { letter: 'เกรด A–F', su: 'S/U' } as Record<string, string>,
	referencing: { criterion: 'อิงเกณฑ์', norm: 'อิงกลุ่ม', mixed: 'อิงเกณฑ์และอิงกลุ่ม', unspecified: 'ไม่ได้ระบุ' } as Record<string, string>,

	teachingMethods: vocab.vocabularies.teachingMethods as Record<TeachingMethod, string>,
	evalTypes: {
		midterm_exam: 'สอบกลางภาค',
		final_exam: 'สอบปลายภาค',
		quiz: 'แบบทดสอบย่อย',
		paper: 'รายงาน',
		policy_brief: 'ข้อเสนอเชิงนโยบาย (policy brief)',
		case_analysis: 'วิเคราะห์กรณีศึกษา',
		presentation: 'การนำเสนอ',
		project: 'โครงงาน',
		participation: 'การมีส่วนร่วม',
		attendance: 'การเข้าชั้นเรียน',
		reflection: 'บันทึกสะท้อนการเรียนรู้',
		other: 'อื่น ๆ'
	} as Record<EvalType, string>,
	workTypes: {
		paper: 'รายงาน',
		policy_brief: 'ข้อเสนอเชิงนโยบาย (policy brief)',
		case_analysis: 'วิเคราะห์กรณีศึกษา',
		presentation: 'การนำเสนอ',
		project: 'โครงงาน',
		fieldwork_report: 'รายงานภาคสนาม',
		exercise: 'แบบฝึกหัด',
		reading_response: 'บันทึกการอ่าน',
		other: 'อื่น ๆ'
	} as Record<WorkType, string>,
	readingTypes: {
		book: 'หนังสือ',
		chapter: 'บทในหนังสือ',
		article: 'บทความ',
		report: 'รายงาน',
		law: 'กฎหมาย',
		web: 'เว็บไซต์',
		video: 'วิดีโอ',
		other: 'อื่น ๆ'
	} as Record<ReadingType, string>,

	weekdays: ['', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'],
	weekdaysShort: ['', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'],
	thaiMonthsShort: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],

	common: {
		save: 'บันทึก',
		cancel: 'ยกเลิก',
		close: 'ปิด',
		confirm: 'ยืนยัน',
		edit: 'แก้ไข',
		delete: 'ลบ',
		add: 'เพิ่ม',
		back: 'ย้อนกลับ',
		week: 'สัปดาห์',
		weekN: (n: number) => `สัปดาห์ที่ ${n}`,
		section: 'ตอนเรียน',
		sectionN: (n: number) => `ตอนเรียน ${n}`,
		hoursPerWeek: 'ชั่วโมง/สัปดาห์',
		none: '—',
		loading: 'กำลังโหลด…',
		deletedUser: 'ผู้ใช้ที่ลบบัญชีแล้ว',
		lastEdited: 'แก้ไขล่าสุด',
		notFound: 'ไม่พบหน้าที่ต้องการ',
		error: 'เกิดข้อผิดพลาด'
	}
};

export type Th = typeof t;

/** "อ.ดร.ณัฐธิดา แก้วมณี" */
export function personName(p: { title_th?: string | null; name_th?: string | null; titleTh?: string | null; nameTh?: string | null } | null | undefined): string {
	if (!p) return t.common.deletedUser;
	const title = p.title_th ?? p.titleTh ?? '';
	const name = p.name_th ?? p.nameTh ?? '';
	if (!name) return t.common.deletedUser;
	return title && title !== 'คุณ' ? `${title}${name}` : title === 'คุณ' ? `คุณ${name}` : name;
}

/** Thai date: "11 ม.ค. 2570". Date-only strings are calendar dates; timestamps show Bangkok time. */
const DATE_FMT = { day: 'numeric', month: 'short', year: 'numeric' } as const;
function toDate(d: Date | string): { date: Date; tz: string } {
	if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return { date: new Date(`${d}T00:00:00Z`), tz: 'UTC' };
	return { date: typeof d === 'string' ? new Date(d) : d, tz: 'Asia/Bangkok' };
}

export function thaiDate(d: Date | string | null | undefined): string {
	if (!d) return '';
	const { date, tz } = toDate(d);
	return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', { ...DATE_FMT, timeZone: tz }).format(date);
}

export function thaiDateTime(d: Date | string | null | undefined): string {
	if (!d) return '';
	const { date } = toDate(d);
	const time = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' }).format(date);
	return `${thaiDate(date)} ${time} น.`;
}

export function thaiTime(d: Date | string): string {
	return new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' }).format(
		typeof d === 'string' ? new Date(d) : d
	);
}
