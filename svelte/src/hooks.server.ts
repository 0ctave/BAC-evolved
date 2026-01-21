import { type Handle, redirect } from '@sveltejs/kit';
import { fetchSiteData } from '$lib/directus/fetchers';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	// 1. Fetch Dynamic Configuration (Cached)
	const { languages } = await fetchSiteData(event.fetch);

	const defaultLang = languages.find((l) => l.is_default) || languages[0];

	// 2. Parse URL Segments
	// /fr/about -> ['', 'fr', 'about']
	const segments = pathname.split('/').filter(Boolean);

	// FIX: Use segments[0] to get the first segment (string), not the array
	const firstSegment = segments[0];

	// 3. Identify Current Locale
	// Check if the first segment matches a known language slug
	const matchedLang = languages.find((l) => l.slug === firstSegment);

	let currentLangConfig = defaultLang;

	if (matchedLang) {
		// CASE: URL starts with a language slug (e.g., /en or /fr)

		// REDIRECT: If user tries /en (and en is default), force redirect to /
		if (matchedLang.code === defaultLang.code) {
			const newPath = '/' + segments.slice(1).join('/');
			throw redirect(301, newPath || '/');
		}

		currentLangConfig = matchedLang;
	}

	// 4. Inject Context
	// We store the resolved ISO code (fr-FR) for the data fetching layer
	// and the slug (fr) for the frontend links.
	event.locals.directusCode = currentLangConfig.code;
	event.locals.langSlug = currentLangConfig.slug;
	event.locals.isDefault = currentLangConfig.code === defaultLang.code;

	// 5. Render
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', currentLangConfig.slug)
	});
};
