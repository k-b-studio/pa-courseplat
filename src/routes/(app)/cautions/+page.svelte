<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Drawer from '$lib/components/caution/Drawer.svelte';
	import { t, thaiDateTime } from '$lib/i18n/th';

	let { data } = $props();
	let selected = $state<string | null>(null);
	const current = $derived(data.cautions.find((c) => c.id === selected) ?? null);

	/** filters live in the URL, so links from the editor or /admin open a filtered view (spec 06) */
	function href(patch: Record<string, string | null>) {
		const q = new URLSearchParams(page.url.searchParams);
		for (const [k, v] of Object.entries(patch)) (v === null ? q.delete(k) : q.set(k, v));
		return `/cautions?${q}`;
	}
	const toggleIn = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]).join(',');
	const sevClass: Record<string, string> = { high: 'bg-danger-bg text-danger-ink', medium: 'bg-warning-bg text-warning-ink', info: 'bg-page text-ink-muted' };
	const cellClass: Record<string, string> = { high: 'bg-danger text-white', medium: 'bg-warning text-white', info: 'bg-line text-ink' };
	const ownFirst = (c: (typeof data.cautions)[number]) => (data.myOfferingIds.includes(c.b_offering_id) && !data.myOfferingIds.includes(c.a_offering_id) ? [c.b_label, c.a_label] : [c.a_label, c.b_label]);
	const short = (label: string) => label.split(':')[0];
</script>

<div class="flex flex-wrap items-end justify-between gap-3">
	<div>
		<h1 class="text-2xl font-semibold">{t.cautions.title}</h1>
		<p class="text-ink-muted">{t.cautions.lead}</p>
		<p class="mt-1 chip" data-testid="scope">{data.isStaff ? t.cautions.scopeAll : t.cautions.scopeMine}</p>
	</div>
	<label class="grid gap-1 text-sm">
		<span class="label">{t.cautions.semester}</span>
		<select class="input" value={data.semester.id} onchange={(e) => goto(href({ semester: e.currentTarget.value }))}>
			{#each data.semesters as s (s.id)}<option value={s.id}>{s.label}</option>{/each}
		</select>
	</label>
</div>

{#if data.total === 0 && !data.isStaff}
	<p class="card mt-6 p-6 text-ink-muted" data-testid="cautions-empty">{t.cautions.empty}</p>
{:else}
	<!-- tiles: each one filters the list -->
	<div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="tiles">
		{#each [['high', data.tiles.high, href({ sev: 'high', status: 'open' })], ['medium', data.tiles.medium, href({ sev: 'medium', status: 'open' })], ['coordinating', data.tiles.coordinating, href({ status: 'coordinating', sev: 'high,medium,info' })], ['resolved', data.tiles.resolved, href({ status: 'intentional,dismissed', sev: 'high,medium,info' })]] as const as [key, n, link] (key)}
			<a class="card p-4 hover:border-accent" href={link} data-testid="tile-{key}"><p class="text-3xl font-semibold tabular-nums">{n}</p><p class="text-sm text-ink-muted">{t.cautions.tiles[key]}</p></a>
		{/each}
	</div>

	<!-- filters -->
	<section class="card mt-4 flex flex-wrap items-center gap-2 p-4 text-sm" aria-label={t.cautions.filters}>
		{#each ['high', 'medium', 'info'] as s (s)}
			<a class="chip border {data.filters.severities.includes(s) ? 'border-accent bg-accent text-white' : 'border-line'}" href={href({ sev: toggleIn(data.filters.severities, s) })} aria-current={data.filters.severities.includes(s) ? "true" : undefined} data-testid="filter-sev-{s}">{t.cautions.severity[s]}</a>
		{/each}
		<span class="mx-1 text-line-strong">|</span>
		{#each ['open', 'coordinating', 'intentional', 'dismissed'] as s (s)}
			<a class="chip border {data.filters.statuses.includes(s) ? 'border-accent bg-accent text-white' : 'border-line'}" href={href({ status: toggleIn(data.filters.statuses, s) })} aria-current={data.filters.statuses.includes(s) ? "true" : undefined} data-testid="filter-status-{s}">{t.cautions.status[s]}</a>
		{/each}
		<span class="mx-1 text-line-strong">|</span>
		<select class="input w-auto py-1" value={data.filters.kind ?? ''} onchange={(e) => goto(href({ kind: e.currentTarget.value || null }))} aria-label={t.cautions.allKinds}>
			<option value="">{t.cautions.allKinds}</option>
			{#each ['topic', 'reading', 'assignment'] as k (k)}<option value={k}>{t.cautions.kind[k]}</option>{/each}
		</select>
		{#if data.filters.pair || data.filters.offering || data.filters.course}<a class="btn btn-ghost px-2 text-xs" href={href({ pair: null, offering: null, course: null })}>{t.cautions.clearPair}</a>{/if}
		{#if data.hiddenInfo}<span class="ml-auto text-xs text-ink-muted" data-testid="info-hidden">{t.cautions.infoHidden(data.hiddenInfo)}</span>{/if}
	</section>

	<div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
		<!-- course × course matrix -->
		<section class="card min-w-0 p-4" data-testid="matrix">
			<h2 class="font-semibold">{t.cautions.matrix}</h2>
			<p class="text-xs text-ink-muted">{t.cautions.matrixHint}</p>
			{#if data.matrix.rows.length}
				<div class="mt-3 overflow-x-auto">
					<table class="text-xs">
						<thead><tr><th></th>{#each data.matrix.cols as k (k)}<th class="px-1 font-normal text-ink-muted [writing-mode:vertical-rl]">{k}</th>{/each}</tr></thead>
						<tbody>
							{#each data.matrix.rows as r (r)}
								<tr>
									<th class="pr-2 text-left font-medium">{r}</th>
									{#each data.matrix.cols as k (k)}
										{@const cell = data.matrix.cells[`${r}|${k}`]}
										<td class="p-0.5">
											{#if cell}
												<a class="grid size-7 place-items-center rounded {cell.allResolved ? 'border border-line-strong bg-surface text-ink-muted' : cellClass[cell.worst]}" href={href({ pair: `${r}|${k}` })} data-cell="{r}|{k}" data-worst={cell.worst} aria-label="{r} × {k}: {cell.count}">{cell.count}</a>
											{:else}<span class="block size-7"></span>{/if}
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}<p class="mt-3 text-sm text-ink-muted">{t.cautions.emptyFiltered}</p>{/if}
		</section>

		<!-- by kind -->
		<section class="card min-w-0 p-4" data-testid="kind-bars">
			<h2 class="font-semibold">{t.cautions.byKind}</h2>
			<ul class="mt-3 grid gap-3">
				{#each data.kinds as k (k.kind)}
					{@const total = k.high + k.medium + k.info}
					<li class="text-sm">
						<p class="flex justify-between"><span>{t.cautions.kind[k.kind]}</span><span class="text-ink-muted tabular-nums">{total}</span></p>
						<div class="mt-1 flex h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
							{#if total}<span class="bg-danger" style="width:{(k.high / total) * 100}%"></span><span class="bg-warning" style="width:{(k.medium / total) * 100}%"></span><span class="bg-ink-muted/40" style="width:{(k.info / total) * 100}%"></span>{/if}
						</div>
					</li>
				{/each}
			</ul>
		</section>
	</div>

	{#if data.mine?.length}
		<section class="mt-4" aria-labelledby="mine-title">
			<h2 id="mine-title" class="font-semibold">{t.cautions.myCourses}</h2>
			<ul class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="my-courses">
				{#each data.mine as o (o.id)}
					<li class="card p-4" data-course={o.code}>
						<p class="font-medium">{o.code} {o.name}</p>
						<p class="mt-1 text-sm text-ink-muted">{t.cautions.openCounts(o.high, o.medium)}</p>
						<div class="mt-2 flex gap-2"><a class="btn btn-secondary px-2 text-xs" href="/teach/{o.id}/edit">{t.cautions.openEditor}</a><a class="btn btn-ghost px-2 text-xs" href={href({ offering: o.id })}>{t.cautions.list}</a></div>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<!-- the list -->
	<section class="card mt-4 p-4" aria-labelledby="list-title">
		<h2 id="list-title" class="font-semibold">{t.cautions.list}</h2>
		{#if data.cautions.length === 0}
			<p class="mt-2 text-sm text-ink-muted">{t.cautions.emptyFiltered}</p>
		{:else}
			<ul class="mt-2 divide-y divide-line" data-testid="caution-list">
				{#each data.cautions as c (c.id)}
					{@const [mineLabel, otherLabel] = ownFirst(c)}
					<li>
						<button type="button" class="grid w-full gap-1 py-3 text-left hover:bg-page sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-3" onclick={() => (selected = c.id)} data-testid="caution-row" data-severity={c.severity} data-status={c.status}>
							<span class="flex gap-1.5"><span class="chip {sevClass[c.severity]}">{t.cautions.severity[c.severity]}</span><span class="chip">{t.cautions.kind[c.kind]}</span></span>
							<span class="min-w-0 text-sm"><span class="font-medium">{short(mineLabel)} ↔ {short(otherLabel)}</span><span class="block truncate text-ink-muted">{t.cautions.relation[c.relation]} · {c.reason_th}</span></span>
							<span class="flex flex-wrap items-center gap-2 text-xs text-ink-muted"><span class="chip">{t.cautions.status[c.status]}</span>{#if c.comments.length}<span>{t.cautions.comments(c.comments.length)}</span>{/if}<span>{thaiDateTime(c.updated_at)}</span></span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{/if}

{#if current}<Drawer c={current} mine={data.myOfferingIds} onclose={() => (selected = null)} />{/if}
