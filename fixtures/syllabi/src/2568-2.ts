/**
 * 2/2568 (archived). FICTIONAL. Both published by @thanakrit (spec 08 "History"):
 * 2404324 without the behavioural-policy week and with the older weights, so the diff shows real changes;
 * 2404429 by its previous instructor, with weeks 2 and 11 like the 2/2569 upload.
 */
import example from '../../../data/examples/2404324-2569-2.json';
import type { SyllabusDoc } from '../../../src/lib/schema/syllabus';
import { MIDTERM, R, build } from './lib';

export const STATUS: Record<string, 'published'> = { '2404324': 'published', '2404429': 'published' };

function policy2568(): SyllabusDoc {
	const d = structuredClone(example) as SyllabusDoc;
	d.overview.focus =
		'ภาคการศึกษานี้เน้นการเชื่อมแนวคิดและตัวแบบของกระบวนการนโยบายสาธารณะเข้ากับบริบทการเมืองและการบริหารของไทย โดยใช้กรณีศึกษานโยบายจริง เช่น หลักประกันสุขภาพถ้วนหน้าและการจัดการภัยพิบัติ นิสิตจะได้ฝึกเขียน policy brief และวิเคราะห์กรณีศึกษาเป็นกลุ่ม';
	d.overview.keywords = d.overview.keywords.filter((k) => k !== 'nudge');
	const w12 = d.weeklyPlan.find((w) => w.week === 12)!;
	Object.assign(w12, {
		topic: 'การวิเคราะห์ผู้มีส่วนได้ส่วนเสียในกระบวนการนโยบาย',
		details: 'การระบุผู้มีส่วนได้ส่วนเสีย อำนาจ และผลประโยชน์ในประเด็นนโยบาย',
		concepts: ['stakeholder analysis', 'policy coalitions'],
		readingIds: ['r-4'],
		activity: 'ส่ง policy brief'
	});
	d.resources.readings = d.resources.readings.filter((r) => r.id !== 'r-5');
	const weights: Record<string, number> = { participation: 10, midterm_exam: 30, policy_brief: 15, presentation: 10, final_exam: 35 };
	d.evaluation.items = d.evaluation.items.map((e) => ({ ...e, weightPercent: weights[e.type] ?? e.weightPercent }));
	d.evaluation.items.find((e) => e.type === 'presentation')!.title = 'วิเคราะห์กรณีศึกษากลุ่ม';
	return d;
}

export const syllabi: Record<string, SyllabusDoc> = {
	'2404324': policy2568(),

	'2404429': build({
		focus:
			'ภาคการศึกษานี้ฝึกเทคนิคการวิเคราะห์นโยบายสาธารณะอย่างเป็นขั้นตอน ตั้งแต่การนิยามปัญหาตามแนวทาง eightfold path การวิเคราะห์ทางเลือกและต้นทุน-ผลประโยชน์ ไปจนถึงการออกแบบการประเมินผลกระทบ โดยใช้กรณีนโยบายพลังงานและการศึกษาของไทย',
		keywords: ['policy analysis', 'eightfold path', 'cost-benefit analysis', 'stakeholder analysis', 'impact evaluation', 'policy brief'],
		prerequisiteNote: 'ควรผ่าน 2404324 นโยบายสาธารณะ มาก่อน',
		clos: [
			['ใช้เทคนิคการวิเคราะห์นโยบายอย่างเป็นขั้นตอนกับปัญหานโยบายจริงได้', ['PLO2D']],
			['เปรียบเทียบทางเลือกนโยบายด้วยเกณฑ์และหลักฐานที่เหมาะสมได้', ['PLO2D', 'PLO4D']],
			['เขียนและนำเสนอผลการวิเคราะห์นโยบายต่อผู้ตัดสินใจได้', ['PLO3D']]
		],
		methods: ['lecture', 'case_study', 'workshop_seminar', 'group_project'],
		approach: 'บรรยายเทคนิคแล้วฝึกใช้ในเวิร์กช็อปทุกสัปดาห์ นิสิตเขียน policy brief รายบุคคล และทำโครงงานวิเคราะห์ทางเลือกนโยบายเป็นกลุ่ม',
		ai: 'allowed_with_disclosure',
		lead: ['@thanakrit'],
		weeks: [
			['แนะนำรายวิชาและบทบาทของนักวิเคราะห์นโยบาย', 'นักวิเคราะห์นโยบายในหน่วยงานภาครัฐและหน่วยงานคลังสมอง', ['policy analysis', 'policy analyst'], [2]],
			['ทบทวนตัวแบบกระบวนการนโยบาย (Stages model) และกระแสหลายสาย (Multiple Streams)', 'ทบทวนพื้นฐานจากวิชานโยบายสาธารณะ', ['policy cycle', 'stages model', 'multiple streams'], [1]],
			["การนิยามปัญหานโยบาย (Bardach's eightfold path)", 'การนิยามปัญหาและการรวบรวมหลักฐาน', ['problem definition', 'eightfold path'], [2]],
			['เกณฑ์การตัดสินใจและการวิเคราะห์ทางเลือก', 'ประสิทธิภาพ ความเป็นธรรม และความเป็นไปได้ทางการเมือง', ['evaluative criteria', 'policy alternatives'], [2, 3]],
			['การวิเคราะห์ต้นทุน-ผลประโยชน์', 'มูลค่าปัจจุบันสุทธิและการวิเคราะห์ความอ่อนไหว', ['cost-benefit analysis', 'net present value'], [3]],
			['การวิเคราะห์ความเสี่ยงและความไม่แน่นอน', 'การวิเคราะห์ฉากทัศน์', ['risk analysis', 'scenario analysis'], [3]],
			['การวิเคราะห์ผู้มีส่วนได้ส่วนเสีย', 'แผนภาพอำนาจและผลประโยชน์', ['stakeholder analysis'], [2]],
			MIDTERM,
			['การวิเคราะห์การนำนโยบายไปปฏิบัติ', 'การคาดการณ์อุปสรรคในการนำไปปฏิบัติ', ['implementation analysis'], [1]],
			['การพยากรณ์ผลลัพธ์ของนโยบาย', 'เทคนิคการพยากรณ์อย่างง่าย', ['forecasting', 'policy outcomes'], [3]],
			['การออกแบบการประเมินผลกระทบ', 'กลุ่มเปรียบเทียบและแบบการประเมิน', ['impact evaluation', 'evaluation design'], [3]],
			['กรณีศึกษา: นโยบายพลังงานทดแทนของไทย', 'วิเคราะห์ทางเลือกด้วยเครื่องมือที่เรียน', ['energy policy', 'case study'], [], { activity: 'ส่ง policy brief' }],
			['กรณีศึกษา: นโยบายการศึกษา', 'วิเคราะห์ผู้มีส่วนได้ส่วนเสียและความเป็นไปได้', ['education policy', 'case study'], []],
			['การเขียน policy brief และ options memo', 'โครงสร้างและภาษาสำหรับผู้ตัดสินใจ', ['policy brief', 'options memo'], [2]],
			['นำเสนอโครงงาน', 'กลุ่มละ 15 นาที', [], [], { activity: 'นำเสนอและส่งรายงานโครงงาน' }],
			['สรุปรายวิชาและทบทวนก่อนสอบปลายภาค', '', [], []]
		],
		evals: [
			['การมีส่วนร่วมในชั้นเรียน', 'participation', 10, true, null],
			['สอบกลางภาค', 'midterm_exam', 20, true, 8, ''],
			['Policy brief', 'policy_brief', 20, true, 12, ''],
			['โครงงานวิเคราะห์ทางเลือกนโยบาย', 'project', 25, false, 15, ''],
			['สอบปลายภาค', 'final_exam', 25, true, null, '']
		],
		readings: [
			R.dye,
			{ cite: 'Bardach, E., & Patashnik, E. M. (2020). A practical guide for policy analysis: The eightfold path to more effective problem solving (6th ed.). CQ Press.', title: 'A Practical Guide for Policy Analysis: The Eightfold Path to More Effective Problem Solving', authors: 'Eugene Bardach, Eric M. Patashnik', year: 2020, type: 'book', required: true },
			{ cite: 'Weimer, D. L., & Vining, A. R. (2017). Policy analysis: Concepts and practice (6th ed.). Routledge.', title: 'Policy Analysis: Concepts and Practice', authors: 'David L. Weimer, Aidan R. Vining', year: 2017, type: 'book', required: false }
		],
		work: [
			{ title: 'Policy brief วิเคราะห์นโยบายสาธารณะไทย 1 ประเด็น', type: 'policy_brief', description: 'วิเคราะห์ปัญหานโยบาย 1 ประเด็นและเสนอทางเลือก', deliverable: 'เอกสาร 2 หน้า A4', due: 12, evalNo: 3, hours: 12 },
			{ title: 'โครงงานวิเคราะห์ทางเลือกนโยบาย', type: 'project', description: 'วิเคราะห์ทางเลือกนโยบายอย่างน้อย 3 ทางด้วยเกณฑ์ที่กำหนด', deliverable: 'รายงานประมาณ 15 หน้า และนำเสนอ 15 นาที', groupSize: '4–5', due: 15, evalNo: 4, hours: 20 }
		]
	})
};
