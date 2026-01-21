import { fetchPageData, fetchPageDataById } from '$lib/directus/fetchers';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const rawPath = event.url.pathname;

	// 1. EARLY EXIT: Ignore system paths
	if (rawPath.startsWith('/api/') || rawPath.includes('.')) {
		throw error(404, 'Not found');
	}

	try {
		// 2. GET CONTEXT FROM HOOKS
		// The hook has already done the heavy lifting of mapping /fr -> fr-FR
		const { directusCode, langSlug, isDefault } = event.locals;

		// 3. DETERMINE PERMALINK
		let permalink = rawPath;

		if (!isDefault) {
			// Remove the language prefix: /fr/about -> /about
			// Ensure we handle the root case /fr properly -> /
			const segments = rawPath.split('/').filter(Boolean);
			// segments[0] is 'fr', rest is slug
			permalink = '/' + segments.slice(1).join('/');
		}

		// Ensure root is just '/'
		if (permalink === '' || permalink === '/') permalink = '/';

		// 4. FETCH PAGE DATA
		const id = event.url.searchParams.get('id');
		const version = event.url.searchParams.get('version');
		const token = event.url.searchParams.get('token');
		const preview = event.url.searchParams.get('preview') === 'true';

		let pageData;

		if (id && version && version !== 'main') {
			pageData = await fetchPageDataById(id, version, token || undefined, event.fetch);
		} else {
			// Pass the resolved 'directusCode' (e.g. 'fr-FR') so strict matching works
			pageData = await fetchPageData(
				permalink,
				directusCode,
				event.fetch,
				preview,
				token || undefined
			);
		}

		return {
			page: pageData,
			locale: directusCode, // Passes 'fr-FR' to components
			langSlug // Passes 'fr' to components
		};
	} catch (err: any) {
		const msg = err?.message || '';
		console.error(`Load Error: ${rawPath} (Locale: ${event.locals.directusCode})`, msg);
		throw error(404, 'Page not found');
	}
};
