<script lang="ts">
	import { t } from '$lib/i18n/th';

	let { data } = $props();
	const statusClass: Record<string, string> = {
		published: 'bg-success-bg text-success',
		draft: 'bg-warning-bg text-warning-ink',
		not_started: 'bg-page text-ink-muted'
	};
</script>

<h1 class="text-2xl font-semibold">{t.nav.teach}</h1>
<p class="mt-1 text-ink-muted">{t.pending.teach}{data.semester ? ` · ${data.semester.label}` : ''}</p>

{#if data.offerings.length === 0}
	<p class="card mt-6 p-5 text-ink-muted">{t.pending.noTeaching}</p>
{:else}
	<ul class="mt-6 grid gap-3 sm:grid-cols-2" data-testid="teach-list">
		{#each data.offerings as o (o.id)}
			<li class="card p-4">
				<a href="/teach/{o.id}/edit" class="block" data-course={o.course_code}>
					<span class="text-sm text-ink-muted">{o.course_code}</span>
					<span class="block font-medium">{o.course?.name_th}</span>
					<span class="chip mt-2 {statusClass[o.status]}">{t.offeringStatus[o.status]}</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}
