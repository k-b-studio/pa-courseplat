import { error, redirect } from '@sveltejs/kit';
import { t } from '$lib/i18n/th';
import { courseVersions, defaultSemester, semesters } from '$lib/server/student';
import type { PageServerLoad } from './$types';

/** /courses/[code] → the default semester's offering, else the latest published one (spec 04 R2). */
export const load: PageServerLoad = async ({ params, locals }) => {
	if (!/^\d{7}$/.test(params.code)) error(404, t.common.notFound);
	const sb = locals.supabase;
	const all = await semesters(sb);
	const def = await defaultSemester(sb, all);
	const versions = await courseVersions(sb, params.code);
	const target = versions.find((v) => v.semester_id === def?.id)?.semester_id ?? versions[0]?.semester_id ?? def?.id;
	if (!target) error(404, t.common.notFound);
	redirect(303, `/courses/${params.code}/${target}`);
};
