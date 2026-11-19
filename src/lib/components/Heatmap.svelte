<script lang="ts">
	import { HEAVY_WEEK, type Basket } from '$lib/domain/workload';
	import { t } from '$lib/i18n/th';

	/**
	 * Weekly assessed-weight heatmap (spec 04 R3; reused by the staff dashboard). Every cell has an
	 * aria-label, and a table view lists the same numbers as text (spec 04 R6).
	 */
	let { basket, labels, weeks = 16 }: { basket: Basket; labels: string[]; weeks?: number } = $props();
	let asTable = $state(false);
	const cols = $derived(Array.from({ length: weeks }, (_, i) => i + 1));
	const heavy = $derived(cols.filter((w) => basket.total[w - 1] >= HEAVY_WEEK));
	const shade = (pct: number) => (pct <= 0 ? 'transparent' : `color-mix(in srgb, var(--color-accent) ${Math.min(100, 12 + pct * 1.6)}%, white)`);
	const itemsOf = (row: number, w: number) => basket.rows[row].items[w - 1].map((i) => `${i.title} ${i.weight}%`).join(', ');
	const finalsOf = (row: number) => basket.rows[row].finals.reduce((s, f) => s + f.weight, 0);
</script>

<div class="grid gap-2" data-testid="heatmap">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<p class="text-sm text-ink-muted">{t.compare.heatmapLead}</p>
		<button type="button" class="btn btn-ghost text-sm" onclick={() => (asTable = !asTable)} aria-pressed={asTable}>{asTable ? t.compare.chartView : t.compare.tableView}</button>
	</div>

	{#if !asTable}
		<table class="w-full table-fixed border-separate border-spacing-0.5 text-[10px] sm:text-xs">
			<thead>
				<tr>
					<th class="w-14 text-left font-normal text-ink-muted sm:w-20"><span class="sr-only">{t.course.weekOf}</span></th>
					{#each cols as w (w)}<th class="font-normal text-ink-muted" scope="col">{w}</th>{/each}
					<th class="w-8 font-normal text-ink-muted sm:w-12" scope="col" title={t.course.finalsColumn}>F</th>
				</tr>
			</thead>
			<tbody>
				{#each labels as label, r (label)}
					<tr>
						<th class="truncate text-left font-medium" scope="row">{label}</th>
						{#each cols as w (w)}
							{@const pct = basket.rows[r].load[w - 1]}
							<td class="h-6 rounded-sm border border-line text-center" style="background:{shade(pct)}" aria-label={t.compare.cell(label, w, pct, itemsOf(r, w))} title={t.compare.cell(label, w, pct, itemsOf(r, w))}>
								<span class="hidden sm:inline {pct >= 30 ? 'text-white' : ''}">{pct || ''}</span>
							</td>
						{/each}
						<td class="rounded-sm border border-dashed border-line text-center text-ink-muted" aria-label="{label} {t.course.finalsColumn} {finalsOf(r)}%">{finalsOf(r) || ''}</td>
					</tr>
				{/each}
				<tr data-testid="heatmap-total">
					<th class="text-left font-semibold" scope="row">{t.compare.total}</th>
					{#each cols as w (w)}
						{@const pct = basket.total[w - 1]}
						<td
							class="h-7 rounded-sm text-center font-semibold {pct >= HEAVY_WEEK ? 'outline-2 outline-danger' : 'border border-line'}"
							style="background:{shade(pct)}"
							data-week={w}
							data-heavy={pct >= HEAVY_WEEK ? 'true' : undefined}
							aria-label={t.compare.cell(t.compare.total, w, pct, '')}
						>
							<span class="hidden sm:inline {pct >= 30 ? 'text-white' : ''}">{pct || ''}</span>
						</td>
					{/each}
					<td class="rounded-sm border border-dashed border-line text-center font-semibold">{basket.totalFinals || ''}</td>
				</tr>
			</tbody>
		</table>
	{:else}
		<table class="w-full text-sm" data-testid="heatmap-table">
			<thead><tr class="text-left text-ink-muted"><th class="py-1 font-normal">{t.course.weekOf}</th><th class="py-1 font-normal">{t.compare.total}</th><th class="py-1 font-normal">{t.course.item}</th></tr></thead>
			<tbody>
				{#each cols.filter((w) => basket.total[w - 1] > 0) as w (w)}
					<tr class="border-t border-line {basket.total[w - 1] >= HEAVY_WEEK ? 'font-semibold' : ''}">
						<td class="py-1">{w}</td>
						<td class="py-1">{basket.total[w - 1]}%</td>
						<td class="py-1">{basket.rows.flatMap((row, r) => row.items[w - 1].map((i) => `${labels[r]}: ${i.title} ${i.weight}%`)).join(' · ')}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

	{#if heavy.length}<p class="text-sm text-danger-ink" data-testid="heavy-note">{t.compare.heavyNote(heavy.join(', '))}</p>{/if}
</div>
