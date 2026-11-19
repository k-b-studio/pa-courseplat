<script lang="ts">
	import '../app.css';
	import { t } from '$lib/i18n/th';

	let { children } = $props();
</script>

<svelte:head>
	<title>{t.appName}</title>
</svelte:head>

<div class="flex min-h-dvh flex-col">
	<div class="flex-1">
		{@render children()}
	</div>
	<footer class="border-t border-line bg-surface px-4 py-5 text-center text-xs text-ink-muted">
		<p class="font-medium text-ink">{t.footer}</p>
		<p class="mt-1">{t.dept}</p>
	</footer>
</div>
