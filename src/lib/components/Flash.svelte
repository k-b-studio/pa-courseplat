<script lang="ts">
	import { t } from '$lib/i18n/th';

	let { flash }: { flash: string | null } = $props();
	let dismissed = $state<string | null>(null);
	const message = $derived(flash && flash !== dismissed ? t.flash[flash] : null);
</script>

{#if message}
	<div class="mx-auto mt-4 max-w-6xl px-4">
		<div class="flex items-start gap-3 rounded-lg border border-line-strong bg-surface px-4 py-3 text-sm shadow-sm" role="status" data-testid="flash">
			<p class="flex-1">{message}</p>
			<button class="text-ink-muted hover:text-ink" type="button" onclick={() => (dismissed = flash)} aria-label={t.common.close}>✕</button>
		</div>
	</div>
{/if}
