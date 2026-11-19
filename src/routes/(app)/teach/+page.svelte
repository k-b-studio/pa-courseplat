<script lang="ts">
	import { t, thaiDate } from '$lib/i18n/th';

	let { data } = $props();
	let q = $state('');
	const statusClass: Record<string, string> = { published: 'bg-success-bg text-success', draft: 'bg-warning-bg text-warning-ink', not_started: 'bg-page text-ink-muted' };
	const daysLeft = (due: string) => Math.round((Date.parse(`${due}T00:00:00Z`) - Date.parse(`${data.today}T00:00:00Z`)) / 86_400_000);
	const match = (o: { course_code: string; course: { name_th: string } | null }) => !q.trim() || `${o.course_code} ${o.course?.name_th ?? ''}`.toLowerCase().includes(q.trim().toLowerCase());
</script>

<div class="flex flex-wrap items-end justify-between gap-3">
	<h1 class="text-2xl font-semibold">{t.nav.teach}</h1>
	{#if data.isStaff}<input class="input w-full sm:w-72" type="search" bind:value={q} placeholder={t.course.search} aria-label={t.course.search} />{/if}
</div>

{#each data.groups as g (g.semester.id)}
	<section class="mt-6" aria-labelledby="sem-{g.semester.id}">
		<div class="flex flex-wrap items-baseline justify-between gap-2">
			<h2 id="sem-{g.semester.id}" class="text-lg font-semibold">{g.semester.label} · {t.semesterStatus[g.semester.status]}</h2>
			{#if g.semester.syllabus_due_on}
				{@const n = daysLeft(g.semester.syllabus_due_on)}
				<p class="text-sm {n < 0 ? 'text-danger-ink' : n <= 14 ? 'text-warning-ink' : 'text-ink-muted'}" data-testid="due">{t.editor.due} {thaiDate(g.semester.syllabus_due_on)} · {t.editor.dueIn(n)}</p>
			{/if}
		</div>
		{#if g.offerings.length === 0}
			<p class="card mt-3 p-5 text-ink-muted">{t.pending.noTeaching}</p>
		{:else}
			<ul class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="teach-list">
				{#each g.offerings.filter(match) as o (o.id)}
					<li class="card p-4">
						<a href="/teach/{o.id}/edit" class="block" data-course={o.course_code} data-semester={g.semester.id}>
							<span class="text-sm text-ink-muted">{o.course_code}</span>
							<span class="block font-medium">{o.course?.name_th}</span>
							<span class="mt-2 flex flex-wrap items-center gap-2">
								<span class="chip {statusClass[o.status]}" data-testid="status">{t.offeringStatus[o.status]}</span>
								{#if o.updated_at}<span class="text-xs text-ink-muted">{t.editor.lastEdited} {thaiDate(o.updated_at)}</span>{/if}
							</span>
						</a>
						{#if data.cautionCounts[o.id]}
							<a class="mt-2 inline-flex flex-wrap gap-1.5 text-xs" href="/cautions?offering={o.id}" data-testid="caution-counts" aria-label={t.editor.openCautions}>
								{#if data.cautionCounts[o.id].high}<span class="chip bg-danger-bg text-danger-ink">{t.cautions.severity.high} {data.cautionCounts[o.id].high}</span>{/if}
								{#if data.cautionCounts[o.id].medium}<span class="chip bg-warning-bg text-warning-ink">{t.cautions.severity.medium} {data.cautionCounts[o.id].medium}</span>{/if}
							</a>
						{/if}
						{#if data.imports[o.id]?.status === 'running'}<p class="chip mt-2 bg-info-bg text-info">{t.importAi.running}…</p>{/if}
						{#if data.imports[o.id]?.status === 'succeeded' && o.status === 'not_started'}<a class="mt-2 inline-block text-sm text-accent underline" href="/teach/{o.id}/review/{data.imports[o.id].id}">{t.importAi.reviewLink}</a>{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{/each}
