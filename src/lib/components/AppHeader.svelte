<script lang="ts">
	import { page } from '$app/state';
	import { DEMO_BUTTONS, canTeach, homeRouteFor, isStaffRole } from '$lib/domain/accounts';
	import { personName, t } from '$lib/i18n/th';
	import type { Profile } from '$lib/types';

	let { profile, demoMode }: { profile: Profile; demoMode: boolean } = $props();

	// menu items render only for roles that can open them; the server gate is the real check
	const items = $derived(
		[
			{ href: '/courses', label: t.nav.courses, show: true },
			{ href: '/compare', label: t.nav.compare, show: true },
			{ href: '/curriculum', label: t.nav.curriculum, show: true },
			{ href: '/teach', label: t.nav.teach, show: canTeach(profile.role) },
			{ href: '/cautions', label: t.nav.cautions, show: canTeach(profile.role) },
			{ href: '/admin', label: t.nav.admin, show: isStaffRole(profile.role) }
		].filter((i) => i.show)
	);
	const current = (href: string) => page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	const displayName = $derived(personName(profile) || profile.email);
</script>

<header class="border-b border-line bg-surface">
	<div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
		<a href={homeRouteFor(profile)} class="shrink-0 font-semibold whitespace-nowrap text-accent-dark">{t.appName}</a>
		<span class="chip shrink-0" data-testid="role-chip">{t.roles[profile.role]}</span>
		{#if profile.is_demo && demoMode}
			<span class="chip hidden shrink-0 bg-warning-bg text-warning-ink sm:inline-flex" data-testid="demo-badge">{t.demoBadge}</span>
		{/if}

		<details class="relative ml-auto min-w-0">
			<summary class="btn btn-ghost max-w-full cursor-pointer list-none text-sm" aria-label="{t.nav.menu}: {displayName}">
				<span class="hidden max-w-[16rem] truncate sm:inline-block">{displayName}</span>
				<span class="sm:hidden">{t.nav.menu}</span>
				<span aria-hidden="true">▾</span>
			</summary>
			<div class="card absolute right-0 z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] p-2 shadow-lg">
				<p class="px-3 py-2 text-xs text-ink-muted">{t.auth.signedInAs} {profile.email}</p>
				<a class="btn btn-ghost w-full justify-start" href="/profile">{t.nav.profile}</a>
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
					<button class="btn btn-ghost w-full justify-start" type="submit">{t.nav.signOut}</button>
				</form>
			</div>
		</details>
	</div>
	<nav class="mx-auto max-w-6xl overflow-x-auto px-4" aria-label={t.nav.menu}>
		<ul class="flex gap-1 pb-2 text-sm">
			{#each items as i (i.href)}
				<li>
					<a
						href={i.href}
						class="block rounded-md px-3 py-1.5 whitespace-nowrap hover:bg-accent-light {current(i.href) ? 'bg-accent-light font-medium text-accent-dark' : 'text-ink'}"
						aria-current={current(i.href) ? 'page' : undefined}>{i.label}</a
					>
				</li>
			{/each}
		</ul>
	</nav>
</header>
