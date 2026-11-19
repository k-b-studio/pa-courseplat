<script lang="ts">
	import { appPath } from '$lib/paths';
	import Icon from '$lib/components/Icon.svelte';
	import { t, thaiDate } from '$lib/i18n/th';
	import type { CourseInfo } from '$lib/view-types';

	let { course, semesterLabel, badges, editedAt = null }: { course: CourseInfo; semesterLabel: string; badges: string[]; editedAt?: string | null } = $props();
</script>

<header class="relative overflow-hidden rounded-[var(--radius-card)] bg-night px-5 py-6 text-white shadow-[var(--shadow-card)] sm:px-8 sm:py-8">
	<div class="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-brand-600/35 blur-3xl" aria-hidden="true"></div>
	<div class="relative grid gap-2">
		<p class="flex flex-wrap items-center gap-1 text-sm text-night-muted">
			<a class="underline decoration-white/30 underline-offset-2 hover:text-white" href={appPath('/courses')}>{t.nav.courses}</a>
			<Icon name="chevron_right" size={16} />
			{course.code} · {semesterLabel}
		</p>
		<h1 class="text-2xl leading-snug font-semibold tracking-tight sm:text-3xl">
			<span class="mr-1 rounded-lg bg-brand-600 px-2 py-0.5 align-[0.1em] font-heading text-[0.7em] font-medium tracking-wide">{course.code}</span>
			{course.name_th}
		</h1>
		<p class="text-night-muted" lang="en">{course.name_en} · {course.credit_format}</p>
		<div class="mt-1 flex flex-wrap items-center gap-1.5">
			{#each badges as b (b)}<span class="chip border-white/15 bg-white/10 text-xs text-white" data-testid="status-badge">{b}</span>{/each}
			{#each course.prerequisite_codes as p (p)}
				<a class="chip border-brand-300/40 bg-brand-600/30 text-xs text-white hover:bg-brand-600/50" href={appPath(`/courses/${p}`)}>{t.course.prerequisites} {p}</a>
			{/each}
			{#if editedAt}<span class="text-xs text-night-muted">{t.course.lastEdited} {thaiDate(editedAt)}</span>{/if}
		</div>
	</div>
</header>
