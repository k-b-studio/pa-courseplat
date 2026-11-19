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
		menu: 'เมนู',
		/** the header's label for a signed-in account with no Thai name yet (Kim, 2026-11-19) */
		account: 'Account'
	},

	roles: { student: 'นิสิต', viewer: 'ผู้เยี่ยมชม', instructor: 'อาจารย์', staff: 'เจ้าหน้าที่' } as Record<string, string>,

	auth: {
		signInChula: 'เข้าสู่ระบบด้วยบัญชีจุฬาฯ',
		signInHint: 'ใช้บัญชี Google ของจุฬาฯ: นิสิตคณะรัฐศาสตร์ (…24@student.chula.ac.th) หรือบุคลากร (@chula.ac.th)',
		demoPanel: 'บัญชีตัวอย่างสำหรับการสาธิต',
		demoPanelHint: 'บุคคลและประมวลรายวิชาทั้งหมดเป็นข้อมูลสมมติ',
		signInTitle: 'เข้าสู่ระบบ',
		/** what each demo account shows, on the landing page */
		demoWhat: {
			student: 'ค้นหาและเปรียบเทียบรายวิชา ดูแผนที่หลักสูตร',
			'prof-natthida': 'นำเข้าประมวลรายวิชาด้วย AI แล้วตรวจความทับซ้อน',
			'prof-thanakrit': 'รับข้อควรระวังและประสานงานกับผู้สอนอีกวิชา',
			staff: 'ภาพรวมทั้งภาควิชาและข้อควรระวังทุกรายวิชา'
		} as Record<string, string>,
		features: [
			{ title: 'ประมวลรายวิชารูปแบบเดียวกัน', body: 'เก้าหัวข้อครบทุกวิชา นิสิตอ่านง่ายบนโทรศัพท์' },
			{ title: 'นำเข้าด้วย AI', body: 'จาก .docx, PDF หรือภาพถ่าย ตรวจทานก่อนเผยแพร่' },
			{ title: 'ข้อควรระวังด้านเนื้อหา', body: 'เห็นหัวข้อและงานที่ซ้ำกับวิชาอื่นก่อนเปิดภาค' }
		],
		errorTitle: 'เข้าสู่ระบบไม่สำเร็จ',
		refused: 'อีเมลนี้ใช้เข้าระบบไม่ได้ ระบบรองรับเฉพาะนิสิตคณะรัฐศาสตร์ (…24@student.chula.ac.th) และบุคลากรจุฬาฯ (@chula.ac.th)',
		genericError: 'เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ โปรดลองอีกครั้ง',
		backHome: 'กลับหน้าแรก',
		viewerBanner:
			'บัญชีของคุณยังไม่มีสิทธิ์แก้ไขรายวิชา หากคุณเป็นอาจารย์ในภาควิชารัฐประศาสนศาสตร์ โปรดติดต่อเจ้าหน้าที่ภาควิชาเพื่อเพิ่มอีเมลของคุณในระบบ',
		wrongRole: 'หน้านี้สำหรับอาจารย์และเจ้าหน้าที่ภาควิชาเท่านั้น',
		staffOnly: 'หน้านี้สำหรับเจ้าหน้าที่ภาควิชาเท่านั้น',
		forbidden: 'คุณไม่มีสิทธิ์แก้ไขรายวิชานี้',
		or: 'หรือ',
		signedInAs: 'เข้าสู่ระบบในชื่อ',
		demoFailed: 'เข้าสู่ระบบด้วยบัญชีตัวอย่างไม่สำเร็จ โปรดตรวจว่าได้รันคำสั่ง seed แล้ว',
		profileError: 'สร้างโปรไฟล์ผู้ใช้ไม่สำเร็จ โปรดลองเข้าสู่ระบบอีกครั้ง',
		cancelled: 'ยกเลิกการเข้าสู่ระบบแล้ว',
		landingLead:
			'ประมวลรายวิชาทุกภาคการศึกษาในรูปแบบเดียวกัน นิสิตอ่านง่ายบนโทรศัพท์ อาจารย์นำเข้าจากไฟล์เดิมได้ด้วย AI และเห็นเนื้อหาที่ซ้ำซ้อนกับรายวิชาอื่นก่อนเปิดภาค',
		demoLabel: (role: string) => `เข้าสู่ระบบเป็น${role}`
	},

	flash: {
		wrongRole: 'หน้านี้สำหรับอาจารย์และเจ้าหน้าที่ภาควิชาเท่านั้น',
		staffOnly: 'หน้านี้สำหรับเจ้าหน้าที่ภาควิชาเท่านั้น',
		signedOut: 'ออกจากระบบแล้ว',
		saved: 'บันทึกแล้ว'
	} as Record<string, string>,

	profile: {
		title: 'โปรไฟล์',
		email: 'อีเมล',
		role: 'บทบาท',
		cohort: 'รุ่น',
		major: 'สาขาวิชา',
		titleTh: 'คำนำหน้า / ตำแหน่งทางวิชาการ',
		nameTh: 'ชื่อ–นามสกุล (ไทย)',
		nameEn: 'ชื่อ–นามสกุล (อังกฤษ)',
		office: 'ห้องทำงาน',
		officeHours: 'เวลาให้คำปรึกษา',
		contactNote: 'ช่องทางติดต่อ',
		contactHint: 'แสดงในหน้ารายวิชาของนิสิต ไม่ต้องใส่เบอร์โทรศัพท์ส่วนตัว'
	},

	course: {
		semester: 'ภาคการศึกษา',
		hours: 'ภาระงานนอกชั้นเรียน',
		su: 'ประเมินผลแบบ S/U',
		addCompare: 'เพิ่มเพื่อเปรียบเทียบ',
		inCompare: 'อยู่ในรายการเปรียบเทียบ',
		compareTray: 'รายการเปรียบเทียบ',
		notPublished: 'ยังไม่เผยแพร่ประมวลรายวิชา',
		notPublishedLead: 'รายวิชานี้เปิดสอนในภาคการศึกษานี้ แต่ผู้สอนยังไม่เผยแพร่ประมวลรายวิชา',
		notOffered: 'รายวิชานี้ไม่ได้เปิดสอนในภาคการศึกษานี้',
		lastPublished: (label: string) => `ดูประมวลรายวิชาภาค ${label}`,
		filters: 'ตัวกรอง',
		search: 'ค้นหารหัส ชื่อวิชา หรือคำสำคัญ',
		myStatus: 'สถานะของรายวิชาสำหรับฉัน',
		track: 'กลุ่มวิชา',
		level: 'ชั้นปี',
		levelN: (n: number) => `ชั้นปี ${n}`,
		weekday: 'วันเรียน',
		language: 'ภาษา',
		publishedOnly: 'มีประมวลรายวิชาแล้ว',
		clearFilters: 'ล้างตัวกรอง',
		results: (n: number) => `${n} รายวิชา`,
		noResults: 'ไม่พบรายวิชาตามตัวกรอง',
		curriculumNotice: 'รุ่นของคุณเข้าศึกษาก่อนหลักสูตร 2564 ระบบจึงแสดงสถานะตามหลักสูตร 2564',
		lastEdited: 'แก้ไขล่าสุด',
		prerequisites: 'ต้องเรียนก่อน',
		atGlance: 'สรุปรายวิชา',
		methods: 'วิธีการสอน',
		delivery: 'รูปแบบการเรียน',
		meetings: 'วันและเวลาเรียน',
		keyExams: 'สอบ',
		aiPolicy: 'การใช้ AI',
		topItems: 'คะแนนหลัก',
		officialDescription: 'คำอธิบายรายวิชาตามหลักสูตร',
		focus: 'จุดเน้นภาคการศึกษานี้',
		keywords: 'คำสำคัญ',
		prerequisiteNote: 'ข้อแนะนำก่อนลงทะเบียน',
		attendance: 'การเข้าชั้นเรียน',
		lateWork: 'การส่งงานล่าช้า',
		item: 'รายการ',
		type: 'ประเภท',
		weight: 'น้ำหนัก',
		who: 'เดี่ยว/กลุ่ม',
		individual: 'เดี่ยว',
		group: 'กลุ่ม',
		dueWeek: 'กำหนดส่ง',
		cutoffs: 'เกณฑ์การตัดเกรด',
		referencing: 'การตัดเกรด',
		required: 'เอกสารบังคับ',
		recommended: 'เอกสารแนะนำ',
		materials: 'สื่อประกอบการเรียน',
		platforms: 'ช่องทางออนไลน์',
		deliverable: 'สิ่งที่ต้องส่ง',
		groupSize: 'จำนวนสมาชิก',
		estimatedHours: 'เวลาโดยประมาณ',
		hoursN: (n: number) => `ประมาณ ${n} ชั่วโมง`,
		officeHours: 'เวลาให้คำปรึกษา',
		office: 'ห้องทำงาน',
		contact: 'การติดต่อ',
		teachesSections: 'สอนตอนเรียน',
		leadsWeeks: 'สอนสัปดาห์ที่',
		weeklyGrid: 'ตารางเรียนรายสัปดาห์',
		plan: 'แผนการสอนรายสัปดาห์',
		keyDates: 'วันสำคัญ',
		exam: 'สอบ',
		noClass: 'ไม่มีการเรียนการสอน',
		capacity: 'จำนวนรับ',
		instructors: 'ผู้สอน',
		note: 'หมายเหตุ',
		related: 'รายวิชาที่เกี่ยวข้อง',
		requires: 'ต้องเรียนก่อน',
		buildsFor: 'เป็นพื้นฐานของ',
		noRelated: 'ไม่มีรายวิชาที่กำหนดเป็นวิชาบังคับก่อน',
		pastVersions: 'ภาคการศึกษาก่อนหน้า',
		pastVersionNote: (label: string) => `ประมวลรายวิชาฉบับที่เผยแพร่ในภาค ${label} (อ่านอย่างเดียว)`,
		readingLink: 'เปิดลิงก์',
		weekOf: 'สัปดาห์',
		date: 'วันที่',
		topic: 'หัวข้อ',
		activity: 'กิจกรรม',
		readings: 'เอกสาร',
		ploTitle: 'ผลลัพธ์การเรียนรู้ระดับหลักสูตร',
		sectionNav: 'ไปยังหัวข้อ',
		finalsColumn: 'ช่วงสอบปลายภาค',
		undated: 'คะแนนต่อเนื่องตลอดภาค'
	},

	compare: {
		title: 'เปรียบเทียบรายวิชา',
		lead: 'เลือกได้สูงสุด 3 รายวิชาจากหน้ารายวิชา',
		empty: 'ยังไม่ได้เลือกรายวิชา เลือกจากหน้ารายวิชาโดยกด "เพิ่มเพื่อเปรียบเทียบ"',
		sharedTopics: 'หัวข้อที่เกี่ยวข้องกัน',
		sharedReading: 'เอกสารที่ใช้ร่วมกัน',
		clash: 'เวลาเรียนชนกัน',
		heatmap: 'ภาระคะแนนรายสัปดาห์',
		heatmapLead: 'น้ำหนักคะแนนที่ครบกำหนดในแต่ละสัปดาห์ สัปดาห์ที่รวมกันตั้งแต่ 40% ขึ้นไปมีกรอบเน้น',
		total: 'รวม',
		heavyNote: (weeks: string) => `สัปดาห์ที่ ${weeks} มีคะแนนครบกำหนดรวมกันตั้งแต่ 40% ขึ้นไป`,
		tableView: 'ดูเป็นตาราง',
		chartView: 'ดูเป็นแผนภาพ',
		cell: (course: string, week: number, pct: number, items: string) => `${course} สัปดาห์ที่ ${week}: ${pct}%${items ? ` (${items})` : ''}`,
		workload: 'ภาระงาน',
		work: 'งานที่มอบหมาย',
		unpublished: 'ยังไม่เผยแพร่'
	},

	curriculum: {
		mapTab: 'แผนที่ผลลัพธ์การเรียนรู้ (PLO)',
		reqTab: 'โครงสร้างหลักสูตร PA',
		legend: '● หลักสูตรกำหนดเป็นรายวิชาตัวอย่างของ PLO นั้น · ◐ ประมวลรายวิชาที่เผยแพร่ในภาคการศึกษานี้มี CLO เชื่อมกับ PLO นั้น',
		official: 'หลักสูตรกำหนด',
		covered: 'มี CLO เชื่อมในภาคนี้',
		footer: (label: string) => `จำนวนรายวิชาที่เผยแพร่ในภาค ${label} ที่เชื่อมกับ PLO`,
		curriculumTitle: (year: string) => `หลักสูตร ${year}`,
		facultyCore: 'วิชาบังคับคณะ',
		facultyNote: 'แสดงเฉพาะรายวิชาที่ภาควิชารัฐประศาสนศาสตร์ดูแล',
		majorRequired: 'วิชาบังคับสาขา PA',
		trackElective: 'วิชาเลือกกลุ่ม',
		requiredElective: 'วิชาเลือกที่ต้องเรียน',
		notOffered: 'ไม่เปิดในภาคนี้'
	},

	editor: {
		saving: 'กำลังบันทึก…',
		saved: (time: string) => `บันทึกแล้ว ${time}`,
		unsaved: 'มีการแก้ไขที่ยังไม่บันทึก',
		saveFailed: 'บันทึกไม่สำเร็จ โปรดลองอีกครั้ง',
		invalid: 'ข้อมูลไม่ถูกต้อง',
		noDoc: 'ยังไม่มีประมวลรายวิชา',
		notReady: 'ยังเผยแพร่ไม่ได้ โปรดแก้รายการในแถบตรวจความพร้อม',
		publishFailed: 'เผยแพร่ไม่สำเร็จ',
		noteInvalid: 'บันทึกต้องมี 1–4,000 ตัวอักษร',
		preview: 'ดูตัวอย่างแบบนิสิต',
		backToForm: 'กลับไปแก้ไข',
		publish: 'เผยแพร่',
		republish: 'เผยแพร่ฉบับแก้ไข',
		unpublish: 'ยกเลิกการเผยแพร่',
		published: 'เผยแพร่แล้ว',
		publishedNote: 'นิสิตเห็นฉบับที่เผยแพร่ล่าสุด การแก้ไขหลังจากนั้นจะเห็นเมื่อกดเผยแพร่อีกครั้ง',
		readiness: 'ตรวจความพร้อมก่อนเผยแพร่',
		ready: 'พร้อมเผยแพร่',
		issuesN: (n: number) => `ต้องแก้ ${n} รายการ`,
		conflictTitle: 'มีผู้แก้ไขฉบับนี้หลังจากคุณเปิด',
		conflictLead: 'ส่วนที่ต่างจากฉบับล่าสุดในระบบ:',
		loadLatest: 'โหลดฉบับล่าสุด',
		overwrite: 'บันทึกทับ',
		overwriteConfirm: 'ยืนยันบันทึกทับ? การแก้ไขของอีกฝ่ายในส่วนข้างต้นจะหายไป',
		catalogNote: 'ชื่อวิชา หน่วยกิต และคำอธิบายรายวิชาตามหลักสูตร เจ้าหน้าที่ภาควิชาเป็นผู้ดูแล',
		focusHint: 'อย่างน้อย 40 ตัวอักษร: ภาคการศึกษานี้เน้นอะไร ต่างจากภาคก่อนอย่างไร',
		language: 'ภาษาที่ใช้สอน',
		delivery: 'รูปแบบการเรียน',
		hours: 'ภาระงานนอกชั้นเรียน (ชั่วโมง/สัปดาห์)',
		keywords: 'คำสำคัญ (ไม่เกิน 10 คำ)',
		tagHint: 'พิมพ์แล้วกด Enter',
		prerequisiteNote: 'ข้อแนะนำก่อนลงทะเบียน',
		addObjective: 'เพิ่มวัตถุประสงค์',
		objective: (n: number) => `CLO ${n}`,
		plos: 'เชื่อมกับ PLO',
		suggested: 'แนะนำตามหลักสูตร',
		aiSuggestion: 'ข้อเสนอจาก AI',
		remove: 'ลบ',
		moveUp: 'เลื่อนขึ้น',
		description: 'คำอธิบาย',
		attendance: 'การเข้าชั้นเรียน',
		aiPolicy: 'นโยบายการใช้ AI',
		aiNote: 'หมายเหตุนโยบาย AI',
		lateWork: 'การส่งงานล่าช้า',
		fill16: 'เติม 16 สัปดาห์',
		addWeek: 'เพิ่มสัปดาห์',
		week: 'สัปดาห์',
		topic: 'หัวข้อ',
		details: 'รายละเอียด',
		concepts: 'แท็กแนวคิด (ไม่เกิน 8)',
		instructors: 'ผู้สอน',
		readings: 'เอกสารประกอบ',
		activity: 'กิจกรรม',
		noClass: 'งดเรียน/สอบ',
		midterm: 'สอบกลางภาค',
		addEval: 'เพิ่มรายการประเมิน',
		total: (n: number) => `รวม ${n}%`,
		totalMust: 'ต้องครบ 100%',
		weight: 'น้ำหนัก (%)',
		individual: 'งานเดี่ยว',
		dueWeek: 'สัปดาห์กำหนดส่ง',
		none: 'ไม่ระบุ',
		gradingScheme: 'รูปแบบการตัดเกรด',
		referencing: 'การอิงเกณฑ์',
		cutoffs: 'เกณฑ์การตัดเกรด (คะแนนขั้นต่ำ)',
		addReading: 'เพิ่มเอกสาร',
		citation: 'รายการอ้างอิง (APA)',
		parseCitation: 'แยกข้อมูลจากรายการอ้างอิง',
		title: 'ชื่อเรื่อง',
		authors: 'ผู้แต่ง',
		year: 'ปี (ค.ศ.)',
		type: 'ประเภท',
		required: 'เอกสารบังคับ',
		materials: 'สื่อประกอบการเรียน (บรรทัดละ 1 รายการ)',
		platforms: 'ช่องทางออนไลน์',
		addPlatform: 'เพิ่มช่องทาง',
		name: 'ชื่อ',
		note: 'หมายเหตุ',
		addWork: 'เพิ่มงาน',
		workOptional: 'ไม่บังคับ: ส่วนนี้จะไม่แสดงต่อนิสิตถ้าไม่มีงาน',
		deliverable: 'สิ่งที่ต้องส่ง',
		groupSize: 'จำนวนสมาชิก (เช่น 3–4)',
		evalLink: 'เชื่อมกับรายการประเมิน',
		estimatedHours: 'เวลาโดยประมาณ (ชั่วโมง)',
		keyDates: 'วันสำคัญ',
		addKeyDate: 'เพิ่มวันสำคัญ',
		label: 'รายการ',
		date: 'วันที่',
		professorsNote: 'ผู้สอนแต่ละตอนเรียนกำหนดโดยเจ้าหน้าที่ภาควิชา ในแผนรายสัปดาห์ให้เลือกผู้สอนของแต่ละสัปดาห์',
		sectionsNote: 'คุณแก้ไขหมายเหตุและเวลาเรียนได้เฉพาะตอนเรียนที่คุณสอน การเพิ่มตอนเรียนและมอบหมายผู้สอนทำโดยเจ้าหน้าที่ภาควิชา',
		saveSection: 'บันทึกตอนเรียน',
		addMeeting: 'เพิ่มเวลาเรียน',
		room: 'ห้อง',
		mode: 'รูปแบบ',
		start: 'เริ่ม',
		end: 'สิ้นสุด',
		sectionSaved: 'บันทึกตอนเรียนแล้ว',
		sidebar: { notes: 'บันทึกส่งต่อ', history: 'ประวัติ', cautions: 'ข้อควรระวังด้านเนื้อหา', cautionsShort: 'ข้อควรระวัง' },
		addNote: 'เพิ่มบันทึกส่งต่อ',
		notePlaceholder: 'สิ่งที่อาจารย์ผู้สอนครั้งถัดไปควรรู้เกี่ยวกับรายวิชานี้',
		newNote: 'ใหม่',
		noNotes: 'ยังไม่มีบันทึกส่งต่อ',
		noHistory: 'ยังไม่มีฉบับที่เผยแพร่ในภาคการศึกษาก่อน',
		compareWith: 'เปรียบเทียบกับฉบับนี้',
		copyAsDraft: 'คัดลอกมาเป็นฉบับร่าง',
		copyConfirm: 'คัดลอกฉบับนี้มาแทนที่ฉบับร่างปัจจุบัน? (วันที่และผู้สอนรายสัปดาห์จะถูกล้าง)',
		noCautions: 'ยังไม่มีข้อควรระวังสำหรับรายวิชานี้',
		allCautions: 'ดูทั้งหมดในแดชบอร์ด',
		diffTitle: (label: string) => `เปรียบเทียบฉบับ ${label} กับฉบับนี้`,
		diffNone: 'ไม่มีความแตกต่างในส่วนหลัก',
		diffWeekAdded: (w: number, topic: string) => `เพิ่มสัปดาห์ที่ ${w}: ${topic}`,
		diffWeekRemoved: (w: number, topic: string) => `ลบสัปดาห์ที่ ${w}: ${topic}`,
		diffWeekChanged: (w: number) => `สัปดาห์ที่ ${w} เปลี่ยนหัวข้อ`,
		diffEvalChanged: (title: string, a: number, b: number) => `${title}: ${a}% → ${b}%`,
		diffEvalAdded: (title: string, w: number) => `เพิ่มรายการประเมิน ${title} ${w}%`,
		diffEvalRemoved: (title: string, w: number) => `ลบรายการประเมิน ${title} ${w}%`,
		diffReadingAdded: 'เอกสารที่เพิ่ม',
		diffReadingRemoved: 'เอกสารที่ลบ',
		diffObjectives: 'วัตถุประสงค์ที่เปลี่ยน',
		diffFocus: 'จุดเน้นภาคการศึกษาเปลี่ยน',
		startTitle: 'เริ่มทำประมวลรายวิชา',
		startUpload: 'อัปโหลดไฟล์',
		startPaste: 'วางข้อความ',
		startCopy: 'คัดลอกจากภาคการศึกษาก่อน',
		startBlank: 'เริ่มจากฟอร์มเปล่า',
		startUploadHint: 'Word, PDF หรือรูปถ่าย ระบบ AI ช่วยกรอกแบบฟอร์มให้',
		startCopyNone: 'ยังไม่มีฉบับที่เผยแพร่ของรายวิชานี้',
		dueIn: (n: number) => (n >= 0 ? `ส่งภายใน ${n} วัน` : `เลยกำหนด ${-n} วัน`),
		due: 'กำหนดส่งประมวลรายวิชา',
		lastEdited: 'แก้ไขล่าสุด',
		allOfferings: 'ทุกรายวิชา',
		filterSemester: 'ภาคการศึกษา',
		openCautions: 'ข้อควรระวังที่ยังเปิดอยู่'
	},

	importAi: {
		title: 'นำเข้าประมวลรายวิชาด้วย AI',
		fileTab: 'อัปโหลดไฟล์',
		textTab: 'วางข้อความ',
		dropHint: 'เลือกไฟล์ Word (.docx), PDF หรือรูปถ่ายประมวลรายวิชา (สูงสุด 15 MB)',
		choose: 'เลือกไฟล์',
		textHint: 'วางข้อความประมวลรายวิชา (ไม่เกิน 60,000 ตัวอักษร)',
		start: 'เริ่มนำเข้า',
		dataNotice: 'ไฟล์นี้จะถูกส่งไปประมวลผลด้วย Google Gemini (บริการแบบไม่เสียค่าใช้จ่าย) ซึ่ง Google อาจนำข้อมูลไปใช้พัฒนาบริการ โปรดอย่าอัปโหลดเอกสารที่มีข้อมูลส่วนบุคคลหรือข้อมูลลับ',
		offlineBanner: 'โหมดออฟไลน์: ระบบใช้ผลลัพธ์ตัวอย่างที่บันทึกไว้แทนการเรียก AI',
		offlineMissing: 'ขณะนี้ระบบ AI ทำงานแบบออฟไลน์ เอกสารนี้ไม่มีผลลัพธ์ตัวอย่าง — กรอกแบบฟอร์มด้วยตนเองได้ทันที',
		docRefused: 'โปรดบันทึกเป็น .docx หรือ PDF',
		unsupported: 'ระบบรองรับเฉพาะไฟล์ .docx, PDF, PNG, JPG และ WebP',
		tooLarge: 'ไฟล์มีขนาดเกิน 15 MB',
		tooManyPages: 'PDF ต้องมีไม่เกิน 30 หน้า',
		textTooLong: 'ข้อความยาวเกิน 60,000 ตัวอักษร',
		textEmpty: 'โปรดวางข้อความประมวลรายวิชา',
		tooLong: 'เอกสารยาวเกินไป',
		failed: 'อ่านเอกสารไม่สำเร็จ โปรดลองใหม่หรือกรอกแบบฟอร์มด้วยตนเอง',
		rateLimited: (n: number) => `คุณใช้ AI ครบ ${n} ครั้งในชั่วโมงนี้แล้ว โปรดลองใหม่ภายหลัง หรือกรอกแบบฟอร์มด้วยตนเอง`,
		uploadFailed: 'อัปโหลดไฟล์ไม่สำเร็จ',
		manualForm: 'กรอกแบบฟอร์มด้วยตนเอง',
		steps: ['อัปโหลดไฟล์', 'อ่านเอกสาร', 'จัดข้อมูลเข้าแบบฟอร์ม', 'ตรวจสอบความถูกต้อง'],
		elapsed: (s: number) => `ผ่านไป ${s} วินาที (โดยปกติ 20–60 วินาที)`,
		canLeave: 'ออกจากหน้านี้ได้ ผลลัพธ์จะแสดงในหน้ารายวิชาที่สอนเมื่อเสร็จ',
		reviewTitle: 'ตรวจทานข้อมูลที่ AI กรอกให้',
		original: 'ต้นฉบับ',
		confidence: { high: 'สูง', medium: 'ปานกลาง', low: 'ต่ำ', not_found: 'ไม่พบในเอกสาร' } as Record<string, string>,
		evidence: 'ดูข้อความต้นฉบับ',
		warnings: 'ข้อสังเกตจากการอ่านเอกสาร',
		hints: 'ข้อมูลตอนเรียนที่พบในเอกสาร',
		applyHint: 'ใช้กับตอนเรียนนี้',
		hintApplied: 'ปรับตอนเรียนแล้ว',
		hintInfo: 'ข้อมูลเพื่อทราบ (เจ้าหน้าที่หรือผู้สอนตอนเรียนนั้นเป็นผู้ปรับ)',
		accept: 'ยอมรับและไปที่แบบฟอร์ม',
		acceptTitle: 'มีฉบับร่างอยู่แล้ว',
		replaceAll: 'แทนที่ทั้งหมด',
		fillEmpty: 'เติมเฉพาะส่วนที่ยังว่าง',
		notPublished: 'ยังไม่มีการเผยแพร่ ข้อมูลจะเผยแพร่เมื่อคุณกดเผยแพร่ในแบบฟอร์มเท่านั้น',
		failedRow: 'การนำเข้าไม่สำเร็จ',
		running: 'กำลังนำเข้า',
		reviewLink: 'ตรวจทานผลการนำเข้า'
	},

	cautions: {
		title: 'ข้อควรระวังด้านเนื้อหา',
		lead: 'หัวข้อ เอกสาร และงานที่ซ้ำหรือใกล้เคียงกับรายวิชาอื่น ให้อาจารย์ตัดสินว่าตั้งใจให้ต่อยอดหรือควรปรับ',
		scopeAll: 'ทั้งภาควิชา',
		scopeMine: 'วิชาของฉัน',
		semester: 'ภาคการศึกษา',
		severity: { high: 'สูง', medium: 'กลาง', info: 'ข้อมูล' } as Record<string, string>,
		severityLong: { high: 'ระดับสูง', medium: 'ระดับกลาง', info: 'ข้อมูล' } as Record<string, string>,
		kind: { topic: 'หัวข้อ', reading: 'เอกสาร', assignment: 'งานที่มอบหมาย', objective: 'วัตถุประสงค์' } as Record<string, string>,
		relation: { duplicate: 'ซ้ำ', builds_on: 'ต่อยอด', related: 'เกี่ยวข้อง' } as Record<string, string>,
		status: { open: 'เปิดอยู่', intentional: 'ตั้งใจ', coordinating: 'กำลังประสานงาน', dismissed: 'ไม่เกี่ยวข้อง' } as Record<string, string>,
		tiles: { high: 'เปิดอยู่ ระดับสูง', medium: 'เปิดอยู่ ระดับกลาง', coordinating: 'กำลังประสานงาน', resolved: 'ตัดสินแล้ว' },
		filters: 'ตัวกรอง',
		showInfo: 'แสดงระดับข้อมูล',
		infoHidden: (n: number) => `info ${n} รายการถูกซ่อน`,
		showResolved: 'แสดงที่ตัดสินแล้ว',
		allKinds: 'ทุกประเภท',
		allCourses: 'ทุกรายวิชา',
		matrix: 'ความทับซ้อนระหว่างรายวิชา',
		matrixHint: 'แต่ละช่องคือจำนวนข้อควรระวังระหว่างสองวิชา สีตามระดับที่สูงที่สุด กดเพื่อกรองรายการ',
		byKind: 'แยกตามประเภท',
		list: 'รายการข้อควรระวัง',
		empty: 'ยังไม่มีข้อควรระวังสำหรับวิชาของคุณ',
		emptyFiltered: 'ไม่มีรายการตามตัวกรองนี้',
		comments: (n: number) => `${n} ความเห็น`,
		myCourses: 'วิชาของฉัน',
		openEditor: 'เปิดแบบฟอร์ม',
		clearPair: 'ล้างตัวกรองคู่วิชา',
		drawerThis: 'รายการในวิชานี้',
		drawerOther: 'รายการในอีกวิชา',
		similarity: 'ความใกล้เคียง',
		simWord: { veryHigh: 'สูงมาก', high: 'สูง', medium: 'ปานกลาง' },
		reason: 'เหตุผล',
		suggestion: 'ข้อเสนอแนะ',
		relationLabel: 'ความสัมพันธ์',
		intentional: 'ตั้งใจให้ต่อยอด',
		coordinate: 'ประสานงานกับผู้สอน',
		dismiss: 'ไม่เกี่ยวข้อง',
		notePlaceholder: 'หมายเหตุ (จำเป็นเมื่อเลือก "ไม่เกี่ยวข้อง")',
		noteRequired: 'โปรดระบุเหตุผลเมื่อเลือก "ไม่เกี่ยวข้อง"',
		otherInstructors: 'ผู้สอนอีกวิชา',
		thread: 'การสนทนา',
		commentPlaceholder: 'เขียนความเห็นถึงผู้สอนอีกวิชา',
		send: 'ส่ง',
		history: 'ประวัติการตัดสินใจ',
		system: 'ระบบ',
		close: 'ปิด',
		runCheck: 'ตรวจความทับซ้อน',
		running: 'กำลังตรวจความทับซ้อน…',
		runDone: (n: number) => `ตรวจเสร็จ พบ ${n} รายการ`,
		runFailed: 'ตรวจความทับซ้อนไม่สำเร็จ',
		aiFailed: 'ตรวจด้วย AI ไม่สำเร็จ แสดงเฉพาะผลการตรวจพื้นฐาน',
		markerTitle: (n: number) => `ข้อควรระวัง ${n} รายการ`,
		viewAll: 'ดูทั้งหมดในแดชบอร์ด',
		openCounts: (h: number, m: number) => `สูง ${h} · กลาง ${m}`,
		resolvedBy: 'ตัดสินโดย'
	},

	pending: {
		courses: 'รายการรายวิชาของภาคการศึกษาจะแสดงที่นี่',
		teach: 'รายวิชาที่คุณรับผิดชอบในภาคการศึกษาถัดไป',
		cautions: 'แดชบอร์ดข้อควรระวังด้านเนื้อหาจะแสดงที่นี่',
		admin: 'ภาพรวมความพร้อมของประมวลรายวิชาจะแสดงที่นี่',
		editor: 'แบบฟอร์มประมวลรายวิชา',
		noTeaching: 'ยังไม่มีรายวิชาที่คุณได้รับมอบหมายในภาคการศึกษานี้'
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

/**
 * The signed-in user's own name in the header. A real Chula account that is not in the staff directory has no Thai
 * name; personName() would call it a deleted user, which is only right for someone else's deleted account.
 */
export function selfName(p: { title_th?: string | null; name_th?: string | null } | null | undefined): string {
	return p?.name_th?.trim() ? personName(p) : t.nav.account;
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
