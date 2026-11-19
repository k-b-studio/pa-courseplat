/**
 * 1/2569 (active). FICTIONAL, deliberately lighter (spec 08 "History and the active semester"):
 * overview, three objectives, 15 short weekly topics plus the midterm week, evaluation, two or three readings.
 * They give Content Caution catalog-wide comparison targets.
 */
import type { SyllabusDoc } from '../../../src/lib/schema/syllabus';
import { MIDTERM, build, type Spec } from './lib';

export const STATUS: Record<string, 'published'> = { '2404310': 'published', '2404364': 'published', '2404414': 'published', '2404419': 'published', '2404431': 'published' };

const short = (topics: (string | [string, string[]])[]): Spec['weeks'] => {
	const rows: Spec['weeks'] = topics.map((t) => (typeof t === 'string' ? [t, '', [], []] : [t[0], '', t[1], []]));
	rows.splice(7, 0, MIDTERM);
	return rows;
};
const standardEvals = (paper: string, due: number): Spec['evals'] => [
	['การมีส่วนร่วมในชั้นเรียน', 'participation', 10, true, null],
	['สอบกลางภาค', 'midterm_exam', 30, true, 8, ''],
	[paper, 'paper', 25, true, due, ''],
	['สอบปลายภาค', 'final_exam', 35, true, null, '']
];

export const syllabi: Record<string, SyllabusDoc> = {
	'2404310': build({
		focus: 'ภาคการศึกษานี้ศึกษาความสัมพันธ์ระหว่างการบริหารภาครัฐกับสังคม ทุนทางสังคม ความเหลื่อมล้ำ และการมีส่วนร่วมของพลเมือง โดยใช้ประเด็นสาธารณะร่วมสมัยของไทยเป็นกรณีศึกษา',
		keywords: ['administration and society', 'social capital', 'citizen participation', 'inequality'],
		clos: [
			['อธิบายความสัมพันธ์ระหว่างการบริหารภาครัฐ สังคม และนโยบายสาธารณะได้', ['PLO1D']],
			['วิเคราะห์ผลของบริบททางสังคมต่อการบริหารจัดการภาครัฐได้', ['PLO2D']],
			['อภิปรายบทบาทของพลเมืองในการบริหารภาครัฐอย่างเคารพความหลากหลาย', ['PLO5D']]
		],
		methods: ['lecture', 'discussion', 'case_study'],
		approach: 'บรรยายและอภิปรายกรณีศึกษาประเด็นสาธารณะของไทย',
		ai: 'allowed_with_disclosure',
		lead: ['@apichart'],
		weeks: short([
			'แนะนำรายวิชา',
			['รัฐ ตลาด และสังคม', ['state', 'market', 'civil society']],
			['ทุนทางสังคมกับการบริหารภาครัฐ', ['social capital']],
			['ความเหลื่อมล้ำและบริการสาธารณะ', ['inequality', 'public services']],
			['การมีส่วนร่วมของพลเมือง', ['citizen participation']],
			['ภาคประชาสังคมและองค์กรไม่แสวงหากำไร', ['civil society organizations']],
			['สื่อ ความเห็นสาธารณะ และการบริหารภาครัฐ', ['public opinion']],
			['ความไว้วางใจต่อภาครัฐ', ['trust in government']],
			['การบริหารภาครัฐในสังคมพหุวัฒนธรรม', ['diversity']],
			['สังคมสูงวัยกับการบริหารภาครัฐ', ['ageing society']],
			['ความยั่งยืนและการพัฒนา', ['sustainable development']],
			'กรณีศึกษาประเด็นสาธารณะของไทย (1)',
			'กรณีศึกษาประเด็นสาธารณะของไทย (2)',
			'นำเสนอบทความ',
			'สรุปรายวิชา'
		]),
		evals: standardEvals('บทความวิเคราะห์ประเด็นสาธารณะ', 13),
		readings: [
			{ cite: 'Putnam, R. D. (2000). Bowling alone: The collapse and revival of American community. Simon & Schuster.', title: 'Bowling Alone', authors: 'Robert D. Putnam', year: 2000, type: 'book', required: true },
			{ cite: 'Frederickson, H. G., Smith, K. B., Larimer, C. W., & Licari, M. J. The public administration theory primer. Routledge.', title: 'The Public Administration Theory Primer', authors: 'H. George Frederickson, Kevin B. Smith, Christopher W. Larimer, Michael J. Licari', year: null, type: 'book', required: false }
		]
	}),

	'2404364': build({
		focus: 'ภาคการศึกษานี้ฝึกใช้ระเบียบวิธีเชิงปริมาณเพื่อการตัดสินใจทางการบริหาร ได้แก่ การโปรแกรมเชิงเส้น ทฤษฎีการตัดสินใจ แถวคอย และการจำลองสถานการณ์ ด้วยโจทย์จากการให้บริการภาครัฐ',
		keywords: ['quantitative analysis', 'linear programming', 'decision theory', 'queuing', 'simulation'],
		clos: [
			['เลือกเทคนิคเชิงปริมาณให้เหมาะกับปัญหาการตัดสินใจทางการบริหารได้', ['PLO2D']],
			['คำนวณและแปลผลแบบจำลองเชิงปริมาณพื้นฐานได้', ['PLO4D']],
			['นำเสนอข้อเสนอจากผลการวิเคราะห์เชิงปริมาณได้', ['PLO3D']]
		],
		methods: ['lecture', 'problem_based', 'workshop_seminar'],
		approach: 'บรรยายและฝึกแก้โจทย์ด้วยโปรแกรมตารางคำนวณทุกสัปดาห์',
		ai: 'allowed_with_disclosure',
		lead: ['@chonthicha'],
		weeks: short([
			'แนะนำรายวิชา: การตัดสินใจเชิงปริมาณ',
			['ทฤษฎีการตัดสินใจภายใต้ความไม่แน่นอน', ['decision theory']],
			['ต้นไม้การตัดสินใจ', ['decision tree']],
			['การโปรแกรมเชิงเส้น (1)', ['linear programming']],
			['การโปรแกรมเชิงเส้น (2)', ['linear programming', 'sensitivity analysis']],
			['ปัญหาการขนส่งและการมอบหมายงาน', ['transportation problem']],
			['การพยากรณ์อนุกรมเวลา', ['time series forecasting']],
			['ทฤษฎีแถวคอยกับการให้บริการภาครัฐ', ['queuing theory']],
			['การจำลองสถานการณ์', ['simulation']],
			['การบริหารโครงการด้วย PERT/CPM', ['PERT', 'critical path method']],
			['การบริหารสินค้าคงคลัง', ['inventory management']],
			'กรณีศึกษา: การจัดสรรทรัพยากรในโรงพยาบาลรัฐ',
			'กรณีศึกษา: การลดเวลารอคอยในศูนย์บริการภาครัฐ',
			'นำเสนอรายงาน',
			'สรุปรายวิชา'
		]),
		evals: standardEvals('รายงานวิเคราะห์เชิงปริมาณ', 14),
		readings: [
			{ cite: 'Hillier, F. S., & Lieberman, G. J. Introduction to operations research. McGraw-Hill.', title: 'Introduction to Operations Research', authors: 'Frederick S. Hillier, Gerald J. Lieberman', year: null, type: 'book', required: true },
			{ cite: 'Anderson, D. R., Sweeney, D. J., Williams, T. A., Camm, J. D., & Cochran, J. J. An introduction to management science: Quantitative approaches to decision making. Cengage Learning.', title: 'An Introduction to Management Science', authors: 'David R. Anderson, Dennis J. Sweeney, Thomas A. Williams, Jeffrey D. Camm, James J. Cochran', year: null, type: 'book', required: false }
		]
	}),

	'2404414': build({
		focus: 'ภาคการศึกษานี้อ่านวรรณกรรมสำคัญทางรัฐประศาสนศาสตร์ร่วมสมัยด้วยกระบวนการวิจัยเอกสาร ทั้งการปฏิรูปภาครัฐ การบริหารปกครอง และการออกแบบสถาบัน นิสิตเขียนบททบทวนวรรณกรรมรายบุคคล',
		keywords: ['literature review', 'governance', 'public sector reform', 'documentary research'],
		clos: [
			['สรุปและวิพากษ์วรรณกรรมทางรัฐประศาสนศาสตร์ร่วมสมัยได้', ['PLO1D', 'PLO3D']],
			['ใช้กระบวนการวิจัยเอกสารค้นคว้าวรรณกรรมได้อย่างเป็นระบบ', ['PLO4D']],
			['เขียนบททบทวนวรรณกรรมที่อ้างอิงถูกต้องตามหลักจริยธรรมทางวิชาการ', ['PLO3D', 'PLO4']]
		],
		methods: ['discussion', 'workshop_seminar', 'independent_study'],
		approach: 'สัมมนาจากการอ่านทุกสัปดาห์ และฝึกค้นคว้าจากฐานข้อมูลวิชาการ',
		ai: 'allowed_with_disclosure',
		aiNote: 'ห้ามใช้ AI สร้างรายการอ้างอิง ทุกรายการต้องตรวจสอบจากต้นฉบับ',
		lead: ['@wipawadee'],
		weeks: short([
			'แนะนำรายวิชาและการวิจัยเอกสาร',
			['การค้นฐานข้อมูลวิชาการ', ['academic databases']],
			['การอ่านเชิงวิพากษ์', ['critical reading']],
			['รัฐประศาสนศาสตร์ในฐานะสหวิทยาการ', ['interdisciplinary study of government']],
			['การปฏิรูปภาครัฐ', ['public sector reform']],
			['การบริหารปกครองแบบใหม่', ['governance']],
			['การออกแบบสถาบัน', ['institutional design']],
			['ความรับผิดชอบทางการบริหาร', ['accountability']],
			['ภาวะผู้นำภาครัฐ', ['public leadership']],
			['ภาครัฐกับนวัตกรรม', ['public sector innovation']],
			['การเขียนบททบทวนวรรณกรรม', ['literature review']],
			'การอ้างอิงและจริยธรรมทางวิชาการ',
			'ปรึกษางานรายบุคคล',
			'นำเสนอบททบทวนวรรณกรรม',
			'สรุปรายวิชา'
		]),
		evals: standardEvals('บททบทวนวรรณกรรม', 14),
		readings: [
			{ cite: 'Raadschelders, J. C. N. (2011). Public administration: The interdisciplinary study of government. Oxford University Press.', title: 'Public Administration: The Interdisciplinary Study of Government', authors: 'Jos C. N. Raadschelders', year: 2011, type: 'book', required: true },
			{ cite: 'Rhodes, R. A. W. (1996). The new governance: Governing without government. Political Studies, 44(4), 652–667.', title: 'The New Governance: Governing without Government', authors: 'R. A. W. Rhodes', year: 1996, type: 'article', required: true }
		]
	}),

	'2404419': build({
		focus: 'ภาคการศึกษานี้ฝึกกระบวนการวิจัยทางรัฐประศาสนศาสตร์ตั้งแต่การกำหนดปัญหา การทบทวนแนวคิด การตั้งสมมติฐาน การออกแบบการวิจัยเชิงปริมาณ เชิงคุณภาพ และแบบผสานวิธี จนถึงการเขียนโครงร่างการวิจัย',
		keywords: ['research design', 'research question', 'qualitative research', 'quantitative research', 'mixed methods', 'case study'],
		clos: [
			['กำหนดปัญหาและคำถามการวิจัยทางรัฐประศาสนศาสตร์ได้', ['PLO4D']],
			['ออกแบบการวิจัยที่เหมาะกับคำถามการวิจัยได้', ['PLO4D', 'PLO2D']],
			['เขียนโครงร่างการวิจัยที่ถูกต้องตามหลักจริยธรรมการวิจัย', ['PLO3D', 'PLO4']]
		],
		methods: ['lecture', 'workshop_seminar', 'independent_study'],
		approach: 'บรรยายและเวิร์กช็อปเขียนโครงร่างการวิจัยทีละส่วน',
		ai: 'allowed_with_disclosure',
		lead: ['@kittipong'],
		weeks: short([
			'แนะนำรายวิชา: การวิจัยทางรัฐประศาสนศาสตร์',
			['ปัญหาและคำถามการวิจัย', ['research question']],
			['การทบทวนวรรณกรรมและกรอบแนวคิด', ['conceptual framework']],
			['สมมติฐานและตัวแปร', ['hypothesis', 'variables']],
			['การออกแบบการวิจัยเชิงปริมาณ', ['quantitative research design']],
			['การสร้างเครื่องมือวิจัยและแบบสอบถาม', ['questionnaire design']],
			['การออกแบบการวิจัยเชิงคุณภาพ', ['qualitative research design']],
			['การสัมภาษณ์เชิงลึกและการสนทนากลุ่ม', ['in-depth interview', 'focus group']],
			['การวิจัยกรณีศึกษา', ['case study research']],
			['การวิจัยแบบผสานวิธี', ['mixed methods']],
			['จริยธรรมการวิจัย', ['research ethics']],
			'การเขียนโครงร่างการวิจัย',
			'ปรึกษาโครงร่างการวิจัย',
			'นำเสนอโครงร่างการวิจัย',
			'สรุปรายวิชา'
		]),
		evals: standardEvals('โครงร่างการวิจัย', 15),
		readings: [
			{ cite: 'Creswell, J. W., & Creswell, J. D. (2018). Research design: Qualitative, quantitative, and mixed methods approaches (5th ed.). SAGE.', title: 'Research Design: Qualitative, Quantitative, and Mixed Methods Approaches', authors: 'John W. Creswell, J. David Creswell', year: 2018, type: 'book', required: true },
			{ cite: 'Yin, R. K. (2018). Case study research and applications: Design and methods (6th ed.). SAGE.', title: 'Case Study Research and Applications', authors: 'Robert K. Yin', year: 2018, type: 'book', required: false }
		]
	}),

	'2404431': build({
		focus: 'ภาคการศึกษานี้ศึกษากระบวนการวางแผนนโยบายระดับชาติของไทย ตั้งแต่ยุทธศาสตร์ชาติและแผนพัฒนาเศรษฐกิจและสังคมแห่งชาติ จนถึงการแปลงแผนสู่การปฏิบัติและการติดตามผล เป็นวิชาเลือกของสายนโยบายและการวางแผน',
		keywords: ['national planning', 'national strategy', 'development plan', 'planning process', 'plan implementation'],
		clos: [
			['อธิบายแนวคิด หลักการ และขั้นตอนการวางแผนนโยบายระดับชาติได้', ['PLO1D']],
			['วิเคราะห์ความเชื่อมโยงของแผนระดับต่าง ๆ ของไทยได้', ['PLO2D']],
			['ประเมินการแปลงแผนสู่การปฏิบัติและเสนอแนวทางปรับปรุงได้', ['PLO2D', 'PLO3D']]
		],
		methods: ['lecture', 'discussion', 'case_study'],
		approach: 'บรรยายและวิเคราะห์เอกสารแผนระดับชาติฉบับจริง',
		ai: 'allowed_with_disclosure',
		lead: ['@suppawit'],
		weeks: short([
			'แนะนำรายวิชา: การวางแผนกับนโยบาย',
			['แนวคิดและทฤษฎีการวางแผน', ['planning theory']],
			['สภาพแวดล้อมภายนอกและภายในของการวางแผน', ['environmental scanning']],
			['ระบบเศรษฐกิจกับการวางแผน', ['economic planning']],
			['ยุทธศาสตร์ชาติ', ['national strategy']],
			['แผนพัฒนาเศรษฐกิจและสังคมแห่งชาติ', ['national development plan']],
			['ระบบแผนสามระดับของไทย', ['plan hierarchy']],
			['การแปลงแผนสู่การปฏิบัติ', ['plan implementation']],
			['การเชื่อมแผนกับงบประมาณ', ['planning and budgeting']],
			['การวางแผนเชิงพื้นที่', ['spatial planning']],
			['การติดตามและประเมินผลแผน', ['plan monitoring']],
			'กรณีศึกษา: แผนแม่บทภายใต้ยุทธศาสตร์ชาติ',
			'กรณีศึกษา: แผนพัฒนาจังหวัด',
			'นำเสนอบทวิเคราะห์แผน',
			'สรุปรายวิชา'
		]),
		evals: standardEvals('บทวิเคราะห์แผนระดับชาติ', 14),
		readings: [
			{ cite: 'สำนักงานสภาพัฒนาการเศรษฐกิจและสังคมแห่งชาติ. แผนพัฒนาเศรษฐกิจและสังคมแห่งชาติ ฉบับที่ 13 (พ.ศ. 2566–2570).', title: 'แผนพัฒนาเศรษฐกิจและสังคมแห่งชาติ ฉบับที่ 13 (พ.ศ. 2566–2570)', authors: 'สำนักงานสภาพัฒนาการเศรษฐกิจและสังคมแห่งชาติ', year: null, type: 'report', required: true },
			{ cite: 'ยุทธศาสตร์ชาติ (พ.ศ. 2561–2580).', title: 'ยุทธศาสตร์ชาติ (พ.ศ. 2561–2580)', authors: 'ประเทศไทย', year: 2018, type: 'report', required: true }
		]
	})
};
