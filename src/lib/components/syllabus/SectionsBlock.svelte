<script lang="ts">
	import { personName, t } from '$lib/i18n/th';
	import Block from './Block.svelte';
	import type { SyllabusContext } from './context';

	let { ctx }: { ctx: SyllabusContext } = $props();
</script>

<Block id="sections" th={t.sections.sections.th} en={t.sections.sections.en}>
	<ul class="grid gap-3" data-testid="sections-list">
		{#each ctx.sections as s (s.id)}
			<li class="rounded-lg border border-line p-4" data-section={s.section_no}>
				<p class="font-semibold">{t.common.sectionN(s.section_no)}</p>
				<dl class="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
					<dt class="text-ink-muted">{t.course.language}</dt>
					<dd>{t.language[s.language] ?? s.language}</dd>
					{#if s.capacity}<dt class="text-ink-muted">{t.course.capacity}</dt><dd>{s.capacity}</dd>{/if}
					<dt class="text-ink-muted">{t.course.instructors}</dt>
					<dd data-testid="section-instructors">{s.instructors.map((i) => personName(i) || t.common.deletedUser).join(', ')}</dd>
					<dt class="text-ink-muted">{t.course.meetings}</dt>
					<dd>
						{#each s.meetings as m (m.weekday + m.starts_at)}
							<span class="block">{t.weekdays[m.weekday]} {m.starts_at}–{m.ends_at}{m.room ? ` · ${m.room}` : ''}{m.mode !== 'onsite' ? ` · ${t.deliveryMode[m.mode]}` : ''}</span>
						{:else}—{/each}
					</dd>
					{#if s.note}<dt class="text-ink-muted">{t.course.note}</dt><dd>{s.note}</dd>{/if}
				</dl>
			</li>
		{/each}
	</ul>
</Block>
