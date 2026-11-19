<script lang="ts">
	import { appPath } from '$lib/paths';
	import { page } from '$app/state';
	import { t } from '$lib/i18n/th';

	const title = $derived(page.status === 404 ? t.common.notFound : page.status === 403 ? t.auth.forbidden : t.common.error);
</script>

<main class="mx-auto max-w-xl px-4 py-16">
	<div class="card p-6" role="alert" data-testid="error-page" data-status={page.status}>
		<p class="text-sm text-ink-muted">{page.status}</p>
		<h1 class="mt-1 text-xl font-semibold">{title}</h1>
		{#if page.error?.message && page.error.message !== title && page.status !== 404}
			<p class="mt-2 text-ink-muted">{page.error.message}</p>
		{/if}
		<a class="btn btn-secondary mt-6" href={appPath('/')}>{t.auth.backHome}</a>
	</div>
</main>
