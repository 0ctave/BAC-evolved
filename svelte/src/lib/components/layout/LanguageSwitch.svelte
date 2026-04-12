<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { defaultLocale, normalizeLocale } from '$lib/i18n';
	import { getPageLink } from '$lib/directus/directus-utils';
	import { base } from '$app/paths';

	// 1. Get languages dynamically from the layout load function
	const dynamicLanguages = $derived(page.data.languages || []);

	// 3. Prepare list for display
	const displayLanguages = $derived(
		dynamicLanguages.map((l: any) => ({
			dbCode: l.code, // Real DB code: 'en-US'
			urlCode: normalizeLocale(l.code), // Use slug from DB if available!
			label: l.nom,
			isDefault: !!l.is_default,
			flagCode: l.flag_code || l.code.split('-')[1]?.toLowerCase() || l.code
		}))
	);

	// 4. Determine Current Active Locale (from Page Data)
	const currentDbLocale = $derived(page.data.locale || defaultLocale);

	// 5. Generate Switch URLs using actual Page Data
	function getSwitchUrl(targetDbCode: string, targetUrlCode: string) {
		// If we have page data, try to resolve the translated permalink
		if (page.data.page) {
			const link = getPageLink(page.data.page, targetDbCode);
			// If getPageLink returns a valid link (not '#'), use it
			if (link && link !== '#') {
				return link;
			}
		}

		// Fallback: If no page data or translation found, go to the language root
		if (targetUrlCode === defaultLocale) return '/';
		return `/${targetUrlCode}`;
	}
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/css/flag-icons.min.css"
	/>
</svelte:head>

<div class="flex items-center gap-3">
	{#each displayLanguages as lang (lang.dbCode)}
		{@const url = getSwitchUrl(lang.dbCode, lang.urlCode, lang.isDefault)}
		{@const isActive = currentDbLocale === lang.dbCode}

		<a
			href={`${base}${url}`}
			class={cn(
				'flex overflow-hidden rounded-sm transition-all duration-200 hover:scale-110',
				isActive
					? 'ring-primary/20 pointer-events-none opacity-100 ring-2 grayscale-0'
					: 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
			)}
			title={lang.label}
			aria-label={`Switch to ${lang.label}`}
			aria-current={isActive ? 'page' : undefined}
			data-sveltekit-noscroll
		>
			<span class={`fi fi-${lang.flagCode} !h-[18px] !w-6 !bg-cover`}></span>
		</a>
	{/each}
</div>
