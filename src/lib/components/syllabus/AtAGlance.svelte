<script lang="ts">
	import Donut from '$lib/components/Donut.svelte';
	import { evalColor } from '$lib/domain/eval-colors';
	import { hoursPerWeek } from '$lib/domain/workload';
	import { t } from '$lib/i18n/th';
	import type { SyllabusContext } from './context';

	let { ctx }: { ctx: SyllabusContext } = $props();
	const d = $derived(ctx.doc);
	const top = $derived([...d.evaluation.items].sort((a, b) => b.weightPercent - a.weightPercent).slice(0, 3));
	const exams = $derived(d.keyDates.filter((k) => /สอบ|exam/i.test(k.label)));
	const hours = $derived(hoursPerWeek(d, ctx.course.credit_format));
</script>

<section class="card p-5" aria-labelledby="glance-title" data-testid="at-a-glance">
	<h2 id="glance-title" class="text-lg font-semibold">{t.course.atGlance}</h2>
	<div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
		{#if d.evaluation.gradingScheme === 'su'}
			<p class="chip self-start">{t.course.su}</p>
		{:else}
			<div class="flex items-center gap-4">
				<Donut items={d.evaluation.items} size={112} />
				<ul class="grid gap-1 text-sm" aria-label={t.course.topItems}>
					{#each top as e (e.id)}
						<li class="flex items-center gap-2"><span class="inline-block size-2.5 rounded-full" style="background:{evalColor(e.type)}"></span>{e.title} <strong>{e.weightPercent}%</strong></li>
					{/each}
				</ul>
			</div>
		{/if}
		<dl class="grid grid-cols-[auto_1fr] content-start gap-x-3 gap-y-1.5 text-sm">
			<dt class="text-ink-muted">{t.course.hours}</dt>
			<dd>{hours ?? '—'} {t.common.hoursPerWeek}</dd>
			<dt class="text-ink-muted">{t.course.language}</dt>
			<dd>{t.language[d.overview.language]} · {t.deliveryMode[d.overview.deliveryMode]}</dd>
			<dt class="text-ink-muted">{t.course.meetings}</dt>
			<dd>
				{#each ctx.sections as s (s.id)}
					<span class="block">{t.common.sectionN(s.section_no)}: {s.meetings.map((m) => `${t.weekdaysShort[m.weekday]} ${m.starts_at}–${m.ends_at}`).join(', ') || '—'}</span>
				{/each}
			</dd>
			{#if exams.length}
				<dt class="text-ink-muted">{t.course.keyExams}</dt>
				<dd>{exams.map((k) => (k.week ? `${k.label} (${t.common.weekN(k.week)})` : k.label)).join(' · ')}</dd>
			{/if}
		</dl>
	</div>
	<div class="mt-3 flex flex-wrap gap-1.5">
		{#each d.approach.methods as m (m)}<span class="chip">{t.teachingMethods[m] ?? m}</span>{/each}
		<span class="chip bg-info-bg text-info" title={d.approach.aiPolicyNote}>{t.course.aiPolicy}: {t.aiPolicy[d.approach.aiPolicy]}</span>
	</div>
</section>
