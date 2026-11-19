<script lang="ts">
	import { appPath } from '$lib/paths';
	import { goto } from '$app/navigation';
	import { initTray } from '$lib/compare-tray.svelte';
	import CompareTray from '$lib/components/CompareTray.svelte';
	import CourseCard from '$lib/components/CourseCard.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { STATUS_FILTERS } from '$lib/domain/curriculum';
	import { t } from '$lib/i18n/th';
	import { onMount } from 'svelte';

	let { data } = $props();

	let q = $state('');
	let status = $state('');
	let track = $state('');
	let level = $state('');
	let weekday = $state('');
	let language = $state('');
	let publishedOnly = $state(true);

	onMount(initTray);

	const norm = (s: string) => s.normalize('NFC').toLowerCase();
	const filtered = $derived(
		data.cards.filter((c) => {
			if (publishedOnly && !c.published) return false;
			if (status) {
				const kinds = STATUS_FILTERS.find((f) => f.id === status)?.kinds ?? [];
				if (!c.statusKinds.some((k) => (kinds as string[]).includes(k))) return false;
			}
			if (track && !c.trackIds.includes(track)) return false;
			if (level && c.level !== Number(level)) return false;
			if (weekday && !c.weekdays.includes(Number(weekday))) return false;
			if (language && !c.languages.includes(language)) return false;
			if (q.trim()) {
				const needle = norm(q.trim());
				const hay = norm([c.code, c.name_th, c.name_en, ...c.keywords].join(' '));
				if (!hay.includes(needle)) return false;
			}
			return true;
		})
	);
	const anyFilter = $derived(!!(q || status || track || level || weekday || language || !publishedOnly));
	function clear() {
		q = status = track = level = weekday = language = '';
		publishedOnly = true;
	}
</script>

<div class="pb-24">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<p class="eyebrow">{data.semester.label} · {t.semesterStatus[data.semester.status]}</p>
			<h1 class="text-3xl font-semibold tracking-tight">{t.nav.courses}</h1>
			<p class="text-ink-muted">{t.course.results(filtered.length)}</p>
		</div>
		<label class="grid gap-1 text-sm">
			<span class="label">{t.course.semester}</span>
			<select class="input" value={data.semester.id} onchange={(e) => goto(appPath(`/courses?semester=${e.currentTarget.value}`))} data-testid="semester-select">
				{#each data.semesters as s (s.id)}<option value={s.id}>{s.label} · {t.semesterStatus[s.status]}</option>{/each}
			</select>
		</label>
	</div>

	{#if data.curriculumNotice}<p class="mt-3 rounded-lg bg-info-bg px-4 py-2 text-sm text-info">{t.course.curriculumNotice}</p>{/if}

	<section class="card mt-4 grid gap-3 p-4" aria-label={t.course.filters}>
		<div class="relative">
			<Icon name="search" size={20} class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-brand-400" />
			<input class="input py-2 pl-10" type="search" placeholder={t.course.search} bind:value={q} aria-label={t.course.search} />
		</div>
		<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
			<select class="input" bind:value={status} aria-label={t.course.myStatus} data-testid="filter-status">
				<option value="">{t.course.myStatus}</option>
				{#each STATUS_FILTERS as f (f.id)}<option value={f.id}>{f.label}</option>{/each}
			</select>
			<select class="input" bind:value={track} aria-label={t.course.track} data-testid="filter-track">
				<option value="">{t.course.track}</option>
				{#each data.tracks as tr (tr.id)}<option value={tr.id}>{tr.name}</option>{/each}
			</select>
			<select class="input" bind:value={level} aria-label={t.course.level}>
				<option value="">{t.course.level}</option>
				{#each [2, 3, 4] as n (n)}<option value={String(n)}>{t.course.levelN(n)}</option>{/each}
			</select>
			<select class="input" bind:value={weekday} aria-label={t.course.weekday}>
				<option value="">{t.course.weekday}</option>
				{#each [1, 2, 3, 4, 5, 6] as d (d)}<option value={String(d)}>{t.weekdays[d]}</option>{/each}
			</select>
			<select class="input" bind:value={language} aria-label={t.course.language}>
				<option value="">{t.course.language}</option>
				{#each ['th', 'en', 'th_en'] as l (l)}<option value={l}>{t.language[l]}</option>{/each}
			</select>
		</div>
		<div class="flex flex-wrap items-center justify-between gap-2">
			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" bind:checked={publishedOnly} data-testid="filter-published" />
				{t.course.publishedOnly}
			</label>
			{#if anyFilter}<button type="button" class="btn btn-ghost text-sm" onclick={clear}>{t.course.clearFilters}</button>{/if}
		</div>
	</section>

	{#if filtered.length === 0}
		<p class="card mt-4 p-6 text-center text-ink-muted">{t.course.noResults}</p>
	{:else}
		<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="course-grid">
			{#each filtered as card (card.code)}<CourseCard {card} semesterId={data.semester.id} />{/each}
		</div>
	{/if}
</div>

<CompareTray />
