<script lang="ts">
	import { t, thaiDate } from '$lib/i18n/th';
	import type { CourseInfo } from '$lib/view-types';

	let { course, semesterLabel, badges, editedAt = null }: { course: CourseInfo; semesterLabel: string; badges: string[]; editedAt?: string | null } = $props();
</script>

<header class="grid gap-2">
	<p class="text-sm text-ink-muted"><a class="underline" href="/courses">{t.nav.courses}</a> / {course.code} · {semesterLabel}</p>
	<h1 class="text-2xl font-semibold leading-snug sm:text-3xl">{course.code} {course.name_th}</h1>
	<p class="text-ink-muted" lang="en">{course.name_en} · {course.credit_format}</p>
	<div class="flex flex-wrap items-center gap-1.5">
		{#each badges as b (b)}<span class="chip" data-testid="status-badge">{b}</span>{/each}
		{#each course.prerequisite_codes as p (p)}
			<a class="chip border border-line bg-surface hover:border-accent" href="/courses/{p}">{t.course.prerequisites} {p}</a>
		{/each}
		{#if editedAt}<span class="text-xs text-ink-muted">{t.course.lastEdited} {thaiDate(editedAt)}</span>{/if}
	</div>
</header>
