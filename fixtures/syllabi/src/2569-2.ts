/**
 * 2/2569 (the demo semester). FICTIONAL syllabi; planted overlaps follow spec 08's table.
 * 2404324 is data/examples/2404324-2569-2.json unchanged; 2404429, 2404480 and 2404220 are not started.
 */
import example from '../../../data/examples/2404324-2569-2.json';
import type { SyllabusDoc } from '../../../src/lib/schema/syllabus';
import { MIDTERM, R, build } from './lib';

export const STATUS: Record<string, 'published' | 'draft'> = {
	'2400114': 'published',
	'2404213': 'published',
	'2404312': 'published',
	'2404317': 'published',
	'2404416': 'published',
	'2404324': 'published',
	'2404368': 'published',
	'2404318': 'draft',
	'2404412': 'published',
	'2404422': 'published',
	'2404436': 'published'
};

export const syllabi: Record<string, SyllabusDoc> = {
	'2400114': build({
		focus:
			'ภาคการศึกษานี้ปูพื้นฐานรัฐประศาสนศาสตร์สำหรับนิสิตชั้นปีที่ 1 ตั้งแต่พัฒนาการของสาขาวิชา ทฤษฎีองค์การยุคคลาสสิก ไปจนถึงการจัดการภาครัฐแนวใหม่และธรรมาภิบาล โดยเชื่อมโยงกับโครงสร้างการบริหารราชการไทย ตอนเรียนที่ 2 เน้นกรณีศึกษาเปรียบเทียบต่างประเทศ',
		keywords: ['public administration', 'organization theory', 'bureaucracy', 'policy process', 'new public management', 'good governance'],
		clos: [
			['อธิบายความหมาย ขอบเขต และพัฒนาการของรัฐประศาสนศาสตร์ได้', ['PLO1', 'PLO1D']],
			['เปรียบเทียบแนวคิดและทฤษฎีสำคัญทางรัฐประศาสนศาสตร์ตั้งแต่ยุคคลาสสิกถึงปัจจุบันได้', ['PLO1D', 'PLO2']],
			['วิเคราะห์โครงสร้างและการทำงานของระบบบริหารราชการไทยเบื้องต้นได้', ['PLO2D']],
			['ทำงานเป็นทีมและนำเสนอผลการศึกษาหน่วยงานภาครัฐได้อย่างเป็นระบบ', ['PLO3', 'PLO5']]
		],
		methods: ['lecture', 'discussion', 'case_study', 'group_project'],
		approach:
			'บรรยายพร้อมยกตัวอย่างจากหน่วยงานภาครัฐไทย สลับกับการอภิปรายกลุ่มย่อยจากเอกสารที่มอบหมาย ทดสอบความเข้าใจจากการอ่านเป็นระยะ และทำรายงานกรณีศึกษาหน่วยงานภาครัฐเป็นกลุ่ม',
		ai: 'allowed_with_disclosure',
		aiNote: 'ใช้ AI ช่วยสรุปเอกสารหรือตรวจภาษาได้ โดยระบุเครื่องมือที่ใช้ท้ายรายงาน ห้ามใช้ทำแบบทดสอบในชั้นเรียน',
		lead: ['@apichart', '@wipawadee'],
		weeks: [
			['แนะนำรายวิชา: รัฐประศาสนศาสตร์คืออะไร', 'ความหมาย ขอบเขต และความสำคัญของการบริหารภาครัฐต่อชีวิตประจำวัน', ['public administration', 'scope of public administration'], [1]],
			['พัฒนาการของรัฐประศาสนศาสตร์: จาก Wilson ถึงปัจจุบัน', 'การแยกการเมืองออกจากการบริหาร และกระบวนทัศน์ของรัฐประศาสนศาสตร์', ['politics-administration dichotomy', 'paradigms of public administration'], [1, 3]],
			['ทฤษฎีองค์การยุคคลาสสิก: Taylor, Weber, Fayol', 'การจัดการเชิงวิทยาศาสตร์ ระบบราชการแบบอุดมคติ และหลักการบริหารของ Fayol', ['classical organization theory', 'scientific management', 'bureaucracy', 'principles of administration'], [1, 2]],
			['แนวคิดมนุษยสัมพันธ์และพฤติกรรมศาสตร์', 'การศึกษาที่ฮอว์ธอร์น และแนวคิดเรื่องการตัดสินใจของ Herbert Simon', ['human relations', 'Hawthorne studies', 'bounded rationality'], [1]],
			['โครงสร้างการบริหารราชการแผ่นดินของไทย', 'ราชการส่วนกลาง ส่วนภูมิภาค และส่วนท้องถิ่น', ['Thai public administration', 'central administration', 'regional administration'], [4]],
			['การบริหารงานบุคคลภาครัฐเบื้องต้น', 'ระบบคุณธรรม ระบบอุปถัมภ์ และบทบาทของหน่วยงานกลางด้านบุคคล', ['merit system', 'spoils system', 'public personnel administration'], [1]],
			['การคลังและงบประมาณภาครัฐเบื้องต้น', 'ที่มาของรายได้รัฐ และบทบาทของงบประมาณในการบริหารภาครัฐ', ['public finance', 'public budgeting'], [1]],
			MIDTERM,
			['กระบวนการนโยบายสาธารณะเบื้องต้น', 'การก่อตัว การกำหนด การนำไปปฏิบัติ และการประเมินผลนโยบาย', ['public policy', 'policy process', 'policy cycle'], [1]],
			['การนำนโยบายไปปฏิบัติและข้าราชการระดับปฏิบัติ', 'ช่องว่างระหว่างนโยบายกับการปฏิบัติ และดุลพินิจของเจ้าหน้าที่ผู้ให้บริการ', ['implementation', 'street-level bureaucracy'], [1]],
			['การจัดการภาครัฐแนวใหม่ (New Public Management)', 'แนวคิดการบริหารแบบธุรกิจในภาครัฐ และข้อวิจารณ์', ['new public management', 'reinventing government', 'managerialism'], [5, 6]],
			['การบริการสาธารณะแนวใหม่และธรรมาภิบาล', 'พลเมืองในฐานะเจ้าของประเทศ ความรับผิดชอบ และความโปร่งใส', ['new public service', 'good governance', 'accountability'], [7]],
			['การปกครองท้องถิ่นและการกระจายอำนาจ', 'องค์กรปกครองส่วนท้องถิ่นของไทย และความสัมพันธ์กับราชการส่วนกลาง', ['decentralization', 'local government'], [4]],
			['จริยธรรมของผู้บริหารภาครัฐ', 'ผลประโยชน์ทับซ้อน การต่อต้านการทุจริต และความรับผิดชอบต่อสาธารณะ', ['administrative ethics', 'conflict of interest'], [], { activity: 'ส่งรายงานกรณีศึกษากลุ่ม' }],
			['รัฐบาลดิจิทัลและนวัตกรรมภาครัฐ', 'การให้บริการดิจิทัลและการใช้ข้อมูลในการบริหารภาครัฐ', ['digital government', 'public sector innovation'], []],
			['สรุปรายวิชาและทบทวนก่อนสอบปลายภาค', '', [], []]
		],
		evals: [
			['การมีส่วนร่วมในชั้นเรียน', 'participation', 10, true, null, 'การอภิปรายกลุ่มย่อยและการเตรียมอ่านเอกสาร'],
			['แบบทดสอบย่อยจากการอ่าน', 'quiz', 10, true, null, 'ทดสอบสั้น 4 ครั้งตลอดภาคการศึกษา'],
			['สอบกลางภาค', 'midterm_exam', 30, true, 8, 'ปรนัยและอัตนัย'],
			['รายงานกรณีศึกษาหน่วยงานภาครัฐ', 'case_analysis', 20, false, 14, 'ดูรายละเอียดในงานที่มอบหมาย'],
			['สอบปลายภาค', 'final_exam', 30, true, null, 'อัตนัย ครอบคลุมทั้งภาคการศึกษา']
		],
		readings: [
			{ cite: 'Shafritz, J. M., Russell, E. W., & Borick, C. P. Introducing public administration. Routledge.', title: 'Introducing Public Administration', authors: 'Jay M. Shafritz, E. W. Russell, Christopher P. Borick', year: null, type: 'book', required: true },
			R.shafritzHyde,
			{ cite: 'Wilson, W. (1887). The study of administration. Political Science Quarterly, 2(2), 197–222.', title: 'The Study of Administration', authors: 'Woodrow Wilson', year: 1887, type: 'article', required: false },
			{ cite: 'พระราชบัญญัติระเบียบบริหารราชการแผ่นดิน พ.ศ. 2534 และที่แก้ไขเพิ่มเติม.', title: 'พระราชบัญญัติระเบียบบริหารราชการแผ่นดิน พ.ศ. 2534', authors: 'ประเทศไทย', year: 1991, type: 'law', required: true },
			{ cite: 'Hood, C. (1991). A public management for all seasons? Public Administration, 69(1), 3–19.', title: 'A Public Management for All Seasons?', authors: 'Christopher Hood', year: 1991, type: 'article', required: false },
			{ cite: 'Osborne, D., & Gaebler, T. (1992). Reinventing government: How the entrepreneurial spirit is transforming the public sector. Addison-Wesley.', title: 'Reinventing Government', authors: 'David Osborne, Ted Gaebler', year: 1992, type: 'book', required: false },
			{ cite: 'Denhardt, R. B., & Denhardt, J. V. (2000). The new public service: Serving rather than steering. Public Administration Review, 60(6), 549–559.', title: 'The New Public Service: Serving Rather than Steering', authors: 'Robert B. Denhardt, Janet V. Denhardt', year: 2000, type: 'article', required: false }
		],
		work: [
			{
				title: 'รายงานกรณีศึกษา: โครงสร้างและบทบาทของหน่วยงานภาครัฐไทย 1 หน่วยงาน',
				type: 'case_analysis',
				description: 'เลือกหน่วยงานภาครัฐ 1 แห่ง อธิบายโครงสร้าง ภารกิจ และความสัมพันธ์กับหน่วยงานอื่น แล้ววิเคราะห์ด้วยแนวคิดที่เรียน',
				deliverable: 'รายงานประมาณ 10 หน้า ส่งทาง MyCourseVille',
				groupSize: '4–5',
				due: 14,
				evalNo: 4,
				hours: 12
			}
		]
	}),

	'2404213': build({
		focus:
			'ภาคการศึกษานี้แนะนำบทบาททางเศรษฐกิจของรัฐ รายได้และรายจ่ายสาธารณะ หนี้สาธารณะ และกระบวนการงบประมาณของไทยเบื้องต้น โดยฝึกอ่านเอกสารงบประมาณจริงของหน่วยงานภาครัฐ และทำรายงานวิเคราะห์งบประมาณเป็นกลุ่มในช่วงท้ายภาค',
		keywords: ['public finance', 'taxation', 'public expenditure', 'public debt', 'budget process', 'fiscal decentralization'],
		clos: [
			['อธิบายบทบาททางเศรษฐกิจของรัฐและเหตุผลของการคลังสาธารณะได้', ['PLO1D']],
			['วิเคราะห์โครงสร้างรายได้ รายจ่าย และหนี้สาธารณะของไทยได้', ['PLO1D', 'PLO2D']],
			['อธิบายขั้นตอนของกระบวนการงบประมาณของไทยและอ่านเอกสารงบประมาณเบื้องต้นได้', ['PLO2D', 'PLO4']]
		],
		methods: ['lecture', 'discussion', 'case_study', 'group_project'],
		approach: 'บรรยายแนวคิดหลักแล้วฝึกวิเคราะห์ด้วยข้อมูลการคลังจริงของไทย มีแบบฝึกหัดคำนวณสั้นในชั้นเรียน และรายงานกลุ่มวิเคราะห์งบประมาณของหน่วยงานภาครัฐ 1 แห่ง',
		ai: 'allowed_with_disclosure',
		aiNote: 'ใช้ AI ช่วยค้นข้อมูลได้ แต่ตัวเลขทุกตัวในรายงานต้องอ้างอิงเอกสารทางการ',
		lead: ['@suppawit'],
		weeks: [
			['แนะนำรายวิชา: บทบาททางเศรษฐกิจของรัฐ', 'หน้าที่ด้านการจัดสรร การกระจาย และการรักษาเสถียรภาพ', ['role of government', 'public finance'], [1]],
			['ความล้มเหลวของตลาดและสินค้าสาธารณะ', 'สินค้าสาธารณะ ผลกระทบภายนอก และข้อมูลไม่สมมาตร', ['market failure', 'public goods', 'externalities'], [1]],
			['รายจ่ายสาธารณะ: ประเภทและการวิเคราะห์', 'รายจ่ายประจำ รายจ่ายลงทุน และแนวโน้มรายจ่ายของรัฐบาลไทย', ['public expenditure'], [1]],
			['ทฤษฎีภาษีอากรและหลักการจัดเก็บภาษีที่ดี', 'ความเป็นธรรม ประสิทธิภาพ และภาระภาษี', ['taxation', 'tax principles', 'tax incidence'], [1]],
			['โครงสร้างภาษีของไทย', 'ภาษีเงินได้ ภาษีมูลค่าเพิ่ม และภาษีสรรพสามิต', ['Thai tax system', 'income tax', 'value added tax'], [2]],
			['รายได้ที่มิใช่ภาษีและรัฐวิสาหกิจ', 'ค่าธรรมเนียม รายได้จากรัฐวิสาหกิจ และการบริหารทรัพย์สินของรัฐ', ['non-tax revenue', 'state enterprises'], [2]],
			['หนี้สาธารณะและวินัยการคลัง', 'กรอบวินัยการเงินการคลังของรัฐและเพดานหนี้', ['public debt', 'fiscal discipline'], [3]],
			MIDTERM,
			['กระบวนการงบประมาณของไทยเบื้องต้น (1): วงจรงบประมาณ', 'การจัดเตรียม การจัดทำคำของบประมาณ และปฏิทินงบประมาณ', ['budget cycle', 'budget process', 'budget preparation'], [2]],
			['กระบวนการงบประมาณของไทยเบื้องต้น (2): การอนุมัติและการบริหารงบประมาณ', 'การพิจารณาของรัฐสภา การจัดสรร และการเบิกจ่าย', ['budget approval', 'budget execution'], [2]],
			['การคลังท้องถิ่นและความสัมพันธ์ทางการคลังระหว่างรัฐบาลกับท้องถิ่น', 'รายได้ขององค์กรปกครองส่วนท้องถิ่นและเงินอุดหนุน', ['fiscal decentralization', 'intergovernmental transfers'], [2]],
			['นโยบายการคลังกับการรักษาเสถียรภาพทางเศรษฐกิจ', 'การขาดดุล การเกินดุล และตัวทวีคูณทางการคลัง', ['fiscal policy', 'economic stabilization'], [1]],
			['การคลังเพื่อสังคม: สวัสดิการและการกระจายรายได้', 'เงินโอน สวัสดิการ และความเหลื่อมล้ำ', ['redistribution', 'social welfare'], [1]],
			['กรณีศึกษา: มาตรการกระตุ้นเศรษฐกิจของรัฐบาล', 'วิเคราะห์ต้นทุนทางการคลังและผลที่ได้', ['fiscal stimulus', 'case study'], []],
			['นำเสนอรายงานวิเคราะห์งบประมาณ', 'กลุ่มละ 15 นาที', [], [], { activity: 'นำเสนอและส่งรายงานกลุ่ม' }],
			['สรุปรายวิชาและทบทวนก่อนสอบปลายภาค', '', [], []]
		],
		evals: [
			['การมีส่วนร่วมในชั้นเรียน', 'participation', 10, true, null],
			['แบบฝึกหัดในชั้นเรียน', 'other', 10, true, null, 'แบบฝึกหัดคำนวณและอ่านเอกสารงบประมาณ 5 ครั้ง'],
			['สอบกลางภาค', 'midterm_exam', 30, true, 8, ''],
			['รายงานวิเคราะห์งบประมาณ', 'paper', 20, false, 15, 'ดูรายละเอียดในงานที่มอบหมาย'],
			['สอบปลายภาค', 'final_exam', 30, true, null, '']
		],
		readings: [
			{ cite: 'Rosen, H. S., & Gayer, T. (2014). Public finance (10th ed.). McGraw-Hill Education.', title: 'Public Finance', authors: 'Harvey S. Rosen, Ted Gayer', year: 2014, type: 'book', required: true },
			{ cite: 'Mikesell, J. L. Fiscal administration: Analysis and applications for the public sector. Cengage Learning.', title: 'Fiscal Administration: Analysis and Applications for the Public Sector', authors: 'John L. Mikesell', year: null, type: 'book', required: false },
			{ cite: 'พระราชบัญญัติวินัยการเงินการคลังของรัฐ พ.ศ. 2561.', title: 'พระราชบัญญัติวินัยการเงินการคลังของรัฐ พ.ศ. 2561', authors: 'ประเทศไทย', year: 2018, type: 'law', required: true }
		],
		work: [
			{
				title: 'รายงานวิเคราะห์งบประมาณรายจ่ายของหน่วยงานภาครัฐ',
				type: 'paper',
				description: 'เลือกหน่วยงานภาครัฐ 1 แห่ง วิเคราะห์โครงสร้างงบประมาณรายจ่าย 3 ปีย้อนหลัง และอธิบายความเชื่อมโยงกับนโยบายของหน่วยงาน',
				deliverable: 'รายงานประมาณ 12 หน้า และนำเสนอ 15 นาที',
				groupSize: '4–5',
				due: 15,
				evalNo: 4,
				hours: 15
			}
		]
	}),

	'2404312': build({
		focus:
			'ภาคการศึกษานี้ศึกษาการบริหารงานบุคคลภาครัฐตามกระบวนการตั้งแต่การวางแผนกำลังคน การสรรหา การพัฒนา จนถึงการประเมินผลการปฏิบัติงาน โดยใช้ระบบข้าราชการพลเรือนไทยเป็นกรณีหลัก และให้นิสิตเขียนรายงานกรณีศึกษาปัญหาการบริหารงานบุคคลจริง',
		keywords: ['personnel administration', 'merit system', 'recruitment', 'workforce planning', 'performance appraisal', 'Thai civil service'],
		clos: [
			['อธิบายแนวคิดและวิวัฒนาการของการบริหารงานบุคคลภาครัฐได้', ['PLO1D']],
			['วิเคราะห์กระบวนการบริหารงานบุคคลของระบบข้าราชการพลเรือนไทยได้', ['PLO2D']],
			['เขียนรายงานวิเคราะห์ปัญหาการบริหารงานบุคคลพร้อมข้อเสนอแนะได้', ['PLO3D', 'PLO5D']]
		],
		methods: ['lecture', 'discussion', 'case_study'],
		approach: 'บรรยายตามกระบวนการบริหารงานบุคคล ยกกรณีศึกษาจากส่วนราชการไทยในทุกหัวข้อ และให้นิสิตนำเสนอกรณีศึกษาในช่วงท้ายภาค',
		ai: 'allowed_with_disclosure',
		aiNote: 'ระบุการใช้ AI ในภาคผนวกของรายงาน',
		lead: ['@pimchanok'],
		weeks: [
			['แนะนำรายวิชา: ความหมายและวิวัฒนาการของการบริหารงานบุคคล', 'จากการบริหารงานบุคคลสู่การบริหารทรัพยากรมนุษย์', ['personnel administration', 'human resource management'], [1]],
			['ระบบคุณธรรมและระบบอุปถัมภ์', 'หลักความสามารถ ความเสมอภาค ความมั่นคง และความเป็นกลางทางการเมือง', ['merit system', 'patronage'], [1]],
			['ระบบบริหารงานบุคคลภาครัฐไทย', 'ข้าราชการพลเรือน บทบาทของ ก.พ. และองค์กรกลางบริหารงานบุคคล', ['Thai civil service', 'central personnel agency'], [2]],
			['การจัดตำแหน่งและการวิเคราะห์งาน', 'การจำแนกตำแหน่ง คำบรรยายลักษณะงาน', ['job analysis', 'position classification'], [1]],
			['การสรรหาและการเลือกสรร', 'การสอบแข่งขัน การคัดเลือก และความเป็นธรรมในการเลือกสรร', ['recruitment', 'selection'], [1, 2]],
			['การวางแผนกำลังคนและการวิเคราะห์อัตรากำลัง', 'การคาดการณ์ความต้องการกำลังคนและการกำหนดกรอบอัตรากำลังของส่วนราชการ', ['workforce planning', 'manpower analysis'], [1]],
			['ค่าตอบแทนและสวัสดิการ', 'โครงสร้างเงินเดือนและสิทธิประโยชน์ของข้าราชการ', ['compensation', 'benefits'], [2]],
			MIDTERM,
			['การประเมินผลการปฏิบัติงาน', 'ระบบประเมินผลและปัญหาความลำเอียงในการประเมิน', ['performance appraisal'], [1]],
			['การพัฒนาบุคลากรและเส้นทางความก้าวหน้า', 'การฝึกอบรมและการเลื่อนตำแหน่ง', ['training', 'career development'], [1]],
			['วินัย จริยธรรม และการคุ้มครองระบบคุณธรรม', 'การดำเนินการทางวินัยและการอุทธรณ์ร้องทุกข์', ['discipline', 'ethics', 'merit protection'], [2]],
			['ความผูกพันและแรงงานสัมพันธ์ในภาครัฐ', 'แรงจูงใจในการทำงานภาครัฐและความผูกพันของบุคลากร', ['employee engagement', 'public service motivation'], [3], { activity: 'ส่งรายงานกรณีศึกษา' }],
			['ความหลากหลายและความเท่าเทียมในที่ทำงานภาครัฐ', 'ความเสมอภาคทางเพศและการไม่เลือกปฏิบัติ', ['diversity', 'equity'], [3]],
			['การบริหารคนเก่งและการบริหารทรัพยากรบุคคลยุคดิจิทัล', 'ระบบข้อมูลบุคลากรและการทำงานแบบยืดหยุ่น', ['talent management', 'digital HR'], []],
			['นำเสนอกรณีศึกษา', 'กลุ่มละ 15 นาที', [], [], { activity: 'การนำเสนอกลุ่ม' }],
			['สรุปรายวิชาและทบทวนก่อนสอบปลายภาค', '', [], []]
		],
		evals: [
			['การมีส่วนร่วมในชั้นเรียน', 'participation', 10, true, null],
			['สอบกลางภาค', 'midterm_exam', 30, true, 8, 'อัตนัย 4 ข้อ'],
			['รายงานกรณีศึกษา', 'case_analysis', 15, true, 12, 'ดูรายละเอียดในงานที่มอบหมาย'],
			['นำเสนอกรณีศึกษากลุ่ม', 'presentation', 15, false, 15, ''],
			['สอบปลายภาค', 'final_exam', 30, true, null, '']
		],
		readings: [
			{ cite: 'Berman, E. M., Bowman, J. S., West, J. P., & Van Wart, M. R. Human resource management in public service: Paradoxes, processes, and problems. SAGE.', title: 'Human Resource Management in Public Service', authors: 'Evan M. Berman, James S. Bowman, Jonathan P. West, Montgomery R. Van Wart', year: null, type: 'book', required: true },
			{ cite: 'พระราชบัญญัติระเบียบข้าราชการพลเรือน พ.ศ. 2551 และที่แก้ไขเพิ่มเติม.', title: 'พระราชบัญญัติระเบียบข้าราชการพลเรือน พ.ศ. 2551', authors: 'ประเทศไทย', year: 2008, type: 'law', required: true },
			{ cite: 'Perry, J. L., & Wise, L. R. (1990). The motivational bases of public service. Public Administration Review, 50(3), 367–373.', title: 'The Motivational Bases of Public Service', authors: 'James L. Perry, Lois Recascino Wise', year: 1990, type: 'article', required: false }
		],
		work: [
			{
				title: 'รายงานกรณีศึกษา: ปัญหาการบริหารงานบุคคลในหน่วยงานภาครัฐ',
				type: 'case_analysis',
				description: 'เลือกปัญหาการบริหารงานบุคคล 1 ประเด็นจากข่าวหรือรายงานของหน่วยงานภาครัฐ วิเคราะห์สาเหตุด้วยแนวคิดที่เรียน และเสนอแนวทางแก้ไข',
				deliverable: 'รายงาน 6–8 หน้า',
				due: 12,
				evalNo: 3,
				hours: 10
			}
		]
	}),

	'2404317': build({
		focus:
			'ภาคการศึกษานี้เน้นกระบวนการวางแผนทรัพยากรมนุษย์ในองค์การภาครัฐ ตั้งแต่การวิเคราะห์อัตรากำลัง การพยากรณ์ความต้องการกำลังคน จนถึงการวางแผนสืบทอดตำแหน่ง นิสิตจะลงพื้นที่สัมภาษณ์หน่วยงานบริหารทรัพยากรบุคคลของส่วนราชการจริงเป็นกลุ่ม',
		keywords: ['human resource planning', 'workforce planning', 'manpower analysis', 'forecasting', 'succession planning', 'competency'],
		clos: [
			['อธิบายแนวคิดและกระบวนการวางแผนทรัพยากรมนุษย์ในองค์การภาครัฐได้', ['PLO1D']],
			['ใช้เทคนิคพื้นฐานในการวิเคราะห์อัตรากำลังและพยากรณ์ความต้องการกำลังคนได้', ['PLO2D', 'PLO4']],
			['เก็บข้อมูลภาคสนามและเขียนรายงานวิเคราะห์การวางแผนกำลังคนของหน่วยงานจริงได้', ['PLO3D', 'PLO4D']]
		],
		methods: ['lecture', 'case_study', 'field_visit', 'group_project'],
		approach: 'บรรยายสลับกับแบบฝึกหัดวิเคราะห์ข้อมูลกำลังคน และทำงานภาคสนามเป็นกลุ่ม โดยแต่ละกลุ่มสัมภาษณ์ผู้รับผิดชอบงานบริหารทรัพยากรบุคคลของส่วนราชการ 1 แห่ง',
		ai: 'allowed_with_disclosure',
		aiNote: 'ห้ามใช้ AI ถอดความหรือแต่งข้อมูลการสัมภาษณ์ ใช้ช่วยเรียบเรียงภาษาได้โดยระบุไว้',
		lead: ['@kittipong'],
		weeks: [
			['แนะนำรายวิชา: ความสำคัญของการวางแผนทรัพยากรมนุษย์ในองค์การภาครัฐ', 'การวางแผนทรัพยากรมนุษย์เชิงกลยุทธ์', ['human resource planning', 'strategic HRM'], [1]],
			['กระบวนการวางแผนทรัพยากรมนุษย์และการวิเคราะห์อัตรากำลัง', 'ขั้นตอนการวางแผน การวิเคราะห์ภาระงาน และการกำหนดอัตรากำลังที่เหมาะสม', ['human resource planning process', 'workforce planning', 'manpower analysis'], [1]],
			['การเชื่อมแผนทรัพยากรมนุษย์กับแผนยุทธศาสตร์องค์การ', 'การแปลงยุทธศาสตร์เป็นความต้องการด้านกำลังคน', ['strategic alignment'], [1]],
			['การพยากรณ์ความต้องการกำลังคน', 'เทคนิคเชิงปริมาณและเชิงคุณภาพในการพยากรณ์', ['demand forecasting'], [1]],
			['การวิเคราะห์อุปทานกำลังคนและข้อมูลบุคลากร', 'อัตราการลาออก การเกษียณ และระบบสารสนเทศบุคลากร', ['supply analysis', 'HR information system'], [3]],
			['การวิเคราะห์ช่องว่างสมรรถนะ', 'ตัวแบบสมรรถนะและการวิเคราะห์ช่องว่าง', ['competency model', 'competency gap analysis'], [1]],
			['การวางแผนสืบทอดตำแหน่ง', 'การเตรียมผู้บริหารรุ่นต่อไปในส่วนราชการ', ['succession planning'], [2]],
			MIDTERM,
			['การวางแผนการสรรหาและการรักษาบุคลากร', 'กลยุทธ์ดึงดูดและรักษาบุคลากรที่มีความสามารถ', ['recruitment planning', 'retention'], [3]],
			['นโยบายการบริหารกำลังคนภาครัฐของไทย', 'การควบคุมขนาดกำลังคนภาครัฐและการเกลี่ยอัตรากำลัง', ['public workforce policy'], []],
			['การวางแผนรับมือสังคมสูงวัยและเทคโนโลยี', 'ผลของการเกษียณจำนวนมากและระบบอัตโนมัติต่อกำลังคนภาครัฐ', ['ageing workforce', 'automation'], []],
			['การติดตามและประเมินผลแผนทรัพยากรมนุษย์', 'ตัวชี้วัดด้านทรัพยากรมนุษย์', ['HR metrics'], [1], { activity: 'ส่งรายงานภาคสนาม' }],
			['กรณีศึกษา: การวางแผนกำลังคนของหน่วยงานภาครัฐ', 'อภิปรายบทเรียนจากรายงานภาคสนาม', ['case study'], []],
			['นำเสนอรายงานภาคสนาม (1)', 'กลุ่มที่ 1–5', [], [], { activity: 'การนำเสนอกลุ่ม' }],
			['นำเสนอรายงานภาคสนาม (2)', 'กลุ่มที่ 6–10', [], [], { activity: 'การนำเสนอกลุ่ม' }],
			['สรุปรายวิชาและทบทวนก่อนสอบปลายภาค', '', [], []]
		],
		evals: [
			['การมีส่วนร่วมในชั้นเรียน', 'participation', 10, true, null],
			['สอบกลางภาค', 'midterm_exam', 25, true, 8, ''],
			['รายงานภาคสนาม', 'paper', 30, false, 12, 'ดูรายละเอียดในงานที่มอบหมาย'],
			['สอบปลายภาค', 'final_exam', 35, true, null, '']
		],
		readings: [
			{ cite: "Armstrong, M., & Taylor, S. (2020). Armstrong's handbook of human resource management practice (15th ed.). Kogan Page.", title: "Armstrong's Handbook of Human Resource Management Practice", authors: 'Michael Armstrong, Stephen Taylor', year: 2020, type: 'book', required: true },
			{ cite: 'Rothwell, W. J. (2015). Effective succession planning: Ensuring leadership continuity and building talent from within (5th ed.). AMACOM.', title: 'Effective Succession Planning', authors: 'William J. Rothwell', year: 2015, type: 'book', required: false },
			{ cite: 'Pynes, J. E. Human resources management for public and nonprofit organizations: A strategic approach. Jossey-Bass.', title: 'Human Resources Management for Public and Nonprofit Organizations', authors: 'Joan E. Pynes', year: null, type: 'book', required: false }
		],
		work: [
			{
				title: 'รายงานภาคสนาม: สัมภาษณ์หน่วยงานบริหารทรัพยากรบุคคลของส่วนราชการ',
				type: 'fieldwork_report',
				description: 'สัมภาษณ์ผู้รับผิดชอบงานบริหารทรัพยากรบุคคลของส่วนราชการ 1 แห่ง เกี่ยวกับกระบวนการวางแผนกำลังคนและการวิเคราะห์อัตรากำลัง แล้ววิเคราะห์เทียบกับแนวคิดที่เรียน',
				deliverable: 'รายงานประมาณ 15 หน้า พร้อมบันทึกการสัมภาษณ์',
				groupSize: '3–4',
				due: 12,
				evalNo: 3,
				hours: 20
			}
		]
	}),

	'2404416': build({
		focus:
			'ภาคการศึกษานี้เน้นการพัฒนาทรัพยากรมนุษย์ในภาครัฐตั้งแต่การวิเคราะห์ความจำเป็นในการฝึกอบรม การออกแบบและประเมินผลการฝึกอบรม ไปจนถึงองค์การแห่งการเรียนรู้ นิสิตจะสัมภาษณ์ฝ่ายพัฒนาบุคลากรของหน่วยงานภาครัฐจริงเป็นกลุ่ม',
		keywords: ['human resource development', 'training needs analysis', 'training design', 'training evaluation', 'learning organization'],
		clos: [
			['อธิบายปรัชญา แนวคิด และทฤษฎีการพัฒนาทรัพยากรมนุษย์ได้', ['PLO1D']],
			['วิเคราะห์ความจำเป็นในการฝึกอบรมและออกแบบแผนการพัฒนาบุคลากรได้', ['PLO2D', 'PLO4D']],
			['ประเมินผลโครงการพัฒนาบุคลากรโดยใช้ตัวแบบที่เหมาะสมได้', ['PLO2D', 'PLO3D']]
		],
		methods: ['lecture', 'workshop_seminar', 'field_visit', 'group_project'],
		approach: 'บรรยายและฝึกปฏิบัติแบบเวิร์กช็อปในการออกแบบการฝึกอบรม นิสิตทำงานภาคสนามเป็นกลุ่มกับหน่วยงานภาครัฐ และออกแบบแผนการพัฒนารายบุคคลของตนเอง',
		ai: 'allowed_with_disclosure',
		lead: ['@pimchanok'],
		weeks: [
			['แนะนำรายวิชา: ปรัชญาและแนวคิดการพัฒนาทรัพยากรมนุษย์', 'ความแตกต่างระหว่างการฝึกอบรม การศึกษา และการพัฒนา', ['human resource development'], [1]],
			['ทฤษฎีการเรียนรู้ของผู้ใหญ่', 'แนวคิด andragogy และวงจรการเรียนรู้จากประสบการณ์', ['adult learning', 'andragogy'], [1]],
			['การวิเคราะห์ความจำเป็นในการฝึกอบรม', 'การวิเคราะห์ระดับองค์การ งาน และบุคคล', ['training needs analysis'], [1]],
			['การออกแบบหลักสูตรฝึกอบรม', 'ตัวแบบ ADDIE และการกำหนดวัตถุประสงค์การเรียนรู้', ['training design', 'ADDIE'], [1]],
			['วิธีการฝึกอบรมและการเรียนรู้ในที่ทำงาน', 'การสอนงาน การโค้ช และระบบพี่เลี้ยง', ['on-the-job training', 'coaching', 'mentoring'], [1]],
			['การเรียนรู้แบบดิจิทัลในภาครัฐ', 'e-Learning และการเรียนรู้แบบผสมผสาน', ['e-learning', 'blended learning'], []],
			['การประเมินผลการฝึกอบรมตามแนวคิดของ Kirkpatrick', 'การประเมิน 4 ระดับ', ['training evaluation', 'Kirkpatrick model'], [2]],
			MIDTERM,
			['การพัฒนาภาวะผู้นำและผู้บริหารภาครัฐ', 'หลักสูตรพัฒนานักบริหารและผู้นำรุ่นใหม่', ['leadership development'], [1]],
			['องค์การแห่งการเรียนรู้และการจัดการความรู้', 'วินัย 5 ประการของ Senge', ['learning organization', 'knowledge management'], [3]],
			['การพัฒนาสมรรถนะและเส้นทางอาชีพ', 'แผนพัฒนารายบุคคล (IDP)', ['competency development', 'individual development plan'], [1]],
			['การพัฒนาองค์การ', 'การแทรกแซงเพื่อพัฒนาองค์การ', ['organization development'], [1]],
			['การพัฒนาทรัพยากรมนุษย์ระดับชาติ', 'นโยบายพัฒนาทักษะกำลังคนของประเทศ', ['national HRD', 'reskilling'], [], { activity: 'ส่งรายงานภาคสนาม' }],
			['นำเสนอรายงานภาคสนาม', 'กลุ่มละ 15 นาที', [], [], { activity: 'การนำเสนอกลุ่ม' }],
			['กรณีศึกษา: การพัฒนาบุคลากรภาครัฐไทย', 'อภิปรายบทเรียนจากรายงานภาคสนาม', ['case study'], [], { activity: 'ส่งแผนพัฒนารายบุคคล' }],
			['สรุปรายวิชาและทบทวนก่อนสอบปลายภาค', '', [], []]
		],
		evals: [
			['การมีส่วนร่วมในชั้นเรียน', 'participation', 10, true, null],
			['สอบกลางภาค', 'midterm_exam', 25, true, 8, ''],
			['รายงานภาคสนาม', 'paper', 25, false, 13, 'ดูรายละเอียดในงานที่มอบหมาย'],
			['แผนพัฒนารายบุคคล', 'reflection', 10, true, 15, 'แผนพัฒนาตนเองตามสมรรถนะที่ต้องการ'],
			['สอบปลายภาค', 'final_exam', 30, true, null, '']
		],
		readings: [
			{ cite: 'Werner, J. M., & DeSimone, R. L. (2012). Human resource development (6th ed.). South-Western Cengage Learning.', title: 'Human Resource Development', authors: 'Jon M. Werner, Randy L. DeSimone', year: 2012, type: 'book', required: true },
			{ cite: 'Kirkpatrick, D. L., & Kirkpatrick, J. D. (2006). Evaluating training programs: The four levels (3rd ed.). Berrett-Koehler.', title: 'Evaluating Training Programs: The Four Levels', authors: 'Donald L. Kirkpatrick, James D. Kirkpatrick', year: 2006, type: 'book', required: false },
			{ cite: 'Senge, P. M. (2006). The fifth discipline: The art and practice of the learning organization (Rev. ed.). Doubleday.', title: 'The Fifth Discipline', authors: 'Peter M. Senge', year: 2006, type: 'book', required: false }
		],
		work: [
			{
				title: 'รายงานภาคสนาม: สัมภาษณ์ฝ่ายพัฒนาบุคลากรของหน่วยงานภาครัฐและวิเคราะห์ความจำเป็นในการฝึกอบรม',
				type: 'fieldwork_report',
				description: 'สัมภาษณ์ผู้รับผิดชอบงานพัฒนาบุคลากรของหน่วยงานภาครัฐ 1 แห่ง วิเคราะห์ความจำเป็นในการฝึกอบรม และเสนอโครงร่างหลักสูตรที่ตอบความจำเป็นนั้น',
				deliverable: 'รายงานประมาณ 12 หน้า พร้อมบันทึกการสัมภาษณ์',
				groupSize: '3–4',
				due: 13,
				evalNo: 3,
				hours: 18
			},
			{
				title: 'แผนพัฒนารายบุคคล (Individual Development Plan)',
				type: 'other',
				description: 'ประเมินสมรรถนะของตนเองเทียบกับงานที่สนใจ และวางแผนพัฒนา 1 ปี',
				deliverable: 'แผน 3–4 หน้า',
				due: 15,
				evalNo: 4,
				hours: 5
			}
		]
	}),

	'2404324': example as SyllabusDoc,

	'2404368': build({
		focus:
			'ภาคการศึกษานี้ใช้ตอนเรียนสองตอนที่ใช้ประมวลรายวิชาเดียวกัน เน้นการใช้สถิติเพื่อการตัดสินใจทางการบริหาร ตั้งแต่สถิติเชิงพรรณนาจนถึงการวิเคราะห์การถดถอย นิสิตฝึกวิเคราะห์ข้อมูลภาครัฐจริงในห้องปฏิบัติการคอมพิวเตอร์ทุกสัปดาห์',
		keywords: ['descriptive statistics', 'sampling', 'hypothesis testing', 'regression', 'data analysis', 'research design'],
		clos: [
			['เลือกใช้สถิติเชิงพรรณนาและสถิติเชิงอนุมานให้เหมาะกับคำถามทางการบริหารได้', ['PLO2D', 'PLO4']],
			['วิเคราะห์ข้อมูลด้วยโปรแกรมสถิติและแปลผลได้ถูกต้อง', ['PLO4D']],
			['เขียนรายงานผลการวิเคราะห์ข้อมูลที่สื่อสารกับผู้บริหารได้', ['PLO3D']]
		],
		methods: ['lecture', 'workshop_seminar', 'problem_based'],
		approach: 'บรรยายแนวคิดครึ่งแรกของคาบ แล้วฝึกปฏิบัติในห้องปฏิบัติการคอมพิวเตอร์ด้วยชุดข้อมูลภาครัฐที่เปิดเผย มีแบบฝึกหัดปฏิบัติการทุกสัปดาห์ และโครงงานวิเคราะห์ข้อมูลกลุ่มในช่วงท้ายภาค',
		ai: 'allowed_with_disclosure',
		aiNote: 'ใช้ AI อธิบายแนวคิดหรือช่วยแก้ปัญหาโปรแกรมได้ แต่ผลการวิเคราะห์ต้องมาจากการรันจริงของนิสิต',
		lead: ['@chonthicha', '@suppawit'],
		weeks: [
			['แนะนำรายวิชา: สถิติกับการตัดสินใจทางการบริหาร', 'สถิติเชิงพรรณนาและสถิติเชิงอนุมาน', ['statistics for decision making'], [1]],
			['การออกแบบการวิจัยและการวัด', 'ตัวแปร มาตรวัด ความเที่ยงและความตรง', ['research design', 'levels of measurement'], [1]],
			['การเก็บข้อมูลและการสุ่มตัวอย่าง', 'วิธีสุ่มตัวอย่างและความคลาดเคลื่อน', ['sampling', 'data collection'], [1]],
			['สถิติเชิงพรรณนา', 'ค่ากลางและการกระจาย', ['descriptive statistics', 'central tendency', 'dispersion'], [1, 2]],
			['การนำเสนอข้อมูลด้วยตารางและแผนภาพ', 'หลักการเลือกแผนภาพให้เหมาะกับข้อมูล', ['data visualization'], [2]],
			['ความน่าจะเป็นและการแจกแจงปกติ', 'ค่ามาตรฐานและพื้นที่ใต้โค้งปกติ', ['probability', 'normal distribution'], [1]],
			['การประมาณค่าและช่วงความเชื่อมั่น', 'การประมาณค่าเฉลี่ยและสัดส่วน', ['estimation', 'confidence interval'], [1]],
			MIDTERM,
			['การทดสอบสมมติฐาน', 'การทดสอบที และความผิดพลาดประเภทที่ 1 และ 2', ['hypothesis testing', 't-test'], [1, 2]],
			['การวิเคราะห์ความแปรปรวน', 'การเปรียบเทียบค่าเฉลี่ยมากกว่าสองกลุ่ม', ['ANOVA'], [2]],
			['การวิเคราะห์ตารางไขว้และไคสแควร์', 'ความสัมพันธ์ระหว่างตัวแปรเชิงกลุ่ม', ['chi-square', 'crosstabulation'], [1]],
			['สหสัมพันธ์', 'สัมประสิทธิ์สหสัมพันธ์และข้อควรระวังในการตีความ', ['correlation'], [1]],
			['การวิเคราะห์การถดถอยอย่างง่าย', 'การประมาณสมการและการตีความค่าสัมประสิทธิ์', ['simple regression'], [1, 2]],
			['การวิเคราะห์การถดถอยพหุคูณ', 'ตัวแปรควบคุมและตัวแปรหุ่น', ['multiple regression'], [1, 2]],
			['การเขียนรายงานผลการวิเคราะห์ข้อมูล', 'การสื่อสารผลสถิติให้ผู้บริหารเข้าใจ', ['reporting results'], [], { activity: 'ส่งโครงงานวิเคราะห์ข้อมูล' }],
			['สรุปรายวิชาและทบทวนก่อนสอบปลายภาค', '', [], []]
		],
		evals: [
			['แบบฝึกหัดปฏิบัติการรายสัปดาห์', 'other', 20, true, null, 'ส่งท้ายคาบทุกสัปดาห์ นับ 10 ครั้งที่ดีที่สุด'],
			['สอบกลางภาค', 'midterm_exam', 30, true, 8, 'ข้อสอบคำนวณและแปลผล'],
			['โครงงานวิเคราะห์ข้อมูล', 'project', 20, false, 15, 'ดูรายละเอียดในงานที่มอบหมาย'],
			['สอบปลายภาค', 'final_exam', 30, true, null, '']
		],
		readings: [
			{ cite: 'Meier, K. J., Brudney, J. L., & Bohte, J. (2015). Applied statistics for public and nonprofit administration (9th ed.). Cengage Learning.', title: 'Applied Statistics for Public and Nonprofit Administration', authors: 'Kenneth J. Meier, Jeffrey L. Brudney, John Bohte', year: 2015, type: 'book', required: true },
			{ cite: 'Field, A. (2018). Discovering statistics using IBM SPSS statistics (5th ed.). SAGE.', title: 'Discovering Statistics Using IBM SPSS Statistics', authors: 'Andy Field', year: 2018, type: 'book', required: false }
		],
		platforms: [
			{ name: 'MyCourseVille', url: null, note: 'ประกาศ เอกสาร และส่งงานทั้งหมด' },
			{ name: 'ห้องปฏิบัติการคอมพิวเตอร์', url: null, note: 'ใช้โปรแกรม SPSS และ jamovi' }
		],
		work: [
			{
				title: 'แบบฝึกหัดปฏิบัติการรายสัปดาห์',
				type: 'exercise',
				description: 'วิเคราะห์ชุดข้อมูลตามโจทย์ของสัปดาห์นั้นและตอบคำถามสั้น',
				deliverable: 'ไฟล์ผลการวิเคราะห์ ส่งท้ายคาบ',
				due: null,
				evalNo: 1,
				hours: 1
			},
			{
				title: 'โครงงานวิเคราะห์ข้อมูลภาครัฐ',
				type: 'project',
				description: 'ตั้งคำถามทางการบริหาร 1 ข้อ วิเคราะห์ด้วยชุดข้อมูลเปิดของภาครัฐ และเขียนรายงานสรุปสำหรับผู้บริหาร',
				deliverable: 'รายงาน 8 หน้า พร้อมไฟล์ข้อมูลและผลการวิเคราะห์',
				groupSize: '3',
				due: 15,
				evalNo: 3,
				hours: 15
			}
		]
	}),

	// draft: weeks 1–12 only, and evaluation sums to 90, so the readiness checklist shows a failing rule (spec 08)
	'2404318': build({
		focus:
			'ภาคการศึกษานี้เน้นการกำกับติดตามและประเมินผลแบบมุ่งผลสัมฤทธิ์ ตั้งแต่ตัวแบบเชิงตรรกะและการออกแบบตัวชี้วัด ไปจนถึงการประเมินผลนโยบายและโครงการ นิสิตจะจัดทำแผนการติดตามและประเมินผลของโครงการภาครัฐจริงเป็นกลุ่ม',
		keywords: ['monitoring', 'evaluation', 'logic model', 'indicators', 'impact evaluation', 'results-based management'],
		clos: [
			['อธิบายหลักการและความแตกต่างของการกำกับติดตามและการประเมินผลได้', ['PLO1D']],
			['ออกแบบตัวแบบเชิงตรรกะและตัวชี้วัดของโครงการได้', ['PLO2D', 'PLO4D']],
			['วางแผนการประเมินผลนโยบายหรือโครงการที่เหมาะกับคำถามการประเมินได้', ['PLO2D', 'PLO3D']]
		],
		methods: ['lecture', 'workshop_seminar', 'case_study', 'group_project'],
		approach: 'บรรยายและฝึกเขียนตัวแบบเชิงตรรกะกับตัวชี้วัดของโครงการจริง ทำงานกลุ่มจัดทำแผนการติดตามและประเมินผล',
		ai: 'unspecified',
		lead: ['@chonthicha'],
		weeks: [
			['แนะนำรายวิชา: การกำกับติดตามกับการประเมินผล', 'ความเหมือนและความต่าง และบทบาทในวงจรนโยบาย', ['monitoring', 'evaluation'], [1]],
			['การบริหารแบบมุ่งผลสัมฤทธิ์', 'ผลผลิต ผลลัพธ์ และผลกระทบ', ['results-based management'], [1]],
			['ตัวแบบเชิงตรรกะ (Logic model)', 'ปัจจัยนำเข้า กิจกรรม ผลผลิต ผลลัพธ์ และทฤษฎีการเปลี่ยนแปลง', ['logic model', 'theory of change', 'outputs', 'outcomes'], [2]],
			['การออกแบบตัวชี้วัด', 'ตัวชี้วัดที่ดีและการกำหนดค่าเป้าหมาย', ['indicators', 'KPI'], [1]],
			['ระบบการกำกับติดตาม', 'การเก็บข้อมูลและการรายงานความก้าวหน้า', ['monitoring system', 'data collection'], [1]],
			['การประเมินความต้องการและการประเมินก่อนเริ่มโครงการ', 'การประเมินก่อนดำเนินการ', ['needs assessment', 'ex-ante evaluation'], [3]],
			['การประเมินกระบวนการ', 'การประเมินความครบถ้วนของการดำเนินงาน', ['process evaluation'], [3]],
			MIDTERM,
			['การประเมินผลนโยบายและโครงการ (1): การออกแบบการประเมินผลลัพธ์', 'คำถามการประเมินและแบบการประเมิน', ['outcome evaluation', 'evaluation design', 'policy evaluation'], [3]],
			['การประเมินผลนโยบายและโครงการ (2): การประเมินผลกระทบ', 'สภาพการณ์สมมติ (counterfactual) และกลุ่มเปรียบเทียบ', ['impact evaluation', 'counterfactual', 'policy evaluation'], [3]],
			['การวิเคราะห์ต้นทุน-ประสิทธิผล', 'การเปรียบเทียบทางเลือกโครงการด้วยต้นทุนต่อผลลัพธ์', ['cost-effectiveness analysis'], [3]],
			['การใช้ผลการประเมินและการรายงานผล', 'การสื่อสารผลการประเมินกับผู้ตัดสินใจ', ['evaluation use', 'reporting'], [], { activity: 'ส่งแผนการติดตามและประเมินผล' }]
		],
		evals: [
			['การมีส่วนร่วมในชั้นเรียน', 'participation', 10, true, null],
			['สอบกลางภาค', 'midterm_exam', 30, true, 8, ''],
			['แผนการติดตามและประเมินผลโครงการ', 'project', 20, false, 12, ''],
			['สอบปลายภาค', 'final_exam', 30, true, null, '']
		],
		readings: [
			{ cite: 'Kusek, J. Z., & Rist, R. C. (2004). Ten steps to a results-based monitoring and evaluation system. World Bank.', title: 'Ten Steps to a Results-Based Monitoring and Evaluation System', authors: 'Jody Zall Kusek, Ray C. Rist', year: 2004, type: 'book', required: true },
			{ cite: 'W.K. Kellogg Foundation. (2004). Logic model development guide. W.K. Kellogg Foundation.', title: 'Logic Model Development Guide', authors: 'W.K. Kellogg Foundation', year: 2004, type: 'report', required: false },
			{ cite: 'Rossi, P. H., Lipsey, M. W., & Henry, G. T. (2019). Evaluation: A systematic approach (8th ed.). SAGE.', title: 'Evaluation: A Systematic Approach', authors: 'Peter H. Rossi, Mark W. Lipsey, Gary T. Henry', year: 2019, type: 'book', required: false }
		],
		work: [
			{
				title: 'แผนการติดตามและประเมินผลโครงการภาครัฐ',
				type: 'project',
				description: 'เลือกโครงการภาครัฐ 1 โครงการ เขียนตัวแบบเชิงตรรกะ ตัวชี้วัด และแผนการประเมินผล',
				deliverable: 'รายงาน 10 หน้า',
				groupSize: '4',
				due: 12,
				evalNo: 3,
				hours: 15
			}
		]
	}),

	'2404412': build({
		focus:
			'ภาคการศึกษานี้จัดเป็นห้องปฏิบัติการนโยบาย (policy lab) สอนร่วมโดยอาจารย์ 3 ท่าน นิสิตทำงานกลุ่มกับโจทย์จริงจากหน่วยงานภาครัฐตลอดภาค ตั้งแต่การนิยามปัญหา การออกแบบและทดสอบต้นแบบบริการ จนถึงการนำเสนอข้อเสนอต่อผู้บริหารหน่วยงาน',
		keywords: ['policy lab', 'design thinking', 'service design', 'co-creation', 'prototyping', 'public sector innovation'],
		clos: [
			['ประยุกต์ใช้แนวคิดทางรัฐประศาสนศาสตร์วิเคราะห์ปัญหาการบริหารจัดการภาครัฐจริงได้', ['PLO2D']],
			['ออกแบบและทดสอบต้นแบบแนวทางแก้ปัญหาร่วมกับผู้มีส่วนได้ส่วนเสียได้', ['PLO2D', 'PLO4D']],
			['สื่อสารข้อเสนอต่อผู้บริหารภาครัฐอย่างมีหลักฐานและทำงานเป็นทีมได้', ['PLO3D', 'PLO5D']]
		],
		methods: ['policy_lab', 'group_project', 'workshop_seminar', 'field_visit', 'guest_speaker'],
		approach:
			'สอนร่วม 3 ช่วง: ผศ.ดร.ธนกฤต (สัปดาห์ 1–5) ดูแลการนิยามปัญหา ผศ.ดร.กิตติพงษ์ (สัปดาห์ 6–10) ดูแลการออกแบบและทดสอบต้นแบบ ผศ.ดร.ชลธิชา (สัปดาห์ 11–15) ดูแลการประเมินความเป็นไปได้และการนำเสนอ แต่ละกลุ่มมีพี่เลี้ยงจากหน่วยงานภาครัฐ',
		ai: 'allowed',
		aiNote: 'ใช้ AI เป็นเครื่องมือระดมความคิดและสร้างต้นแบบได้เต็มที่ โดยอธิบายวิธีใช้ในรายงาน',
		lead: ['@thanakrit'],
		weeks: [
			['แนะนำรายวิชาและการทำงานแบบห้องปฏิบัติการนโยบาย', 'รับโจทย์จากหน่วยงานภาครัฐและจัดกลุ่ม', ['policy lab', 'public sector innovation'], [1]],
			['การทำความเข้าใจปัญหาสาธารณะและผู้ใช้บริการ', 'การสัมภาษณ์ผู้ใช้บริการและการสังเกต', ['problem definition', 'user research'], [1, 3]],
			['เครื่องมือการคิดเชิงออกแบบสำหรับภาครัฐ', 'แผนที่การเดินทางของผู้ใช้บริการและการนิยามโจทย์', ['design thinking', 'service design'], [3]],
			['การทำงานร่วมกับหน่วยงานภาครัฐและผู้มีส่วนได้ส่วนเสีย', 'การร่วมสร้างสรรค์ (co-creation)', ['stakeholder engagement', 'co-creation'], [1]],
			['นำเสนอโจทย์และการนิยามปัญหา (Milestone 1)', 'นำเสนอต่อพี่เลี้ยงจากหน่วยงาน', [], [], { activity: 'ส่ง Milestone 1' }],
			['การใช้ข้อมูลและหลักฐานเพื่อออกแบบทางเลือก', 'แหล่งข้อมูลภาครัฐและการวิเคราะห์เบื้องต้น', ['evidence-based policy', 'data analysis'], [2], { who: ['@kittipong'] }],
			['การบริหารโครงการและการทำงานเป็นทีม', 'การแบ่งงานและการติดตามความก้าวหน้า', ['project management', 'teamwork'], [], { who: ['@kittipong'] }],
			{ noClass: 'สัปดาห์สอบกลางภาค (งดการเรียนการสอน)' },
			['การออกแบบต้นแบบบริการภาครัฐ', 'ต้นแบบความละเอียดต่ำและการทดสอบกับผู้ใช้', ['prototyping'], [3], { who: ['@kittipong'] }],
			['ทดสอบต้นแบบและนำเสนอความก้าวหน้า (Milestone 2)', 'ทดสอบกับผู้ใช้บริการจริงอย่างน้อย 5 คน', ['user testing'], [], { who: ['@kittipong'], activity: 'ส่ง Milestone 2' }],
			['การประเมินผลกระทบที่คาดหวังและความเป็นไปได้', 'ความเป็นไปได้ทางกฎหมาย งบประมาณ และองค์การ', ['feasibility', 'expected impact'], [2], { who: ['@chonthicha'] }],
			['การประมาณต้นทุนและการขยายผล', 'การประมาณต้นทุนและแนวทางขยายผลในหน่วยงาน', ['costing', 'scaling up'], [], { who: ['@chonthicha'] }],
			['การสื่อสารข้อเสนอต่อผู้บริหารภาครัฐ', 'การเขียนบันทึกข้อเสนอและการนำเสนอแบบกระชับ', ['policy communication', 'pitching'], [], { who: ['@chonthicha'] }],
			['ซ้อมนำเสนอและรับข้อเสนอแนะ', 'ซ้อมนำเสนอระหว่างกลุ่ม', [], [], { who: ['@chonthicha'] }],
			['นำเสนอผลงานต่อหน่วยงานภาครัฐ (Milestone 3)', 'นำเสนอต่อผู้บริหารและพี่เลี้ยงจากหน่วยงาน', [], [], { who: ['@chonthicha'], activity: 'ส่ง Milestone 3' }],
			['สะท้อนการเรียนรู้และสรุปรายวิชา', 'อาจารย์ทั้ง 3 ท่านร่วมสรุป', ['reflection'], [], { who: ['@thanakrit', '@kittipong', '@chonthicha'] }]
		],
		evals: [
			['Milestone 1: การนิยามปัญหา', 'project', 15, false, 5, ''],
			['Milestone 2: ต้นแบบและผลการทดสอบ', 'project', 20, false, 10, ''],
			['Milestone 3: ข้อเสนอและการนำเสนอต่อหน่วยงาน', 'presentation', 30, false, 15, ''],
			['บันทึกสะท้อนการเรียนรู้', 'reflection', 15, true, null, 'บันทึกทุก 2 สัปดาห์'],
			['การมีส่วนร่วมและการประเมินโดยเพื่อนร่วมกลุ่ม', 'participation', 20, true, null, '']
		],
		readings: [
			{ cite: 'Bason, C. (2018). Leading public sector innovation: Co-creating for a better society (2nd ed.). Policy Press.', title: 'Leading Public Sector Innovation', authors: 'Christian Bason', year: 2018, type: 'book', required: true },
			{ cite: 'OECD. (2017). Embracing innovation in government: Global trends. OECD.', title: 'Embracing Innovation in Government: Global Trends', authors: 'OECD', year: 2017, type: 'report', required: false },
			{ cite: 'Brown, T. (2009). Change by design: How design thinking transforms organizations and inspires innovation. HarperBusiness.', title: 'Change by Design', authors: 'Tim Brown', year: 2009, type: 'book', required: false }
		],
		work: [
			{ title: 'Milestone 1: รายงานการนิยามปัญหา', type: 'project', description: 'สรุปปัญหา ผู้ใช้บริการ และหลักฐานจากการสัมภาษณ์', deliverable: 'รายงาน 5 หน้า และนำเสนอ 10 นาที', groupSize: '5–6', due: 5, evalNo: 1, hours: 12 },
			{ title: 'Milestone 2: ต้นแบบและผลการทดสอบ', type: 'project', description: 'ต้นแบบแนวทางแก้ปัญหาและผลการทดสอบกับผู้ใช้บริการ', deliverable: 'ต้นแบบ และรายงานผลการทดสอบ 5 หน้า', groupSize: '5–6', due: 10, evalNo: 2, hours: 15 },
			{ title: 'Milestone 3: ข้อเสนอต่อหน่วยงาน', type: 'presentation', description: 'ข้อเสนอฉบับสมบูรณ์พร้อมการประเมินความเป็นไปได้และต้นทุน', deliverable: 'บันทึกข้อเสนอ 4 หน้า และนำเสนอ 20 นาที', groupSize: '5–6', due: 15, evalNo: 3, hours: 18 }
		],
		keyDates: [
			['ส่ง Milestone 1', 5],
			['ส่ง Milestone 2', 10],
			['นำเสนอต่อหน่วยงาน (Milestone 3)', 15]
		]
	}),

	'2404422': build({
		focus:
			'ภาคการศึกษานี้ศึกษางบประมาณในฐานะเครื่องมือนำนโยบายไปปฏิบัติ ตั้งแต่วงจรและกระบวนการจัดทำงบประมาณของรัฐ พัฒนาการของระบบงบประมาณ การเมืองของงบประมาณ ไปจนถึงงบประมาณแบบมีส่วนร่วมและความโปร่งใสทางการคลัง เป็นวิชาเลือกของสายนโยบายและการวางแผน',
		keywords: ['budget cycle', 'budget process', 'performance-based budgeting', 'incrementalism', 'participatory budgeting', 'fiscal transparency'],
		clos: [
			['อธิบายวงจรงบประมาณและบทบาทของผู้เกี่ยวข้องในกระบวนการงบประมาณของรัฐได้', ['PLO1D']],
			['เปรียบเทียบระบบงบประมาณแบบต่าง ๆ และวิเคราะห์ข้อดีข้อจำกัดได้', ['PLO2D']],
			['วิเคราะห์งบประมาณรายจ่ายของหน่วยงานภาครัฐและเสนอข้อปรับปรุงได้', ['PLO2D', 'PLO3D']]
		],
		methods: ['lecture', 'discussion', 'case_study', 'guest_speaker'],
		approach: 'บรรยายและอภิปรายจากเอกสารงบประมาณจริง มีวิทยากรจากหน่วยงานด้านงบประมาณ 1 ครั้ง นิสิตเขียนบทวิเคราะห์งบประมาณรายบุคคล',
		ai: 'allowed_with_disclosure',
		lead: ['@suppawit'],
		weeks: [
			['แนะนำรายวิชา: งบประมาณในฐานะเครื่องมือนโยบาย', 'ภาพรวมวงจรงบประมาณของรัฐ', ['budget as policy instrument', 'budget cycle'], [1]],
			['วงจรงบประมาณและกระบวนการจัดทำงบประมาณของรัฐ (1): การจัดเตรียมงบประมาณ', 'ปฏิทินงบประมาณ การจัดทำคำของบประมาณ และบทบาทของสำนักงบประมาณ', ['budget cycle', 'budget preparation', 'budget process'], [3, 4]],
			['วงจรงบประมาณและกระบวนการจัดทำงบประมาณของรัฐ (2): การพิจารณาอนุมัติ', 'ร่างพระราชบัญญัติงบประมาณรายจ่ายประจำปีและบทบาทของรัฐสภา', ['legislative budget approval', 'budget process'], [3]],
			['พัฒนาการของระบบงบประมาณ', 'แบบแสดงรายการ แบบแผนงาน และแบบมุ่งเน้นผลงาน', ['line-item budgeting', 'program budgeting', 'performance-based budgeting'], [1]],
			['งบประมาณแบบมุ่งผลสัมฤทธิ์และงบประมาณฐานศูนย์', 'การเชื่อมงบประมาณกับผลลัพธ์', ['results-based budgeting', 'zero-based budgeting'], [2]],
			['การเมืองของงบประมาณ', 'แนวคิดส่วนเพิ่มของ Wildavsky และผู้เล่นในกระบวนการงบประมาณ', ['incrementalism', 'budget politics'], [1]],
			['การบริหารงบประมาณและการควบคุมการใช้จ่าย', 'การโอนเปลี่ยนแปลงงบประมาณและการเบิกจ่าย', ['budget execution', 'expenditure control'], [3]],
			MIDTERM,
			['งบประมาณเชิงพื้นที่และงบประมาณบูรณาการ', 'การจัดสรรงบประมาณข้ามหน่วยงาน', ['area-based budgeting', 'integrated budgeting'], [4]],
			['งบประมาณขององค์กรปกครองส่วนท้องถิ่น', 'กระบวนการงบประมาณท้องถิ่น', ['local government budgeting'], []],
			['งบประมาณที่คำนึงถึงมิติเพศ', 'แนวคิดและตัวอย่างการใช้ในต่างประเทศ', ['gender-responsive budgeting'], []],
			['การมีส่วนร่วมของประชาชนในกระบวนการงบประมาณ', 'งบประมาณแบบมีส่วนร่วม', ['participatory budgeting'], [2]],
			['การติดตามและประเมินผลการใช้งบประมาณ', 'การตรวจสอบผลสัมฤทธิ์และประสิทธิภาพ', ['budget monitoring', 'performance audit'], []],
			['ความโปร่งใสทางการคลังและการเปิดเผยข้อมูลงบประมาณ', 'ดัชนีงบประมาณเปิดและข้อมูลงบประมาณสาธารณะ', ['fiscal transparency', 'open budget'], [4], { activity: 'วิทยากรจากหน่วยงานด้านงบประมาณ' }],
			['นำเสนอบทวิเคราะห์งบประมาณ', 'คนละ 7 นาที', [], [], { activity: 'ส่งบทวิเคราะห์งบประมาณ' }],
			['สรุปรายวิชาและทบทวนก่อนสอบปลายภาค', '', [], []]
		],
		evals: [
			['การมีส่วนร่วมในชั้นเรียน', 'participation', 10, true, null],
			['สอบกลางภาค', 'midterm_exam', 25, true, 8, ''],
			['บทวิเคราะห์งบประมาณ', 'paper', 25, true, 15, 'ดูรายละเอียดในงานที่มอบหมาย'],
			['สอบปลายภาค', 'final_exam', 40, true, null, '']
		],
		readings: [
			{ cite: 'Wildavsky, A., & Caiden, N. (2004). The new politics of the budgetary process (5th ed.). Pearson Longman.', title: 'The New Politics of the Budgetary Process', authors: 'Aaron Wildavsky, Naomi Caiden', year: 2004, type: 'book', required: true },
			{ cite: 'Rubin, I. S. The politics of public budgeting: Getting and spending, borrowing and balancing. CQ Press.', title: 'The Politics of Public Budgeting', authors: 'Irene S. Rubin', year: null, type: 'book', required: false },
			{ cite: 'พระราชบัญญัติวิธีการงบประมาณ พ.ศ. 2561.', title: 'พระราชบัญญัติวิธีการงบประมาณ พ.ศ. 2561', authors: 'ประเทศไทย', year: 2018, type: 'law', required: true },
			{ cite: 'สำนักงบประมาณ. งบประมาณโดยสังเขป (ฉบับปีงบประมาณล่าสุด). สำนักงบประมาณ.', title: 'งบประมาณโดยสังเขป', authors: 'สำนักงบประมาณ', year: null, type: 'report', required: false }
		],
		work: [
			{
				title: 'บทวิเคราะห์งบประมาณรายจ่ายประจำปีของกระทรวง 1 แห่ง',
				type: 'paper',
				description: 'วิเคราะห์งบประมาณรายจ่ายประจำปีของกระทรวง 1 แห่ง ด้วยกรอบแนวคิดที่เรียน และเสนอข้อปรับปรุงการจัดสรร',
				deliverable: 'บทวิเคราะห์ 8–10 หน้า และนำเสนอ 7 นาที',
				due: 15,
				evalNo: 3,
				hours: 15
			}
		]
	}),

	'2404436': build({
		focus:
			'ภาคการศึกษานี้วิเคราะห์ทฤษฎีองค์การสาธารณะเชิงวิพากษ์ ตั้งแต่ทฤษฎียุคคลาสสิกและข้อวิพากษ์ ทฤษฎีการตัดสินใจ สถาบันนิยมใหม่ จนถึงเครือข่ายและการบริหารปกครองร่วม โดยต่อยอดจากพื้นฐานใน 2400114 และใช้กรณีการปรับโครงสร้างหน่วยงานภาครัฐไทย',
		keywords: ['organization theory', 'bureaucracy', 'bounded rationality', 'new institutionalism', 'organizational culture', 'collaborative governance'],
		prerequisiteNote: 'ควรผ่าน 2400114 ความรู้เบื้องต้นเกี่ยวกับรัฐประศาสนศาสตร์ มาก่อน',
		clos: [
			['วิเคราะห์และเปรียบเทียบทฤษฎีองค์การสาธารณะตั้งแต่ยุคคลาสสิกถึงปัจจุบันเชิงวิพากษ์ได้', ['PLO1D', 'PLO2D']],
			['ประยุกต์ใช้ทฤษฎีองค์การอธิบายปรากฏการณ์ในหน่วยงานภาครัฐไทยได้', ['PLO2D']],
			['เขียนบทวิเคราะห์เชิงทฤษฎีที่มีเหตุผลและอ้างอิงถูกต้องได้', ['PLO3D', 'PLO4']]
		],
		methods: ['lecture', 'discussion', 'case_study'],
		approach: 'สัมมนาจากการอ่านเอกสารคลาสสิกทุกสัปดาห์ นิสิตเขียนบันทึกการอ่านสั้นก่อนเข้าชั้น และเขียนบทวิเคราะห์ทฤษฎีกับกรณีหน่วยงานภาครัฐไทย',
		ai: 'allowed_with_disclosure',
		aiNote: 'ห้ามใช้ AI เขียนบันทึกการอ่าน ใช้ช่วยค้นหาเอกสารได้',
		lead: ['@wipawadee'],
		weeks: [
			['แนะนำรายวิชา: องค์การสาธารณะต่างจากองค์การเอกชนอย่างไร', 'ความเป็นสาธารณะของรัฐ', ['public organization', 'publicness'], [1]],
			['ทฤษฎีองค์การยุคคลาสสิกและข้อวิพากษ์', "ระบบราชการแบบอุดมคติของ Weber ข้อวิพากษ์การจัดการเชิงวิทยาศาสตร์ของ Taylor และบทความ 'The Proverbs of Administration' ของ Simon", ['classical organization theory', 'bureaucracy', 'scientific management', 'proverbs of administration'], [1, 2, 3]],
			['ทฤษฎีมนุษยสัมพันธ์และพฤติกรรมองค์การ', 'แรงจูงใจและกลุ่มไม่เป็นทางการ', ['human relations', 'organizational behavior'], [1]],
			['การตัดสินใจในองค์การ: ความมีเหตุผลแบบจำกัด', 'Simon, March และตัวแบบถังขยะ', ['bounded rationality', 'decision making', 'garbage can model'], [1, 3]],
			['ทฤษฎีระบบและทฤษฎีตามสถานการณ์', 'องค์การกับสภาพแวดล้อม', ['systems theory', 'contingency theory'], [1]],
			['ทฤษฎีสถาบันนิยมใหม่', 'ความชอบธรรมและการเลียนแบบเชิงสถาบัน', ['new institutionalism', 'isomorphism'], [1]],
			['อำนาจและการเมืองในองค์การ', 'ที่มาของอำนาจในหน่วยงานราชการ', ['power', 'organizational politics'], [4]],
			MIDTERM,
			['วัฒนธรรมองค์การภาครัฐ', 'วัฒนธรรมราชการไทย', ['organizational culture'], [4]],
			['การเปลี่ยนแปลงองค์การและการปฏิรูประบบราชการ', 'แรงต้านการเปลี่ยนแปลงและการจัดการ', ['organizational change', 'bureaucratic reform'], [4]],
			['เครือข่ายและการบริหารปกครองร่วม', 'การทำงานข้ามหน่วยงานและข้ามภาคส่วน', ['networks', 'collaborative governance'], [1]],
			['การจัดการภาครัฐแนวใหม่และหลังการจัดการภาครัฐแนวใหม่', 'ผลต่อโครงสร้างองค์การภาครัฐ', ['new public management', 'post-NPM'], [2]],
			['องค์การสาธารณะในยุคดิจิทัล', 'การบริหารปกครองยุคดิจิทัล', ['digital era governance'], []],
			['กรณีศึกษา: การปรับโครงสร้างหน่วยงานภาครัฐไทย', 'วิเคราะห์ด้วยทฤษฎีที่เรียน', ['case study', 'restructuring'], [4], { activity: 'ส่งบทวิเคราะห์ทฤษฎี' }],
			['นำเสนอบทวิเคราะห์ทฤษฎี', 'คนละ 7 นาที', [], [], { activity: 'การนำเสนอ' }],
			['สรุปรายวิชาและทบทวนก่อนสอบปลายภาค', '', [], []]
		],
		evals: [
			['การมีส่วนร่วมในการสัมมนา', 'participation', 10, true, null],
			['บันทึกการอ่าน', 'reflection', 15, true, null, 'บันทึกสั้น 6 ครั้ง ครั้งละ 1 หน้า'],
			['สอบกลางภาค', 'midterm_exam', 25, true, 8, ''],
			['บทวิเคราะห์ทฤษฎีกับกรณีศึกษา', 'paper', 20, true, 14, 'ดูรายละเอียดในงานที่มอบหมาย'],
			['สอบปลายภาค', 'final_exam', 30, true, null, '']
		],
		readings: [
			{ cite: 'Shafritz, J. M., Ott, J. S., & Jang, Y. S. (2016). Classics of organization theory (8th ed.). Cengage Learning.', title: 'Classics of Organization Theory', authors: 'Jay M. Shafritz, J. Steven Ott, Yong Suk Jang', year: 2016, type: 'book', required: true },
			R.shafritzHyde,
			{ cite: 'Simon, H. A. (1946). The proverbs of administration. Public Administration Review, 6(1), 53–67.', title: 'The Proverbs of Administration', authors: 'Herbert A. Simon', year: 1946, type: 'article', required: false },
			{ cite: 'พิทยา บวรวัฒนา. ทฤษฎีองค์การสาธารณะ. สำนักพิมพ์แห่งจุฬาลงกรณ์มหาวิทยาลัย.', title: 'ทฤษฎีองค์การสาธารณะ', authors: 'พิทยา บวรวัฒนา', year: null, type: 'book', required: true }
		],
		work: [
			{
				title: 'บทวิเคราะห์ทฤษฎีองค์การกับกรณีหน่วยงานภาครัฐไทย',
				type: 'paper',
				description: 'เลือกทฤษฎีองค์การ 2 ทฤษฎี และใช้อธิบายการเปลี่ยนแปลงของหน่วยงานภาครัฐไทย 1 แห่ง',
				deliverable: 'บทความ 8–10 หน้า',
				due: 14,
				evalNo: 4,
				hours: 15
			},
			{
				title: 'บันทึกการอ่าน',
				type: 'reading_response',
				description: 'สรุปและตั้งคำถามจากเอกสารที่มอบหมาย',
				deliverable: 'บันทึก 1 หน้า ส่งก่อนเข้าชั้น',
				due: null,
				evalNo: 2,
				hours: 1.5
			}
		]
	})
};
