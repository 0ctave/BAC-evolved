import { fetchSiteData } from '$lib/directus/fetchers';
import type { LayoutServerLoad } from './$types';
import { PUBLIC_ENABLE_VISUAL_EDITING } from '$env/static/public';

export const load = (async (event) => {
	const visualEditingEnabled =
		event.url.searchParams.get('visual-editing') === 'true' &&
		PUBLIC_ENABLE_VISUAL_EDITING === 'true';

	// OPTIMIZED: This call now hits the same Cached Promise as +page.server.ts
	// Result: Zero additional latency or DB usage.
	const { globals, headerNavigation, footerNavigation, languages } = await fetchSiteData(
		event.fetch
	);

	const accentColor = globals?.accent_color || '#6644ff';

	return {
		globals,
		headerNavigation,
		footerNavigation,
		languages,
		accentColor,
		visualEditingEnabled
	};
}) satisfies LayoutServerLoad;
