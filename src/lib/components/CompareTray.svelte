<script lang="ts">
	import { clearTray, compareHref, toggleTray, tray, TRAY_MAX } from '$lib/compare-tray.svelte';
	import { t } from '$lib/i18n/th';
</script>

{#if tray.items.length}
	<div class="fixed inset-x-0 bottom-0 z-30 border-t border-line-strong bg-surface/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur" data-testid="compare-tray">
		<div class="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
			<span class="text-sm font-medium">{t.course.compareTray} ({tray.items.length}/{TRAY_MAX})</span>
			{#each tray.items as i (i.id)}
				<button class="chip" type="button" onclick={() => toggleTray(i)} aria-label="{t.common.delete} {i.code}">{i.code} ✕</button>
			{/each}
			<span class="ml-auto flex gap-2">
				<button class="btn btn-ghost text-sm" type="button" onclick={clearTray}>{t.common.cancel}</button>
				<a class="btn btn-primary text-sm {tray.items.length < 2 ? 'pointer-events-none opacity-50' : ''}" href={compareHref(tray.items.map((i) => i.id))} aria-disabled={tray.items.length < 2} data-testid="compare-go">{t.nav.compare}</a>
			</span>
		</div>
	</div>
{/if}
