<script lang="ts">
	import { page } from '$app/state';
	import { DEMO_BUTTONS, canTeach, homeRouteFor, isStaffRole } from '$lib/domain/accounts';
	import Icon from '$lib/components/Icon.svelte';
	import { selfName, t } from '$lib/i18n/th';
	import type { IconName } from '$lib/icons';
	import type { Profile } from '$lib/types';

	let { profile, demoMode, cautionBadge = 0 }: { profile: Profile; demoMode: boolean; cautionBadge?: number } = $props();

	// menu items render only for roles that can open them; the server gate is the real check
	const items = $derived(
		(
			[
				{ href: '/courses', label: t.nav.courses, icon: 'menu_book', show: true },
				{ href: '/compare', label: t.nav.compare, icon: 'compare_arrows', show: true },
				{ href: '/curriculum', label: t.nav.curriculum, icon: 'account_tree', show: true },
				{ href: '/teach', label: t.nav.teach, icon: 'edit', show: canTeach(profile.role) },
				{ href: '/cautions', label: t.nav.cautions, icon: 'warning', show: canTeach(profile.role) },
				{ href: '/admin', label: t.nav.admin, icon: 'tune', show: isStaffRole(profile.role) }
			] satisfies { href: string; label: string; icon: IconName; show: boolean }[]
		).filter((i) => i.show)
	);
	const current = (href: string) => page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	const displayName = $derived(selfName(profile));
</script>

<header class="bg-night text-white">
	<div class="mx-auto flex max-w-6xl items-center gap-2.5 px-4 pt-3 pb-2 sm:gap-3">
		<a href={homeRouteFor(profile)} class="flex shrink-0 items-center gap-2 font-heading font-semibold whitespace-nowrap text-white">
			<span class="grid size-8 place-items-center rounded-lg bg-linear-to-br from-brand-400 to-brand-700 shadow-md shadow-brand-900/40" aria-hidden="true"><Icon name="menu_book" size={18} /></span>
			{t.appName}
		</a>
		<span class="chip shrink-0 border-white/15 bg-white/10 text-xs text-night-muted" data-testid="role-chip">{t.roles[profile.role]}</span>
		{#if profile.is_demo && demoMode}
			<span class="chip hidden shrink-0 border-warning/40 bg-warning/10 text-xs text-warning sm:inline-flex" data-testid="demo-badge">{t.demoBadge}</span>
		{/if}

		<details class="relative ml-auto min-w-0">
			<summary class="flex max-w-full cursor-pointer list-none items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1.5 text-sm text-white/90 hover:bg-white/10 hover:text-white" aria-label="{t.nav.menu}: {displayName}">
				<Icon name="account_circle" size={22} class="text-brand-300" />
				<span class="hidden max-w-[16rem] truncate sm:inline-block">{displayName}</span>
				<span class="sm:hidden">{t.nav.menu}</span>
				<Icon name="expand_more" size={18} class="text-night-muted" />
			</summary>
			<div class="card absolute right-0 z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] p-2 text-ink shadow-lg">
				<p class="px-3 py-2 text-xs text-ink-muted">{t.auth.signedInAs} {profile.email}</p>
				<a class="btn btn-ghost w-full justify-start" href="/profile"><Icon name="person" size={18} />{t.nav.profile}</a>
				{#if profile.is_demo && demoMode}
					<p class="mt-2 border-t border-line px-3 pt-3 text-xs font-medium text-ink-muted">{t.nav.switchDemo}</p>
					{#each DEMO_BUTTONS as b (b.key)}
						<form method="POST" action="/auth/demo">
							<input type="hidden" name="key" value={b.key} />
							<button class="btn btn-ghost w-full justify-start text-left text-sm" type="submit" disabled={b.email === profile.email} data-switch={b.key}>
								{b.label}
							</button>
						</form>
					{/each}
				{/if}
				<form method="POST" action="/auth/signout" class="mt-2 border-t border-line pt-2">
					<button class="btn btn-ghost w-full justify-start" type="submit"><Icon name="logout" size={18} />{t.nav.signOut}</button>
				</form>
			</div>
		</details>
	</div>
	<nav class="mx-auto max-w-6xl overflow-x-auto px-4" aria-label={t.nav.menu}>
		<ul class="flex gap-1 pb-2.5 text-sm">
			{#each items as i (i.href)}
				<li>
					<a
						href={i.href}
						class="flex items-center gap-1.5 rounded-full px-3 py-1.5 whitespace-nowrap transition-colors {current(i.href)
							? 'bg-brand-600 font-medium text-white shadow-sm shadow-brand-900/50'
							: 'text-night-muted hover:bg-white/10 hover:text-white'}"
						aria-current={current(i.href) ? 'page' : undefined}
						><Icon name={i.icon} size={17} class={current(i.href) ? 'text-white' : 'text-brand-300'} />{i.label}{#if i.href === '/cautions' && cautionBadge > 0}<span
								class="ml-0.5 grid min-w-5 place-items-center rounded-full bg-danger px-1.5 text-xs leading-5 font-semibold text-white ring-2 ring-night"
								data-testid="caution-badge">{cautionBadge}</span
							>{/if}</a
					>
				</li>
			{/each}
		</ul>
	</nav>
</header>
