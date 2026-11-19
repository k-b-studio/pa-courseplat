/**
 * Against the real shared project (npm run test:db):
 *   spec 03 AC 7 — an existing creditGPAX-style student gets a student profile; creditGPAX's put_plan
 *                  still refuses demo and staff accounts.
 *   spec 02 AC 9 — deleting a user with PA CoursePlat rows succeeds through the Admin API and through
 *                  creditGPAX's own delete_my_account(); notes keep an empty author.
 *
 * Test accounts are listed in courseplat.demo_accounts while they exist (the sign-up hook needs it,
 * and scripts only ever touch demo-listed users: spec 02 rule 6). The student address uses cohort 00,
 * which no real Chula student ID has.
 */
import { randomBytes } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const TEST_STUDENT = '0000000024@student.chula.ac.th';
const TEST_PROF = 'p1-test.prof@courseplat.test';
const STAFF = 'onuma.j@courseplat.test';

const url = process.env.PUBLIC_SUPABASE_URL!;
const publishable = process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
const sql = postgres(process.env.SUPABASE_DB_URL!, { prepare: false, max: 1, onnotice: () => {} });
const password = () => 'T-' + randomBytes(18).toString('base64url');

async function userId(email: string) {
	const r = await sql<{ id: string }[]>`select id from auth.users where lower(email) = ${email}`;
	return r[0]?.id ?? null;
}

async function listDemo(email: string, role: 'student' | 'instructor') {
	await sql`insert into courseplat.demo_accounts (email, role, label_th) values (${email}, ${role}, 'บัญชีทดสอบอัตโนมัติ') on conflict (email) do nothing`;
}

/** Remove a test account completely; only ever for addresses listed above. */
async function removeTestAccount(email: string) {
	const id = await userId(email);
	if (id) {
		await listDemo(email, 'student');
		const { error } = await admin.auth.admin.deleteUser(id);
		if (error) throw error;
	}
	await sql`delete from courseplat.demo_accounts where email = ${email}`;
}

async function signedIn(email: string, pw: string): Promise<SupabaseClient<any, 'courseplat'>> {
	const c = createClient<any, 'courseplat'>(url, publishable, { auth: { persistSession: false, autoRefreshToken: false }, db: { schema: 'courseplat' } });
	const { error } = await c.auth.signInWithPassword({ email, password: pw });
	if (error) throw error;
	return c;
}

beforeAll(async () => {
	await removeTestAccount(TEST_STUDENT);
	await removeTestAccount(TEST_PROF);
});

afterAll(async () => {
	await sql`delete from courseplat.course_notes where body like '[test:db]%'`;
	await sql`delete from courseplat.extractions where error = '[test:db]'`;
	await removeTestAccount(TEST_STUDENT);
	await removeTestAccount(TEST_PROF);
	await sql.end();
});

describe('spec 03 AC 7 — creditGPAX users and creditGPAX data', () => {
	it('an existing PolSci student without a profile gets a student profile on sign-in', async () => {
		const pw = password();
		await listDemo(TEST_STUDENT, 'student');
		const { data, error } = await admin.auth.admin.createUser({ email: TEST_STUDENT, password: pw, email_confirm: true });
		expect(error).toBeNull();
		// from here it is an ordinary student account, as if it came from creditGPAX
		await sql`delete from courseplat.demo_accounts where email = ${TEST_STUDENT}`;
		expect(await sql`select 1 from courseplat.profiles where id = ${data.user!.id}`).toHaveLength(0);

		const c = await signedIn(TEST_STUDENT, pw);
		const p = await c.rpc('ensure_profile');
		expect(p.error).toBeNull();
		expect(p.data).toMatchObject({ role: 'student', cohort: 0, major: null, is_demo: false });
	});

	it("creditGPAX's put_plan refuses demo and staff accounts", async () => {
		const staff = await signedIn(STAFF, process.env.DEMO_ACCOUNT_PASSWORD!);
		const r = await staff.schema('public').rpc('put_plan', { p_doc: { format: 'creditgpax-sync' }, p_base_revision: 0 });
		expect(r.error?.code).toBe('42501');
		expect(r.error?.message).toMatch(/PolSci/);
		const g = await staff.schema('public').rpc('grade_state');
		expect(g.error?.code).toBe('42501');
	});
});

describe('spec 02 AC 9 — deleting a user never fails because of PA CoursePlat rows', () => {
	it('Admin API deletion of a user with notes, an extraction and a section assignment', async () => {
		const pw = password();
		await listDemo(TEST_PROF, 'instructor');
		const { data } = await admin.auth.admin.createUser({ email: TEST_PROF, password: pw, email_confirm: true });
		const id = data.user!.id;
		const c = await signedIn(TEST_PROF, pw);
		expect((await c.rpc('ensure_profile')).error).toBeNull();

		const [{ offering_id, section_id }] = await sql`
			select o.id as offering_id, s.id as section_id from courseplat.offerings o join courseplat.sections s on s.offering_id = o.id
			 where o.course_code = '2404429' and o.semester_id = '2569-2' limit 1`;
		const [note] = await sql`insert into courseplat.course_notes (course_code, author_id, body) values ('2404429', ${id}, '[test:db] note') returning id`;
		const [ex] = await sql`insert into courseplat.extractions (offering_id, created_by, source_kind, status, error) values (${offering_id}, ${id}, 'text', 'failed', '[test:db]') returning id`;
		await sql`insert into courseplat.section_instructors (section_id, profile_id, role) values (${section_id}, ${id}, 'co')`;

		const del = await admin.auth.admin.deleteUser(id);
		expect(del.error).toBeNull();
		expect(await userId(TEST_PROF)).toBeNull();
		expect((await sql`select author_id from courseplat.course_notes where id = ${note.id}`)[0].author_id).toBeNull();
		expect((await sql`select created_by from courseplat.extractions where id = ${ex.id}`)[0].created_by).toBeNull();
		expect(await sql`select 1 from courseplat.section_instructors where profile_id = ${id}`).toHaveLength(0);
	});

	it("creditGPAX's delete_my_account() works for a user with a PA CoursePlat profile and note", async () => {
		// the AC 7 student still exists and has a profile; give them a note, then let them delete themselves
		const id = (await userId(TEST_STUDENT))!;
		expect(id).toBeTruthy();
		const pw = password();
		await listDemo(TEST_STUDENT, 'student');
		await admin.auth.admin.updateUserById(id, { password: pw });
		const [note] = await sql`insert into courseplat.course_notes (course_code, author_id, body) values ('2404324', ${id}, '[test:db] note 2') returning id`;

		const c = await signedIn(TEST_STUDENT, pw);
		const r = await c.schema('public').rpc('delete_my_account');
		expect(r.error).toBeNull();
		expect(await userId(TEST_STUDENT)).toBeNull();
		expect(await sql`select 1 from courseplat.profiles where id = ${id}`).toHaveLength(0);
		expect((await sql`select author_id from courseplat.course_notes where id = ${note.id}`)[0].author_id).toBeNull();
	});
});
