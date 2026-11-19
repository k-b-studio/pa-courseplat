/**
 * Migrations, functions and RLS against PGlite (spec 02 AC 1, 3, 4, 5, rule 5; spec 03 AC 3).
 * The same checks run against the real project in tests/db once credentials exist.
 */
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { as, asAuthAdmin, freshDb, pgliteAdapter, type TestUser } from '../support/pglite';
import { readMigrations, runMigrations } from '../../scripts/lib/migrations';

const example = JSON.parse(readFileSync('data/examples/2404324-2569-2.json', 'utf-8'));

let db: PGlite;
const A: TestUser = { id: '00000000-0000-4000-8000-00000000000a', email: 'thanakrit.w@courseplat.test' };
const B: TestUser = { id: '00000000-0000-4000-8000-00000000000b', email: 'natthida.k@courseplat.test' };
const S: TestUser = { id: '00000000-0000-4000-8000-00000000005f', email: 'onuma.j@courseplat.test' };
const ST: TestUser = { id: '00000000-0000-4000-8000-000000000057', email: 'student.pa67@courseplat.test' };
const O324 = '10000000-0000-4000-8000-000000000324';
const O429 = '10000000-0000-4000-8000-000000000429';

async function q<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
	return (await db.query<T>(sql, params)).rows;
}

beforeAll(async () => {
	db = await freshDb();
	await db.exec(`
		insert into courseplat.demo_accounts (email, role, cohort, major, label_th) values
		  ('${A.email}', 'instructor', null, null, 'อ.A'), ('${B.email}', 'instructor', null, null, 'อ.B'),
		  ('${S.email}', 'staff', null, null, 'เจ้าหน้าที่'), ('${ST.email}', 'student', 67, 'PA', 'นิสิตตัวอย่าง');
		insert into courseplat.staff_directory (email, role, title_th, name_th, name_en) values
		  ('${A.email}', 'instructor', 'ผศ.ดร.', 'ธนกฤต วงศ์ประเสริฐ', 'Thanakrit Wongprasert'),
		  ('${B.email}', 'instructor', 'อ.ดร.', 'ณัฐธิดา แก้วมณี', 'Natthida Kaewmanee'),
		  ('${S.email}', 'staff', 'คุณ', 'อรอุมา ใจงาม', 'Onuma Jaingam');
		insert into auth.users (id, email) values ('${A.id}', '${A.email}'), ('${B.id}', '${B.email}'), ('${S.id}', '${S.email}'), ('${ST.id}', '${ST.email}');
		insert into courseplat.courses (code, name_th, name_en, credits, credit_format, level, department) values
		  ('2404324', 'นโยบายสาธารณะ', 'Public Policy', 3, '3 (3-0-6)', 3, 'PA'),
		  ('2404429', 'การวิเคราะห์นโยบายสาธารณะชั้นสูง', 'Advanced Public Policy Analysis', 3, '3 (3-0-6)', 4, 'PA');
		insert into courseplat.semesters (id, label, year_be, term, starts_on, status) values
		  ('2568-2', '2/2568', 2568, 2, '2026-01-12', 'archived'), ('2569-2', '2/2569', 2569, 2, '2027-01-11', 'upcoming');
		insert into courseplat.offerings (id, course_code, semester_id) values ('${O324}', '2404324', '2569-2'), ('${O429}', '2404429', '2569-2');
	`);
	for (const u of [A, B, S, ST]) await as(db, u, (tx) => tx.query('select courseplat.ensure_profile()'));
	await db.exec(`
		insert into courseplat.sections (id, offering_id, section_no) values
		  ('20000000-0000-4000-8000-000000000324', '${O324}', 1), ('20000000-0000-4000-8000-000000000429', '${O429}', 1);
		insert into courseplat.section_instructors (section_id, profile_id) values
		  ('20000000-0000-4000-8000-000000000324', '${A.id}'), ('20000000-0000-4000-8000-000000000429', '${B.id}');
		insert into courseplat.section_meetings (section_id, weekday, starts_at, ends_at, room) values
		  ('20000000-0000-4000-8000-000000000324', 2, '09:30', '12:30', 'ห้อง 301 (ตัวอย่าง)');
	`);
});

describe('migrations (spec 02 AC 1)', () => {
	it('a second run applies nothing', async () => {
		const applied = await runMigrations(pgliteAdapter(db), readMigrations());
		expect(applied).toEqual([]);
	});
	it('adds exactly one object to public: the shared hook', async () => {
		const fns = await q<{ proname: string }>(`select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'`);
		expect(fns.map((f) => f.proname)).toEqual(['shared_before_user_created']);
		const tables = await q(`select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public'`);
		expect(tables).toEqual([]);
	});
});

describe('sign-up hook (spec 03 AC 3)', () => {
	const hook = (email: string, provider: string) =>
		asAuthAdmin(db, async (tx) => {
			const r = await tx.query<{ r: Record<string, unknown> }>('select public.shared_before_user_created($1::jsonb) as r', [
				JSON.stringify({ metadata: { name: 'before-user-created' }, user: { email, app_metadata: { provider } } })
			]);
			return r.rows[0].r;
		});
	it('Google + PolSci student passes (creditGPAX rule)', async () => expect(await hook('6712345624@student.chula.ac.th', 'google')).toEqual({}));
	it('Google + chula staff passes', async () => expect(await hook('somchai.j@chula.ac.th', 'google')).toEqual({}));
	it('Google + gmail fails', async () => expect((await hook('someone@gmail.com', 'google')).error).toMatchObject({ http_code: 403 }));
	it('Google + other faculty student fails', async () => expect((await hook('6712345621@student.chula.ac.th', 'google')).error).toBeDefined());
	it('Google + lookalike domain fails', async () => expect((await hook('x@chula.ac.th.evil.com', 'google')).error).toBeDefined());
	it('email + demo account passes', async () => expect(await hook('student.pa67@courseplat.test', 'email')).toEqual({}));
	it('email + chula address fails', async () => expect((await hook('somchai.j@chula.ac.th', 'email')).error).toBeDefined());
	it('the refusal keeps the word PolSci for creditGPAX', async () =>
		expect(JSON.stringify(await hook('a@b.com', 'github'))).toContain('PolSci'));
	it('anon and authenticated cannot call the hook', async () => {
		await expect(as(db, ST, (tx) => tx.query(`select public.shared_before_user_created('{}'::jsonb)`))).rejects.toThrow(/permission denied/);
	});
});

describe('profiles (spec 03 R3, R4)', () => {
	it('ensure_profile gives demo and directory roles', async () => {
		const rows = await q<{ email: string; role: string; cohort: number | null; major: string | null; is_demo: boolean; name_th: string }>(
			'select email, role, cohort, major, is_demo, name_th from courseplat.profiles order by email'
		);
		expect(rows.find((r) => r.email === ST.email)).toMatchObject({ role: 'student', cohort: 67, major: 'PA', is_demo: true });
		expect(rows.find((r) => r.email === A.email)).toMatchObject({ role: 'instructor', name_th: 'ธนกฤต วงศ์ประเสริฐ' });
		expect(rows.find((r) => r.email === S.email)?.role).toBe('staff');
	});
	it('a PolSci address with no profile becomes a student with its cohort', async () => {
		const u: TestUser = { id: '00000000-0000-4000-8000-0000000000c1', email: '6700000024@student.chula.ac.th', provider: 'google' };
		await db.query('insert into auth.users (id, email) values ($1, $2)', [u.id, u.email]);
		const p = await as(db, u, async (tx) => (await tx.query<{ role: string; cohort: number }>('select role, cohort from courseplat.ensure_profile()')).rows[0]);
		expect(p).toMatchObject({ role: 'student', cohort: 67 });
		await db.query('delete from auth.users where id = $1', [u.id]);
	});
	it('a chula address outside the directory becomes viewer; the directory promotes and demotes', async () => {
		const u: TestUser = { id: '00000000-0000-4000-8000-0000000000c2', email: 'somchai.j@chula.ac.th', provider: 'google' };
		await db.query('insert into auth.users (id, email) values ($1, $2)', [u.id, u.email]);
		await as(db, u, (tx) => tx.query('select courseplat.ensure_profile()'));
		const role = async () => (await q<{ role: string }>('select role from courseplat.profiles where id = $1', [u.id]))[0].role;
		expect(await role()).toBe('viewer');
		await as(db, S, (tx) => tx.query(`insert into courseplat.staff_directory (email, role) values ($1, 'staff')`, [u.email]));
		expect(await role()).toBe('staff');
		await as(db, S, (tx) => tx.query('delete from courseplat.staff_directory where email = $1', [u.email]));
		expect(await role()).toBe('viewer');
		await db.query('delete from auth.users where id = $1', [u.id]);
	});
	it('students cannot read other students or the directory', async () => {
		const rows = await as(db, ST, async (tx) => (await tx.query<{ role: string }>('select role from courseplat.profiles')).rows);
		expect(rows.filter((r) => r.role === 'student')).toHaveLength(1);
		const dir = await as(db, ST, async (tx) => (await tx.query('select * from courseplat.staff_directory')).rows);
		expect(dir).toHaveLength(0);
	});
});

describe('save_syllabus and RLS (spec 02 AC 3, 4)', () => {
	it('instructor B cannot save on an offering they are not assigned to', async () => {
		await expect(as(db, B, (tx) => tx.query('select courseplat.save_syllabus($1, $2::jsonb, 0)', [O324, JSON.stringify(example)]))).rejects.toThrow(
			/forbidden/
		);
	});

	it('the second of two saves with the same expected revision raises revision_conflict', async () => {
		const rev = await as(db, A, async (tx) => (await tx.query<{ r: number }>('select courseplat.save_syllabus($1, $2::jsonb, 0) as r', [O324, JSON.stringify(example)])).rows[0].r);
		expect(rev).toBe(1);
		await expect(as(db, A, (tx) => tx.query('select courseplat.save_syllabus($1, $2::jsonb, 0)', [O324, JSON.stringify(example)]))).rejects.toThrow(
			/revision_conflict/
		);
		const [o] = await q<{ status: string; revision: number }>('select status, revision from courseplat.offerings where id = $1', [O324]);
		expect(o).toEqual({ status: 'draft', revision: 1 });
	});

	it('after saving the example: 15 topics, 5 readings, 2 assignments, 4 objectives (AC 4)', async () => {
		const rows = await q<{ kind: string; n: number }>('select kind::text, count(*)::int as n from courseplat.syllabus_items where offering_id = $1 group by kind', [O324]);
		expect(Object.fromEntries(rows.map((r) => [r.kind, r.n]))).toEqual({ topic: 15, reading: 5, assignment: 2, objective: 4 });
		const [w4] = await q<{ text: string; concepts: string[]; content_hash: string }>(
			`select text, concepts, content_hash from courseplat.syllabus_items where offering_id = $1 and ref = 'weeklyPlan:4'`,
			[O324]
		);
		expect(w4.text).toMatch(/^ตัวแบบกระบวนการนโยบาย \(Stages model \/ Policy cycle\) — /);
		expect(w4.concepts).toEqual(['policy cycle', 'stages heuristic']);
		const [dye] = await q<{ norm_key: string }>(`select norm_key from courseplat.syllabus_items where offering_id = $1 and ref = 'readings:r-1'`, [O324]);
		expect(dye.norm_key).toBe('isbn:9780134169972|t:understandingpublicpolicy');
	});

	it('a student cannot select a draft offering, syllabus_items or content_cautions', async () => {
		const r = await as(db, ST, async (tx) => ({
			offerings: (await tx.query('select id from courseplat.offerings where id = $1', [O324])).rows.length,
			items: (await tx.query('select id from courseplat.syllabus_items')).rows.length,
			cautions: (await tx.query('select id from courseplat.content_cautions')).rows.length
		}));
		expect(r).toEqual({ offerings: 0, items: 0, cautions: 0 });
	});

	it('nobody selects the working syllabus column directly; editors use get_offering_syllabi', async () => {
		await expect(as(db, A, (tx) => tx.query('select syllabus from courseplat.offerings where id = $1', [O324]))).rejects.toThrow(/permission denied/);
		const mine = await as(db, A, async (tx) => (await tx.query('select id from courseplat.get_offering_syllabi($1::uuid[])', [[O324, O429]])).rows);
		expect(mine).toHaveLength(1);
	});

	it('anon sees nothing', async () => {
		const r = await as(db, null, async (tx) => (await tx.query('select code from courseplat.courses')).rows);
		expect(r).toHaveLength(0);
	});
});

describe('publish, clone (spec 02 AC 5; spec 05 AC 7)', () => {
	it('publish creates exactly one offering_versions row with the sections snapshot', async () => {
		await as(db, A, (tx) => tx.query('select courseplat.publish_offering($1, 1)', [O324]));
		await as(db, A, (tx) => tx.query('select courseplat.publish_offering($1, 1)', [O324])); // idempotent
		const v = await q<{ revision: number; s: { sectionNo: number; instructors: { nameTh: string }[]; meetings: { startsAt: string }[] }[] }>(
			'select revision, sections_snapshot as s from courseplat.offering_versions where offering_id = $1',
			[O324]
		);
		expect(v).toHaveLength(1);
		expect(v[0].s[0]).toMatchObject({ sectionNo: 1, instructors: [{ nameTh: 'ธนกฤต วงศ์ประเสริฐ' }], meetings: [{ startsAt: '09:30' }] });
		const [o] = await q<{ status: string; published_revision: number }>('select status, published_revision from courseplat.offerings where id = $1', [O324]);
		expect(o).toEqual({ status: 'published', published_revision: 1 });
		const seen = await as(db, ST, async (tx) => (await tx.query('select id from courseplat.offerings where id = $1', [O324])).rows.length);
		expect(seen).toBe(1);
	});

	it('publish refuses weights that do not sum to 100', async () => {
		const bad = structuredClone(example);
		bad.evaluation.items[0].weightPercent = 5;
		await as(db, B, (tx) => tx.query('select courseplat.save_syllabus($1, $2::jsonb, 0)', [O429, JSON.stringify(bad)]));
		await expect(as(db, B, (tx) => tx.query('select courseplat.publish_offering($1, 1)', [O429]))).rejects.toThrow(/weights_not_100/);
	});

	it('clone copies a published version and clears dates and instructors', async () => {
		const [ver] = await q<{ id: string }>('select id from courseplat.offering_versions where offering_id = $1', [O324]);
		// a different course's version is refused
		await expect(as(db, B, (tx) => tx.query('select courseplat.clone_offering($1, $2)', [O429, ver.id]))).rejects.toThrow(/source_not_found/);
		// same course, earlier semester
		const O324old = '10000000-0000-4000-8000-000000002568';
		await db.query(`insert into courseplat.offerings (id, course_code, semester_id) values ($1, '2404324', '2568-2')`, [O324old]);
		await db.query(`insert into courseplat.sections (offering_id, section_no) values ($1, 1)`, [O324old]);
		const withDates = structuredClone(example);
		withDates.keyDates[0].date = '2026-03-02';
		await as(db, S, (tx) => tx.query('select courseplat.save_syllabus($1, $2::jsonb, 0)', [O324old, JSON.stringify(withDates)]));
		await as(db, S, (tx) => tx.query('select courseplat.publish_offering($1, 1)', [O324old]));
		const [old] = await q<{ id: string }>('select id from courseplat.offering_versions where offering_id = $1', [O324old]);
		await as(db, A, (tx) => tx.query('select courseplat.clone_offering($1, $2)', [O324, old.id]));
		const [doc] = await as(db, A, async (tx) => (await tx.query<{ syllabus: typeof example }>('select syllabus from courseplat.get_offering_syllabi($1::uuid[])', [[O324]])).rows);
		expect(doc.syllabus.keyDates.every((k: { date: unknown }) => k.date === null)).toBe(true);
		expect(doc.syllabus.weeklyPlan.every((w: { instructorIds: unknown[] }) => w.instructorIds.length === 0)).toBe(true);
	});
});

describe('deleting a user never fails (spec 02 rule 5, AC 9)', () => {
	it('comments, notes, extractions and section assignments do not block deletion', async () => {
		const u: TestUser = { id: '00000000-0000-4000-8000-0000000000d1', email: 'pending.prof@courseplat.test' };
		await db.exec(`
			insert into courseplat.demo_accounts (email, role, label_th) values ('${u.email}', 'instructor', 'ทดสอบ');
			insert into courseplat.staff_directory (email, role, name_th) values ('${u.email}', 'instructor', 'อาจารย์ทดสอบ');
			insert into courseplat.section_instructors (section_id, pending_email) values ('20000000-0000-4000-8000-000000000429', '${u.email}');
			insert into auth.users (id, email) values ('${u.id}', '${u.email}');`);
		await as(db, u, (tx) => tx.query('select courseplat.ensure_profile()'));
		// pending assignment linked on first sign-in: can edit at once (spec 07 AC 5)
		expect(await as(db, u, async (tx) => (await tx.query<{ ok: boolean }>('select courseplat.can_edit_offering($1) as ok', [O429])).rows[0].ok)).toBe(true);
		await db.exec(`
			insert into courseplat.course_notes (course_code, author_id, body) values ('2404429', '${u.id}', 'บันทึกทดสอบ');
			insert into courseplat.extractions (offering_id, created_by, source_kind, status) values ('${O429}', '${u.id}', 'text', 'succeeded');
			insert into courseplat.content_cautions (pair_key, a_offering_id, a_ref, a_label, b_offering_id, b_ref, b_label, kind, relation, severity, similarity, reason_th, source, a_hash, b_hash)
			  values ('t|x|y', '${O324}', 'a', 'a', '${O429}', 'b', 'b', 'topic', 'related', 'info', 0.7, 'r', 'rule', 'h', 'h');
			insert into courseplat.caution_comments (caution_id, author_id, body) select id, '${u.id}', 'ความเห็น' from courseplat.content_cautions where pair_key = 't|x|y';`);
		await db.query('delete from auth.users where id = $1', [u.id]);
		const left = await q<{ n: number; c: number; note_author: string | null }>(`
			select (select count(*)::int from courseplat.section_instructors where profile_id = '${u.id}') as n,
			       (select count(*)::int from courseplat.caution_comments where author_id is null) as c,
			       (select author_id from courseplat.course_notes where body = 'บันทึกทดสอบ') as note_author`);
		expect(left[0]).toEqual({ n: 0, c: 1, note_author: null });
	});
});

describe('offering listing (0005, spec 04 R1 and AC 9)', () => {
	it('students see that an unpublished offering exists, and its status, but not the offering row', async () => {
		const listed = await as(db, ST, async (tx) => (await tx.query<{ course_code: string; status: string }>(`select course_code, status from courseplat.offering_listing('2569-2')`)).rows);
		expect(listed.map((r) => r.course_code.trim()).sort()).toEqual(['2404324', '2404429']);
		const visible = await as(db, ST, async (tx) => (await tx.query(`select id from courseplat.offerings where id = '${O429}'`)).rows);
		const status = listed.find((r) => r.course_code.trim() === '2404429')!.status;
		if (status !== 'published') expect(visible).toHaveLength(0);
	});
	it('anon cannot call it', async () => {
		await expect(as(db, null, (tx) => tx.query(`select * from courseplat.offering_listing('2569-2')`))).rejects.toThrow();
	});
});

describe('items in TypeScript match rebuild_syllabus_items (spec 06)', () => {
	it('same refs, texts and content hashes for the example syllabus', async () => {
		const { itemsFromDoc } = await import('../../src/lib/domain/items');
		await db.exec(`update courseplat.offerings set syllabus = '${JSON.stringify(example).replace(/'/g, "''")}'::jsonb where id = '${O324}'; select courseplat.rebuild_syllabus_items('${O324}');`);
		const sql = await q<{ ref: string; text: string; content_hash: string }>(`select ref, text, content_hash from courseplat.syllabus_items where offering_id = '${O324}' order by ref`);
		const ts = itemsFromDoc(example).map((i) => ({ ref: i.ref, text: i.text, content_hash: i.contentHash })).sort((a, b) => a.ref.localeCompare(b.ref));
		expect(ts).toEqual(sql);
	});
});
