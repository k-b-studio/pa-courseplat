<script lang="ts">
	import { appPath } from '$lib/paths';
	import Icon from '$lib/components/Icon.svelte';
	import { DEMO_BUTTONS } from '$lib/domain/accounts';
	import { t } from '$lib/i18n/th';
	import type { IconName } from '$lib/icons';

	let { data, form } = $props();

	const featureIcons: IconName[] = ['menu_book', 'auto_awesome', 'warning'];
	// one look per role: the avatar tint says who you will be
	const roleLook: Record<string, { icon: IconName; tint: string }> = {
		student: { icon: 'school', tint: 'bg-brand-100 text-brand-700' },
		instructor: { icon: 'person', tint: 'bg-night text-brand-200' },
		staff: { icon: 'tune', tint: 'bg-info-bg text-info' }
	};
</script>

<main>
	<section class="relative overflow-hidden bg-night text-white">
		<!-- soft pink light behind the title; purely decorative -->
		<div class="pointer-events-none absolute -top-40 -left-32 size-[34rem] rounded-full bg-brand-600/35 blur-3xl" aria-hidden="true"></div>
		<div class="pointer-events-none absolute -right-24 -bottom-48 size-[28rem] rounded-full bg-brand-400/20 blur-3xl" aria-hidden="true"></div>

		<!-- fills the screen above the footer (≈ 5.5rem) so the hero never leaves a pale strip -->
		<div class="relative mx-auto grid min-h-[calc(100dvh-5.5rem)] max-w-6xl content-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-14 lg:py-20">
			<div>
				{#if data.demoMode}
					<p class="chip border-white/20 bg-white/10 text-night-muted"><Icon name="info" size={14} />{t.demoData}</p>
				{/if}
				<p class="mt-6 flex items-center gap-2.5 font-heading text-sm text-brand-200">
					<span class="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand-400 to-brand-700 text-white shadow-lg shadow-brand-900/50" aria-hidden="true"><Icon name="menu_book" size={20} /></span>
					{t.appNameTh}
				</p>
				<h1 class="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{t.appName}</h1>
				<p class="mt-4 max-w-xl text-base leading-relaxed text-night-muted sm:text-lg">{t.auth.landingLead}</p>

				<ul class="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
					{#each t.auth.features as f, n (f.title)}
						<li class="flex gap-3 sm:flex-col lg:flex-row xl:flex-col">
							<span class="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-300 ring-1 ring-white/15"><Icon name={featureIcons[n]} /></span>
							<span>
								<span class="block font-heading font-medium text-white">{f.title}</span>
								<span class="block text-sm text-night-muted">{f.body}</span>
							</span>
						</li>
					{/each}
				</ul>
			</div>

			<div class="card p-5 text-ink shadow-2xl shadow-brand-900/40 sm:p-7">
				<section aria-labelledby="signin-title">
					<h2 id="signin-title" class="text-xl font-semibold">{t.auth.signInTitle}</h2>
					<form method="POST" action="?/google" class="mt-4">
						<button class="btn btn-primary w-full py-2.5 text-base" type="submit"><Icon name="account_circle" />{t.auth.signInChula}</button>
					</form>
					<p class="mt-3 text-sm text-ink-muted">{t.auth.signInHint}</p>
					{#if form?.error}
						<p class="mt-3 text-sm text-danger-ink" role="alert">{t.auth.genericError}</p>
					{/if}
				</section>

				{#if data.demoMode}
					<section class="mt-6" aria-labelledby="demo-title" data-testid="demo-panel">
						<div class="flex items-center gap-3 text-xs text-ink-muted" aria-hidden="true">
							<span class="h-px flex-1 bg-line"></span>{t.auth.or}<span class="h-px flex-1 bg-line"></span>
						</div>
						<h2 id="demo-title" class="mt-4 font-semibold">{t.auth.demoPanel}</h2>
						<p class="text-sm text-ink-muted">{t.auth.demoPanelHint}</p>
						<div class="mt-3 grid gap-2">
							{#each DEMO_BUTTONS as b (b.key)}
								{@const look = roleLook[b.role]}
								<form method="POST" action={appPath('/auth/demo')}>
									<input type="hidden" name="key" value={b.key} />
									<button
										class="group flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-left transition hover:border-brand-300 hover:bg-brand-50"
										type="submit"
										data-demo={b.key}
									>
										<span class="grid size-10 shrink-0 place-items-center rounded-full {look.tint}" aria-hidden="true"><Icon name={look.icon} /></span>
										<span class="min-w-0 flex-1">
											<span class="block font-medium leading-snug">{b.label}</span>
											<span class="block text-xs text-ink-muted"><span class="font-medium text-brand-700">{t.roles[b.role]}</span> · {t.auth.demoWhat[b.key]}</span>
										</span>
										<Icon name="chevron_right" class="text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
									</button>
								</form>
							{/each}
						</div>
					</section>
				{/if}
			</div>
		</div>
	</section>
</main>
