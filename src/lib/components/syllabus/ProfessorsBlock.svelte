<script lang="ts">
	import { weekRanges } from '$lib/domain/people';
	import { personName, t } from '$lib/i18n/th';
	import Block from './Block.svelte';
	import type { SyllabusContext } from './context';

	let { ctx }: { ctx: SyllabusContext } = $props();
	const weeksOf = (id: string | null) => (id ? ctx.doc.weeklyPlan.filter((w) => !w.noClass && w.instructorIds.includes(id)).map((w) => w.week) : []);
</script>

<Block id="professors" th={t.sections.professors.th} en={t.sections.professors.en}>
	<ul class="grid gap-3 sm:grid-cols-2">
		{#each ctx.instructors as p (p.id ?? p.name_th)}
			{@const weeks = weeksOf(p.id)}
			<li class="rounded-lg border border-line p-4" data-testid="professor" data-name={p.name_th}>
				<p class="font-semibold">{personName(p) || t.common.deletedUser}</p>
				{#if p.name_en}<p class="text-sm text-ink-muted" lang="en">{p.name_en}</p>{/if}
				<dl class="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
					<dt class="text-ink-muted">{t.course.teachesSections}</dt>
					<dd data-testid="professor-sections">{p.sections.join(', ')}</dd>
					{#if weeks.length}<dt class="text-ink-muted">{t.course.leadsWeeks}</dt><dd data-testid="professor-weeks">{weekRanges(weeks)}</dd>{/if}
					{#if p.office_hours}<dt class="text-ink-muted">{t.course.officeHours}</dt><dd>{p.office_hours}</dd>{/if}
					{#if p.office}<dt class="text-ink-muted">{t.course.office}</dt><dd>{p.office}</dd>{/if}
					{#if p.contact_note}<dt class="text-ink-muted">{t.course.contact}</dt><dd>{p.contact_note}</dd>{/if}
				</dl>
			</li>
		{/each}
	</ul>
</Block>
