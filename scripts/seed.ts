/**
 * npm run seed — load the demo into an empty courseplat schema; safe to re-run (spec 08 R1).
 *
 * Order (spec 08 "Scripts"): catalog → semesters → demo_accounts → staff_directory → demo users
 * (Admin API, email_confirm: true; the shared sign-up hook lets them in because demo_accounts
 * is seeded first) → profiles (ensure_profile, run as each user) → offerings, sections,
 * instructors, meetings → syllabi (save_syllabus / publish_offering, run as the coordinator).
 * → handover notes → seeded cautions (fixtures/cautions/seed-2569-2.json).
 *
 * Shared project (spec 02 rule 6): writes only schema courseplat and auth users whose email is
 * in courseplat.demo_accounts. Prints counts of rows changed; a second run prints zeros.
 *
 * Flags: --reset-passwords  set every demo user's password to DEMO_ACCOUNT_PASSWORD again.
 */
import { readFileSync } from 'node:fs';
import offeringsJson from '../fixtures/offerings.json';
import peopleJson from '../fixtures/people.json';
import syllabusIndex from '../fixtures/syllabi/index.json';
import notesJson from '../fixtures/notes.json';
import seedCautions from '../fixtures/cautions/seed-2569-2.json';
import { itemLabel, itemsFromDoc } from '../src/lib/domain/items';
import { canonical, pairKey } from '../src/lib/server/cautions/severity';
import type { SyllabusDoc } from '../src/lib/schema/syllabus';
import { adminClient, demoPassword } from './lib/admin';
import { coursePloRows, courseRows, curriculumCourseRows, curriculumRows, ploRows } from './lib/catalog';
import { asUser, upsert, type Tx } from './lib/db-helpers';
import { connect, dbUrl, describeUrl } from './lib/pg';

type Person = (typeof peopleJson.people)[number] & { cohort?: number; major?: string; office?: string; office_hours?: string; contact_note?: string };
type SectionFx = { no: number; language: string; capacity: number; note?: string; instructors: string[]; meetings: { weekday: number; start: string; end: string; room: string; mode?: string }[] };
type OfferingFx = { course: string; coordinator: string; sections: SectionFx[] };

const people = peopleJson.people as Person[];
const resetPasswords = process.argv.includes('--reset-passwords');
const url = dbUrl();
const sql = connect(url);
const admin = adminClient();
const changes: Record<string, number> = {};
const count = (k: string, n: number) => (changes[k] = (changes[k] ?? 0) + n);

console.log(`seed → ${describeUrl(url)}`);

try {
	// 1. catalog (real data) ------------------------------------------------------------------
	await sql.begin(async (tx) => {
		count('courses', (await upsert(tx, 'courses', courseRows(), ['code'], '1')).length);
		count('curricula', (await upsert(tx, 'curricula', curriculumRows(), ['id'], '1')).length);
		count('plos', (await upsert(tx, 'plos', ploRows(), ['code'], '1')).length);
		count('curriculum_courses', (await upsert(tx, 'curriculum_courses', curriculumCourseRows(), ['curriculum_id', 'course_code', 'major', 'category', 'track'], '1')).length);
		count('course_plos', (await upsert(tx, 'course_plos', coursePloRows(), ['course_code', 'plo_code'], '1')).length);
	});

	// 2. semesters ----------------------------------------------------------------------------
	await sql.begin(async (tx) => {
		count('semesters', (await upsert(tx, 'semesters', offeringsJson.semesters, ['id'], '1')).length);
	});

	// 3. demo_accounts before any demo user exists (the sign-up hook reads it) -----------------
	const label = (p: Person) => `${p.title_th ?? ''}${p.name_th}`;
	await sql.begin(async (tx) => {
		const rows = people.map((p) => ({ email: p.email, role: p.role, cohort: p.cohort ?? null, major: p.major ?? null, label_th: label(p) }));
		count('demo_accounts', (await upsert(tx, 'demo_accounts', rows, ['email'], '1')).length);
		const staff = people.filter((p) => p.role === 'instructor' || p.role === 'staff');
		const dir = staff.map((p) => ({ email: p.email, role: p.role, title_th: p.title_th, name_th: p.name_th, name_en: p.name_en }));
		count('staff_directory', (await upsert(tx, 'staff_directory', dir, ['email'], '1')).length);
	});

	// 4. demo users (Admin API) — looked up only by demo emails, never listing other users ------
	const emails = people.map((p) => p.email);
	const ids = new Map<string, string>();
	for (const r of await sql<{ id: string; email: string }[]>`select id, lower(email) as email from auth.users where lower(email) = any(${emails})`) ids.set(r.email, r.id);
	const password = demoPassword();
	for (const p of people) {
		const existing = ids.get(p.email);
		if (existing) {
			if (resetPasswords) {
				const { error } = await admin.auth.admin.updateUserById(existing, { password });
				if (error) throw new Error(`reset password ${p.email}: ${error.message}`);
				count('demo_passwords_reset', 1);
			}
			continue;
		}
		const { data, error } = await admin.auth.admin.createUser({ email: p.email, password, email_confirm: true, user_metadata: { demo: true } });
		if (error || !data.user) throw new Error(`create ${p.email}: ${error?.message ?? 'no user returned'}`);
		ids.set(p.email, data.user.id);
		count('demo_users', 1);
	}

	// 5. profiles: the same ensure_profile() the app calls on first sign-in --------------------
	const haveProfile = new Set((await sql<{ email: string }[]>`select email from courseplat.profiles where email = any(${emails})`).map((r) => r.email));
	for (const p of people) {
		if (haveProfile.has(p.email)) continue;
		await asUser(sql, { id: ids.get(p.email)!, email: p.email }, (tx) => tx`select courseplat.ensure_profile()`);
		count('profiles', 1);
	}
	await sql.begin(async (tx) => {
		for (const p of people.filter((x) => x.office)) {
			const r = await tx`
				update courseplat.profiles set office = ${p.office!}, office_hours = ${p.office_hours ?? null}, contact_note = ${p.contact_note ?? null}
				 where email = ${p.email}
				   and (office, office_hours, contact_note) is distinct from (${p.office!}::text, ${p.office_hours ?? null}::text, ${p.contact_note ?? null}::text)
				returning 1`;
			count('profile_details', r.length);
		}
	});
	const profileId = new Map<string, string>();
	for (const r of await sql<{ id: string; email: string }[]>`select id, email from courseplat.profiles where email = any(${emails})`) profileId.set(r.email, r.id);
	const byKey = (key: string) => {
		const p = people.find((x) => x.key === key);
		const id = p && profileId.get(p.email);
		if (!id) throw new Error(`unknown person ${key}`);
		return id;
	};

	// 6. offerings, sections, instructors, meetings (fictional) --------------------------------
	for (const [semesterId, list] of Object.entries(offeringsJson.offerings as Record<string, OfferingFx[]>)) {
		await sql.begin(async (tx) => {
			for (const o of list) await seedOffering(tx, semesterId, o, byKey);
		});
	}

	// 7. syllabi through save_syllabus / publish_offering, run as the coordinator (same path as the app) ---
	const coordinatorOf = new Map<string, { id: string; email: string }>();
	for (const [semesterId, list] of Object.entries(offeringsJson.offerings as Record<string, OfferingFx[]>))
		for (const o of list) {
			const p = people.find((x) => x.key === o.coordinator)!;
			coordinatorOf.set(`${semesterId}|${o.course}`, { id: byKey(o.coordinator), email: p.email });
		}
	const keyToId = (doc: SyllabusDoc): SyllabusDoc => ({
		...doc,
		weeklyPlan: doc.weeklyPlan.map((w) => ({ ...w, instructorIds: w.instructorIds.map((k) => (k.startsWith('@') ? byKey(k) : k)) }))
	});
	for (const [semesterId, codes] of Object.entries(syllabusIndex as Record<string, Record<string, 'published' | 'draft'>>)) {
		for (const [code, want] of Object.entries(codes)) {
			const doc = keyToId(JSON.parse(readFileSync(`fixtures/syllabi/${semesterId}/${code}.json`, 'utf-8')));
			const [o] = await sql<{ id: string; revision: number; status: string; published_revision: number | null; same: boolean }[]>`
				select id, revision, status::text, published_revision, coalesce(syllabus = ${doc as never}::jsonb, false) as same
				  from courseplat.offerings where course_code = ${code} and semester_id = ${semesterId}`;
			if (!o) throw new Error(`no offering ${code} ${semesterId}`);
			const upToDate = o.same && (want === 'draft' ? o.status === 'draft' : o.status === 'published' && o.published_revision === o.revision);
			if (upToDate) continue;
			await asUser(sql, coordinatorOf.get(`${semesterId}|${code}`)!, async (tx) => {
				let rev = o.revision;
				if (!o.same) [{ rev }] = await tx<{ rev: number }[]>`select courseplat.save_syllabus(${o.id}, ${doc as never}::jsonb, ${o.revision}) as rev`;
				if (want === 'published') await tx`select courseplat.publish_offering(${o.id}, ${rev})`;
			});
			count(want === 'published' ? 'syllabi_published' : 'syllabi_saved', 1);
		}
	}

	// 8. plausible fixed dates instead of "today" (edited and published before each semester starts) ------
	await sql.begin(async (tx) => {
		const dated = await tx`
			with d as (
				select o.id,
				       (s.starts_on - case s.status when 'upcoming' then 70 else 21 end
				                    + (abs(hashtext(o.course_code)) % 14))::timestamptz + interval '10 hours' as edited
				  from courseplat.offerings o join courseplat.semesters s on s.id = o.semester_id
				 where o.revision > 0)
			update courseplat.offerings o
			   set updated_at = d.edited,
			       published_at = case when o.status = 'published' then d.edited + interval '2 hours' else o.published_at end
			  from d
			 where o.id = d.id
			   and (o.updated_at, o.published_at) is distinct from (d.edited, case when o.status = 'published' then d.edited + interval '2 hours' else o.published_at end)
			returning 1`;
		const versions = await tx`
			update courseplat.offering_versions v set published_at = o.published_at
			  from courseplat.offerings o
			 where o.id = v.offering_id and v.revision = o.published_revision and v.published_at is distinct from o.published_at
			returning 1`;
		count('dates', dated.length + versions.length);
	});

	// 9. handover notes (spec 08), matched by course, semester and text --------------------------------
	await sql.begin(async (tx) => {
		for (const n of notesJson.notes) {
			const r = await tx`
				insert into courseplat.course_notes (course_code, semester_id, author_id, body, created_at)
				select ${n.course}, ${n.semester}, ${byKey(n.author)}, ${n.body}, ${n.created_at}::timestamptz
				 where not exists (select 1 from courseplat.course_notes where course_code = ${n.course} and semester_id = ${n.semester} and body = ${n.body})
				returning 1`;
			count('notes', r.length);
		}
	});

	// 10. seeded cautions (spec 08), inserted once by pair_key ------------------------------------------
	await sql.begin(async (tx) => {
		const sem = seedCautions.semester;
		const offs = await tx<{ id: string; course_code: string }[]>`select id, course_code from courseplat.offerings where semester_id = ${sem}`;
		const offId = (c: string) => offs.find((o) => o.course_code.trim() === c)!.id;
		const itemOf = (c: string, ref: string) => {
			const doc = JSON.parse(readFileSync(`fixtures/syllabi/${sem}/${c}.json`, 'utf-8')) as SyllabusDoc;
			const it = itemsFromDoc(doc).find((i) => i.ref === ref);
			if (!it) throw new Error(`seed caution: ${c} ${ref} not found`);
			return it;
		};
		for (const c of seedCautions.cautions) {
			const sa = { code: c.a.course, semester: sem, ref: c.a.ref, item: itemOf(c.a.course, c.a.ref) };
			const sb = { code: c.b.course, semester: sem, ref: c.b.ref, item: itemOf(c.b.course, c.b.ref) };
			const [a, b] = canonical(sa, sb);
			const key = pairKey(c.kind as 'topic', a, b);
			const resolved = c.status !== 'open';
			const by = 'resolvedBy' in c && c.resolvedBy ? byKey(c.resolvedBy) : null;
			const r = await tx`
				insert into courseplat.content_cautions
				  (pair_key, semester_id, a_offering_id, a_ref, a_label, a_hash, b_offering_id, b_ref, b_label, b_hash, kind, relation, severity, similarity,
				   reason_th, suggestion_th, source, status, resolved_by, resolved_at, resolution_note, created_at, updated_at)
				values (${key}, ${sem}, ${offId(a.code)}, ${a.ref}, ${itemLabel(a.code, a.item)}, ${a.item.contentHash}, ${offId(b.code)}, ${b.ref}, ${itemLabel(b.code, b.item)}, ${b.item.contentHash},
				        ${c.kind}::courseplat.caution_kind, ${c.relation}::courseplat.caution_relation, ${c.severity}::courseplat.caution_severity, ${c.similarity},
				        ${c.reasonTH}, ${c.suggestionTH}, 'seed', ${c.status}::courseplat.caution_status, ${by}, ${resolved ? '2026-11-12T14:00:00+07:00' : null}::timestamptz,
				        ${'resolutionNote' in c ? (c.resolutionNote ?? null) : null}, '2026-11-10T09:00:00+07:00', ${resolved ? '2026-11-12T14:00:00+07:00' : '2026-11-10T09:00:00+07:00'}::timestamptz)
				on conflict (pair_key) do nothing
				returning id`;
			if (r.length && resolved) await tx`insert into courseplat.caution_events (caution_id, actor_id, status, relation, note, created_at) values (${r[0].id}, ${by}, ${c.status}::courseplat.caution_status, ${c.relation}::courseplat.caution_relation, ${'resolutionNote' in c ? (c.resolutionNote ?? null) : null}, '2026-11-12T14:00:00+07:00')`;
			count('cautions', r.length);
		}
	});

	const changed = Object.entries(changes).filter(([, n]) => n > 0);
	console.log(changed.length ? `changed: ${changed.map(([k, n]) => `${k} ${n}`).join(', ')}` : 'nothing to change (already seeded)');
} finally {
	await sql.end();
}

async function seedOffering(tx: Tx, semesterId: string, o: OfferingFx, byKey: (k: string) => string) {
	const coordinator = byKey(o.coordinator);
	count('offerings', (await upsert(tx, 'offerings', [{ course_code: o.course, semester_id: semesterId, coordinator_id: coordinator }], ['course_code', 'semester_id'], '1')).length);
	const [{ id: offeringId }] = await tx<{ id: string }[]>`select id from courseplat.offerings where course_code = ${o.course} and semester_id = ${semesterId}`;

	const sectionRows = o.sections.map((s) => ({ offering_id: offeringId, section_no: s.no, language: s.language, capacity: s.capacity, note: s.note ?? '' }));
	count('sections', (await upsert(tx, 'sections', sectionRows, ['offering_id', 'section_no'], '1')).length);
	const sections = await tx<{ id: string; section_no: number }[]>`select id, section_no from courseplat.sections where offering_id = ${offeringId}`;

	for (const s of o.sections) {
		const sectionId = sections.find((x) => x.section_no === s.no)!.id;

		// instructors: first is lead, the rest co-teach; remove seeded people no longer listed
		const want = s.instructors.map((k, i) => ({ profile_id: byKey(k), role: i === 0 ? 'lead' : 'co' }));
		const have = await tx<{ id: string; profile_id: string | null; role: string }[]>`select id, profile_id, role from courseplat.section_instructors where section_id = ${sectionId}`;
		for (const h of have) {
			const w = want.find((x) => x.profile_id === h.profile_id);
			if (!w) {
				await tx`delete from courseplat.section_instructors where id = ${h.id}`;
				count('section_instructors', 1);
			} else if (w.role !== h.role) {
				await tx`update courseplat.section_instructors set role = ${w.role} where id = ${h.id}`;
				count('section_instructors', 1);
			}
		}
		for (const w of want.filter((x) => !have.some((h) => h.profile_id === x.profile_id))) {
			await tx`insert into courseplat.section_instructors (section_id, profile_id, role) values (${sectionId}, ${w.profile_id}, ${w.role})`;
			count('section_instructors', 1);
		}

		// meetings, matched by weekday and times
		const wantM = s.meetings.map((m) => ({ weekday: m.weekday, starts_at: `${m.start}:00`, ends_at: `${m.end}:00`, room: m.room, mode: m.mode ?? 'onsite' }));
		const haveM = await tx<{ id: string; weekday: number; starts_at: string; ends_at: string; room: string; mode: string }[]>`
			select id, weekday, starts_at::text, ends_at::text, room, mode from courseplat.section_meetings where section_id = ${sectionId}`;
		const same = (a: { weekday: number; starts_at: string; ends_at: string }, b: typeof a) => a.weekday === b.weekday && a.starts_at === b.starts_at && a.ends_at === b.ends_at;
		for (const h of haveM) {
			const w = wantM.find((x) => same(x, h));
			if (!w) {
				await tx`delete from courseplat.section_meetings where id = ${h.id}`;
				count('section_meetings', 1);
			} else if (w.room !== h.room || w.mode !== h.mode) {
				await tx`update courseplat.section_meetings set room = ${w.room}, mode = ${w.mode} where id = ${h.id}`;
				count('section_meetings', 1);
			}
		}
		for (const w of wantM.filter((x) => !haveM.some((h) => same(x, h)))) {
			await tx`insert into courseplat.section_meetings (section_id, weekday, starts_at, ends_at, room, mode) values (${sectionId}, ${w.weekday}, ${w.starts_at}, ${w.ends_at}, ${w.room}, ${w.mode})`;
			count('section_meetings', 1);
		}
	}
}
