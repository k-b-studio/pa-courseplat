<script lang="ts">
	import { appPath } from '$lib/paths';
	import { goto } from '$app/navigation';
	import { curriculumYear } from '$lib/domain/curriculum';
	import { t } from '$lib/i18n/th';

	let { data } = $props();
	const qs = (patch: Record<string, string>) => {
		const p = new URLSearchParams({ semester: data.semester.id, tab: data.tab, ...patch });
		return appPath(`/curriculum?${p}`);
	};
	const statusChip: Record<string, string> = { published: 'bg-success-bg text-success', draft: 'bg-warning-bg text-warning-ink', not_started: 'bg-page text-ink-muted' };
</script>

{#snippet courseLink(c: { code: string; name_th: string; status: string | null; managed: boolean })}
	<li class="flex flex-wrap items-center gap-2 py-1">
		{#if c.managed}<a class="hover:underline" href={appPath(`/courses/${c.code}/${data.semester.id}`)}>{c.code} {c.name_th}</a>{:else}<span>{c.code} {c.name_th}</span>{/if}
		{#if c.status}<span class="chip text-xs {statusChip[c.status] ?? ''}">{t.offeringStatus[c.status]}</span>{:else}<span class="text-xs text-ink-muted">{t.curriculum.notOffered}</span>{/if}
	</li>
{/snippet}

<div class="flex flex-wrap items-end justify-between gap-3">
	<h1 class="text-3xl font-semibold tracking-tight">{t.nav.curriculum}</h1>
	<label class="grid gap-1 text-sm">
		<span class="label">{t.course.semester}</span>
		<select class="input" value={data.semester.id} onchange={(e) => goto(qs({ semester: e.currentTarget.value }))}>
			{#each data.semesters as s (s.id)}<option value={s.id}>{s.label}</option>{/each}
		</select>
	</label>
</div>

<div class="mt-4 flex gap-2" role="tablist">
	<a role="tab" aria-selected={data.tab === 'map'} class="btn {data.tab === 'map' ? 'btn-primary' : 'btn-secondary'} text-sm" href={qs({ tab: 'map' })}>{t.curriculum.mapTab}</a>
	<a role="tab" aria-selected={data.tab === 'requirements'} class="btn {data.tab === 'requirements' ? 'btn-primary' : 'btn-secondary'} text-sm" href={qs({ tab: 'requirements' })}>{t.curriculum.reqTab}</a>
</div>

{#if data.tab === 'map'}
	<section class="card mt-4 p-4" data-testid="plo-matrix">
		<p class="text-sm text-ink-muted">{t.curriculum.legend}</p>
		<table class="mt-3 w-full table-fixed text-sm">
			<thead>
				<tr class="text-left">
					<th class="w-[55%] py-1 font-normal text-ink-muted sm:w-auto">{t.course.item}</th>
					{#each data.plos as p (p.code)}<th class="py-1 text-center text-xs font-medium" title={p.text}>{p.code.replace('PLO', '')}</th>{/each}
				</tr>
			</thead>
			<tbody>
				{#each data.matrix as row (row.code)}
					<tr class="border-t border-line" data-course={row.code}>
						<td class="truncate py-1.5"><a class="hover:underline" href={appPath(`/courses/${row.code}`)}>{row.code}</a> <span class="hidden text-ink-muted sm:inline">{row.name_th}</span></td>
						{#each row.cells as c, i (i)}
							<td class="text-center" aria-label="{row.code} {data.plos[i].code}: {c.official ? t.curriculum.official : ''} {c.covered ? t.curriculum.covered : ''}">
								<span class="text-accent">{c.official ? '●' : ''}{c.covered ? '◐' : ''}</span>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr class="border-t-2 border-line-strong">
					<td class="py-1.5 text-xs text-ink-muted">{t.curriculum.footer(data.semester.label)}</td>
					{#each data.footers as n, i (i)}<td class="text-center font-semibold" data-plo={data.plos[i].code}>{n}</td>{/each}
				</tr>
			</tfoot>
		</table>
		<dl class="mt-4 grid gap-1 text-xs text-ink-muted">
			{#each data.plos as p (p.code)}<div><dt class="inline font-semibold text-ink">{p.code}</dt> <dd class="inline">{p.text}</dd></div>{/each}
		</dl>
	</section>
{:else}
	{#each data.requirements as req (req.id)}
		<section class="card mt-4 grid gap-4 p-4" data-testid="requirements-{req.id}">
			<h2 class="text-lg font-semibold">{t.curriculum.curriculumTitle(curriculumYear(req.id))}</h2>
			<div><h3 class="label">{t.curriculum.facultyCore}</h3><ul>{#each req.facultyCore as c (c.code)}{@render courseLink(c)}{/each}</ul><p class="text-xs text-ink-muted">{t.curriculum.facultyNote}</p></div>
			<div><h3 class="label">{t.curriculum.majorRequired}</h3><ul>{#each req.majorRequired as c (c.code)}{@render courseLink(c)}{/each}</ul></div>
			{#each req.tracks as tr (tr.id)}
				<div><h3 class="label">{t.curriculum.trackElective}: {tr.name}</h3><ul>{#each tr.courses as c (c.code)}{@render courseLink(c)}{/each}</ul></div>
			{/each}
			<div><h3 class="label">{t.curriculum.requiredElective}</h3><ul>{#each req.requiredElective as c (c.code)}{@render courseLink(c)}{/each}</ul></div>
		</section>
	{/each}
{/if}
