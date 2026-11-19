<script lang="ts">
	import { t } from '$lib/i18n/th';

	let { data } = $props();
	const o = $derived(data.offering);
</script>

<p class="text-sm text-ink-muted"><a href="/teach" class="underline">{t.nav.teach}</a> / {o.course_code}</p>
<h1 class="mt-1 text-2xl font-semibold" data-testid="editor-title">{o.course_code} {o.course?.name_th}</h1>
<p class="mt-1 text-ink-muted">{t.pending.editor} · {t.offeringStatus[o.status]}</p>
