<script lang="ts">
	import { page } from '$app/state';
	import { t } from '$lib/i18n/th';

	const messages: Record<string, string> = {
		refused: t.auth.refused,
		demo: t.auth.demoFailed,
		profile: t.auth.profileError,
		cancelled: t.auth.cancelled,
		generic: t.auth.genericError
	};
	const reason = $derived(page.url.searchParams.get('reason') ?? 'generic');
</script>

<main class="mx-auto max-w-xl px-4 py-16">
	<div class="card p-6" role="alert">
		<h1 class="text-xl font-semibold text-danger-ink">{t.auth.errorTitle}</h1>
		<p class="mt-3">{messages[reason] ?? messages.generic}</p>
		<a class="btn btn-secondary mt-6" href="/">{t.auth.backHome}</a>
	</div>
</main>
