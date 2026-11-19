<script lang="ts">
	import { enhance } from '$app/forms';
	import { similarityWord } from '$lib/domain/similarity';
	import { t, thaiDateTime } from '$lib/i18n/th';
	import type { CautionDetail } from '$lib/caution-types';

	/**
	 * Caution drawer (spec 06), shared by the dashboard and the editor. The viewer's own side is on the
	 * left. Actions post to `action` (a page with resolve/comment actions).
	 */
	let { c, mine, action = '/cautions', onclose }: { c: CautionDetail; mine: string[]; action?: string; onclose: () => void } = $props();
	const flip = $derived(mine.includes(c.b_offering_id) && !mine.includes(c.a_offering_id));
	const left = $derived(flip ? { label: c.b_label, people: c.b_instructors, semester: c.b_semester } : { label: c.a_label, people: c.a_instructors, semester: c.a_semester });
	const right = $derived(flip ? { label: c.a_label, people: c.a_instructors, semester: c.a_semester } : { label: c.b_label, people: c.b_instructors, semester: c.b_semester });
	let relation = $state<string>('');
	let showComment = $state(false);
	let note = $state('');
	const sevClass: Record<string, string> = { high: 'bg-danger-bg text-danger-ink', medium: 'bg-warning-bg text-warning-ink', info: 'bg-page text-ink-muted' };
	const refresh = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => {
		await update({ reset: true });
		note = '';
	};
</script>

<div class="fixed inset-0 z-40 flex justify-end bg-black/30" role="presentation" onclick={(e) => e.target === e.currentTarget && onclose()}>
	<div class="h-full w-full max-w-2xl overflow-y-auto bg-surface p-5 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="drawer-title" data-testid="caution-drawer">
		<div class="flex items-start justify-between gap-3">
			<div class="flex flex-wrap items-center gap-2">
				<span class="chip {sevClass[c.severity]}">{t.cautions.severityLong[c.severity]}</span>
				<span class="chip">{t.cautions.kind[c.kind]}</span>
				<span class="chip" data-testid="drawer-status">{t.cautions.status[c.status]}</span>
			</div>
			<button type="button" class="btn btn-ghost" onclick={onclose} aria-label={t.cautions.close}>✕</button>
		</div>
		<h2 id="drawer-title" class="mt-3 text-lg font-semibold">{left.label.split(':')[0]} ↔ {right.label.split(':')[0]}</h2>

		<div class="mt-4 grid gap-3 sm:grid-cols-2">
			{#each [[t.cautions.drawerThis, left], [t.cautions.drawerOther, right]] as const as [title, side] (title)}
				<div class="rounded-lg border border-line p-3">
					<p class="label">{title}</p>
					<p class="mt-1 font-medium">{side.label}</p>
					{#if side.people.length}<p class="mt-1 text-sm text-ink-muted">{side.people.join(', ')}</p>{/if}
				</div>
			{/each}
		</div>

		<dl class="mt-4 grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
			<dt class="text-ink-muted">{t.cautions.relationLabel}</dt>
			<dd>{t.cautions.relation[c.relation]}</dd>
			<dt class="text-ink-muted">{t.cautions.similarity}</dt>
			<dd>{similarityWord(c.similarity)}</dd>
			<dt class="text-ink-muted">{t.cautions.reason}</dt>
			<dd data-testid="drawer-reason">{c.reason_th}</dd>
			{#if c.suggestion_th}<dt class="text-ink-muted">{t.cautions.suggestion}</dt><dd>{c.suggestion_th}</dd>{/if}
			{#if c.resolution_note}<dt class="text-ink-muted">{t.editor.note}</dt><dd>{c.resolution_note}</dd>{/if}
		</dl>

		<form method="POST" action="{action}?/resolve" class="mt-4 grid gap-2 rounded-lg bg-page p-3" use:enhance={refresh}>
			<input type="hidden" name="id" value={c.id} />
			<label class="flex flex-wrap items-center gap-2 text-sm">
				{t.cautions.relationLabel}
				<select class="input w-40 py-1" name="relation" bind:value={relation}>
					<option value="">{t.cautions.relation[c.relation]}</option>
					{#each ['duplicate', 'builds_on', 'related'] as r (r)}{#if r !== c.relation}<option value={r}>{t.cautions.relation[r]}</option>{/if}{/each}
				</select>
			</label>
			<textarea class="input text-sm" name="note" rows="2" maxlength="1000" placeholder={t.cautions.notePlaceholder} bind:value={note}></textarea>
			<div class="flex flex-wrap gap-2">
				<button class="btn btn-secondary text-sm" type="submit" name="status" value="intentional" data-testid="resolve-intentional">{t.cautions.intentional}</button>
				<button class="btn btn-secondary text-sm" type="submit" name="status" value="coordinating" onclick={() => (showComment = true)} data-testid="resolve-coordinate">{t.cautions.coordinate}</button>
				<button class="btn btn-ghost text-sm" type="submit" name="status" value="dismissed" disabled={!note.trim()} data-testid="resolve-dismiss">{t.cautions.dismiss}</button>
			</div>
			{#if c.status === 'coordinating' || showComment}<p class="text-xs text-ink-muted">{t.cautions.otherInstructors}: {right.people.join(', ') || '—'}</p>{/if}
		</form>

		<section class="mt-4" aria-label={t.cautions.thread}>
			<h3 class="label">{t.cautions.thread}</h3>
			<ul class="mt-2 grid gap-2" data-testid="comments">
				{#each c.comments as m (m.id)}
					<li class="rounded-lg border border-line p-2 text-sm"><p class="text-xs text-ink-muted">{m.author ?? t.common.deletedUser} · {thaiDateTime(m.created_at)}</p><p class="mt-0.5 whitespace-pre-line">{m.body}</p></li>
				{/each}
			</ul>
			{#if c.status === 'coordinating' || showComment || c.comments.length}
				<form method="POST" action="{action}?/comment" class="mt-2 flex gap-2" use:enhance={refresh}>
					<input type="hidden" name="id" value={c.id} />
					<input class="input flex-1 text-sm" name="body" maxlength="2000" placeholder={t.cautions.commentPlaceholder} required data-testid="comment-input" />
					<button class="btn btn-primary text-sm" type="submit" data-testid="comment-send">{t.cautions.send}</button>
				</form>
			{/if}
		</section>

		{#if c.events.length}
			<section class="mt-4">
				<h3 class="label">{t.cautions.history}</h3>
				<ul class="mt-1 grid gap-1 text-xs text-ink-muted">
					{#each c.events as e (e.id)}<li>{thaiDateTime(e.created_at)} · {e.actor ?? t.cautions.system} · {t.cautions.status[e.status]}{e.note ? ` — ${e.note}` : ''}</li>{/each}
				</ul>
			</section>
		{/if}
	</div>
</div>
