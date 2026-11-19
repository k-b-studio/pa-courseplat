/**
 * The FICTIONAL document @natthida uploads in act 3 (spec 08 "Sample upload for 2404429").
 * Written like a typical Thai เค้าโครงรายวิชา. Its CLOs carry no PLO codes, so the review screen
 * shows AI PLO suggestions. `npm run make:samples` renders it to .docx, a scanned PDF and .txt.
 */
import { MIDTERM, R, build } from '../syllabi/src/lib';

export const SAMPLE_COURSE = { code: '2404429', nameTh: 'การวิเคราะห์นโยบายสาธารณะชั้นสูง', nameEn: 'Advanced Public Policy Analysis', credits: '3 (3-0-6)', semester: '2/2569' };
export const SAMPLE_SECTION = { sectionNo: 1, instructor: 'อ.ดร.ณัฐธิดา แก้วมณี', weekday: 5, day: 'วันศุกร์', startsAt: '13:00', endsAt: '16:00', room: 'ห้อง 405 (ตัวอย่าง)' };

export const sampleDoc = build({
	focus:
		'ภาคการศึกษานี้เน้นการฝึกวิเคราะห์นโยบายอย่างเป็นขั้นตอนตั้งแต่การนิยามปัญหา การวิเคราะห์ทางเลือก ไปจนถึงการติดตามและประเมินผลนโยบาย และเพิ่มหัวข้อนโยบายเชิงพฤติกรรมกับการทดลองเชิงนโยบาย โดยใช้กรณีศึกษานโยบายจัดการฝุ่น PM2.5 ของไทย',
	keywords: ['policy analysis', 'eightfold path', 'cost-benefit analysis', 'stakeholder analysis', 'policy evaluation', 'behavioural public policy'],
	prerequisiteNote: 'ควรผ่าน 2404324 นโยบายสาธารณะ มาก่อน',
	clos: [
		['ใช้เทคนิคการวิเคราะห์นโยบายอย่างเป็นขั้นตอนกับปัญหานโยบายสาธารณะของไทยได้', []],
		['เปรียบเทียบทางเลือกนโยบายด้วยเกณฑ์และหลักฐานเชิงประจักษ์ได้', []],
		['ออกแบบการติดตามและประเมินผลนโยบายเบื้องต้นได้', []],
		['สื่อสารผลการวิเคราะห์นโยบายต่อผู้ตัดสินใจได้อย่างกระชับและมีหลักฐาน', []]
	],
	methods: ['lecture', 'case_study', 'workshop_seminar', 'group_project'],
	approach: 'บรรยายเทคนิคการวิเคราะห์ สลับกับกรณีศึกษาและการฝึกปฏิบัติแบบเวิร์กช็อป นิสิตทำ policy brief รายบุคคลและโครงงานวิเคราะห์ทางเลือกนโยบายเป็นกลุ่ม',
	ai: 'allowed_with_disclosure',
	aiNote: 'ใช้ AI ได้โดยต้องระบุเครื่องมือและขอบเขตการใช้ในงานทุกชิ้น',
	lead: ['@natthida'],
	weeks: [
		['แนะนำรายวิชาและบทบาทของนักวิเคราะห์นโยบาย', '', ['policy analysis', 'policy analyst'], [2]],
		['ทบทวนตัวแบบกระบวนการนโยบาย (Stages model) และกระแสหลายสาย (Multiple Streams)', '', ['policy cycle', 'stages model', 'multiple streams'], [1]],
		["การนิยามปัญหานโยบาย (Bardach's eightfold path)", '', ['problem definition', 'eightfold path'], [2]],
		['เกณฑ์การตัดสินใจและการวิเคราะห์ทางเลือก', '', ['evaluative criteria', 'policy alternatives'], [2, 3]],
		['การวิเคราะห์ต้นทุน-ผลประโยชน์', '', ['cost-benefit analysis'], [3]],
		['การวิเคราะห์ผู้มีส่วนได้ส่วนเสีย', '', ['stakeholder analysis'], [2]],
		['เทคนิคเชิงคุณภาพ: สัมภาษณ์เชิงลึกและสนทนากลุ่ม', '', ['in-depth interview', 'focus group'], []],
		MIDTERM,
		['การวิเคราะห์การนำนโยบายไปปฏิบัติ', '', ['implementation analysis'], [1]],
		['การติดตามและประเมินผลนโยบาย: ตัวแบบเชิงตรรกะและตัวชี้วัด', '', ['policy evaluation', 'logic model', 'indicators'], [3]],
		['การออกแบบการประเมินผลกระทบ', '', ['impact evaluation', 'evaluation design'], [3], { activity: 'ส่ง policy brief' }],
		['นโยบายเชิงพฤติกรรมและการทดลองเชิงนโยบาย', '', ['behavioural public policy', 'nudge', 'policy experiment'], []],
		['กรณีศึกษา: นโยบายจัดการฝุ่น PM2.5', '', ['air pollution policy', 'case study'], []],
		['การสื่อสารผลการวิเคราะห์นโยบาย', '', ['policy communication'], [2]],
		['นำเสนอโครงงาน', '', [], [], { activity: 'นำเสนอโครงงานกลุ่ม' }],
		['สรุปรายวิชา', '', [], []]
	],
	evals: [
		['การมีส่วนร่วมในชั้นเรียน', 'participation', 10, true, null],
		['สอบกลางภาค', 'midterm_exam', 20, true, 8, ''],
		['Policy brief', 'policy_brief', 20, true, 11, ''],
		['โครงงานวิเคราะห์ทางเลือกนโยบาย (กลุ่ม)', 'project', 25, false, 15, ''],
		['สอบปลายภาค', 'final_exam', 25, true, null, '']
	],
	readings: [
		R.dye,
		{ cite: 'Bardach, E., & Patashnik, E. M. (2020). A practical guide for policy analysis: The eightfold path to more effective problem solving (6th ed.). CQ Press.', title: 'A Practical Guide for Policy Analysis: The Eightfold Path to More Effective Problem Solving', authors: 'Eugene Bardach, Eric M. Patashnik', year: 2020, type: 'book', required: true },
		{ cite: 'Weimer, D. L., & Vining, A. R. (2017). Policy analysis: Concepts and practice (6th ed.). Routledge.', title: 'Policy Analysis: Concepts and Practice', authors: 'David L. Weimer, Aidan R. Vining', year: 2017, type: 'book', required: false }
	],
	work: [
		{ title: 'Policy brief วิเคราะห์นโยบายสาธารณะไทย 1 ประเด็น ความยาว 2 หน้า A4', type: 'policy_brief', description: 'เลือกปัญหานโยบายสาธารณะของไทย 1 ประเด็น วิเคราะห์และเสนอทางเลือกพร้อมหลักฐาน', deliverable: 'เอกสาร 2 หน้า A4', due: 11, evalNo: 3, hours: 12 },
		{ title: 'วิเคราะห์ทางเลือกนโยบาย (options analysis)', type: 'project', description: 'วิเคราะห์ทางเลือกนโยบายอย่างน้อย 3 ทางด้วยเกณฑ์ที่กำหนด', deliverable: 'รายงานประมาณ 15 หน้า และนำเสนอ 15 นาที', groupSize: '4–5', due: 15, evalNo: 4, hours: 20 }
	]
});
