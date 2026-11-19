import { error } from '@sveltejs/kit';
import { courseLevel, courseStatusFor, curriculumFor, staffBadges, statusLabel, TRACKS, type CurriculumId } from '$lib/domain/curriculum';
import { hoursPerWeek } from '$lib/domain/workload';
import { t } from '$lib/i18n/th';
import { courseVersions, courses, curriculumRows, defaultSemester, listing, publishedSummaries, sectionsFor, semesters } from '$lib/server/student';
import type { Card } from '$lib/view-types';
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ locals, url }) => {
	const sb = locals.supabase;
	const profile = locals.profile!;
	const all = await semesters(sb);
	const asked = url.searchParams.get('semester');
	const semester = (asked && all.find((s) => s.id === asked)) || (await defaultSemester(sb, all));
	if (!semester) error(404, t.common.notFound);

	const [catalog, rows, list] = await Promise.all([courses(sb), curriculumRows(sb), listing(sb, semester.id)]);
	const { data: offs } = await sb.from('offerings').select('id, course_code, status, published_revision').eq('semester_id', semester.id).eq('status', 'published');
	const published = ((offs ?? []) as { id: string; course_code: string; status: string; published_revision: number | null }[]).map((o) => ({ ...o, course_code: o.course_code.trim() }));
	const [sections, summaries] = await Promise.all([sectionsFor(sb, published.map((o) => o.id)), publishedSummaries(sb, published)]);

	// whose badges: a student with a cohort sees their own curriculum; everyone else sees both (spec 04)
	const own = profile.role === 'student' && profile.cohort != null ? curriculumFor(profile.cohort) : null;
	const curricula: CurriculumId[] = own ? [own.id] : ['polsci-2564', 'polsci-2569'];

	const cards: Card[] = [];
	for (const entry of list) {
		const course = catalog.get(entry.course_code);
		if (!course || !course.managed_here) continue;
		const off = published.find((o) => o.course_code === entry.course_code);
		const secs = off ? (sections.get(off.id) ?? []) : [];
		const sum = off ? summaries.get(off.id) : undefined;
		const statuses = curricula.map((c) => courseStatusFor(course.code, c, own ? profile.major : 'PA', rows, course.department));
		const meetings = secs.flatMap((s) => s.meetings).sort((a, b) => a.weekday - b.weekday || a.starts_at.localeCompare(b.starts_at));
		cards.push({
			code: course.code,
			offeringId: off?.id ?? null,
			name_th: course.name_th,
			name_en: course.name_en,
			credit_format: course.credit_format,
			level: courseLevel(course.code),
			published: !!off,
			badges: own ? [statusLabel(statuses[0])] : staffBadges(course.code, rows, course.department),
			statusKinds: [...new Set(statuses.map((s) => s.kind))],
			trackIds: [...new Set(statuses.flatMap((s) => s.tracks.map((x) => x.id)))],
			sectionCount: secs.length,
			firstMeeting: meetings[0] ?? null,
			weekdays: [...new Set(meetings.map((m) => m.weekday))],
			languages: [...new Set(secs.map((s) => s.language))],
			instructors: [...new Set(secs.flatMap((s) => s.instructors.map((i) => i.name_th ?? '')))].filter(Boolean),
			evalItems: (sum?.evalItems ?? []).map((e) => ({ type: e.type, weight: e.weightPercent, title: e.title })),
			gradingScheme: sum?.gradingScheme ?? null,
			hours: sum ? hoursPerWeek({ overview: sum.overview }, course.credit_format) : null,
			keywords: sum?.overview.keywords ?? [],
			lastPublished: null
		});
	}

	// unpublished courses link to their last published semester (spec 04 R1)
	await Promise.all(
		cards
			.filter((c) => !c.published)
			.map(async (c) => {
				const v = (await courseVersions(sb, c.code)).find((x) => x.semester_id !== semester.id);
				if (v) c.lastPublished = { semesterId: v.semester_id, label: v.semester.label };
			})
	);

	return {
		semesters: all,
		semester,
		cards,
		tracks: TRACKS,
		curriculumNotice: own?.notice ?? false
	};
};
