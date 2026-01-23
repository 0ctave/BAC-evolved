import { PUBLIC_DIRECTUS_URL } from '$env/static/public';
import { type DirectusFile } from '../types/directus-schema';
import { defaultLocale } from '$lib/i18n';

export function getDirectusAssetURL(
	fileOrString: string | DirectusFile | null | undefined
): string {
	if (!fileOrString) return '';

	if (typeof fileOrString === 'string') {
		return `${PUBLIC_DIRECTUS_URL}/assets/${fileOrString}`;
	}

	return `${PUBLIC_DIRECTUS_URL}/assets/${fileOrString.id}`;
}

/**
 * Recursively flattens a Directus item by merging its translations into the top level.
 * STRATEGY: Exact Match -> Default Locale -> First Available
 * ROBUSTNESS: Handles 'traductions' (custom) and 'translations' (standard) keys.
 */
export function flatten<T>(item: any, locale: string): T {
	if (!item || typeof item !== 'object') return item;

	// 1. Handle Arrays
	if (Array.isArray(item)) {
		return item.map((i) => flatten(i, locale)) as unknown as T;
	}

	// 2. Handle Objects
	let flattened = { ...item };

	// 3. Merge translations
	// Support both custom 'traductions' and standard 'translations'
	const translations = flattened.traductions || flattened.translations;

	if (translations && Array.isArray(translations) && translations.length > 0) {
		let t = null;

		// A. Try Exact/Fuzzy Match (Requested Locale)
		t = translations.find((t: any) => {
			// Handle varied language keys: langues_code, languages_code, language
			const rawCode = t.langues_code;
			const code = typeof rawCode === 'string' ? rawCode : rawCode?.code;

			if (!code) return false;

			return code === locale || code?.startsWith(locale) || locale?.startsWith(code);
		});

		// B. Try Default Locale (Fallback)
		if (!t && locale !== defaultLocale) {
			t = translations.find((t: any) => {
				const rawCode = t.langues_code || t.languages_code || t.language;
				const code = typeof rawCode === 'string' ? rawCode : rawCode?.code;

				if (!code) return false;

				return code === defaultLocale || code?.startsWith(defaultLocale);
			});
		}

		// C. Fallback to first available (Emergency)
		if (!t) {
			t = translations[0];
		}

		if (t) {
			flattened = { ...flattened, ...t };
		}
	}

	// 4. Recursively process children
	for (const key in flattened) {
		if (key === 'traductions') continue;

		const value = flattened[key];
		if (typeof value === 'object' && value !== null) {
			flattened[key] = flatten(value, locale);
		}
	}

	flattened._currentLocale = locale;
	return flattened as T;
}

export function flattenTree<T>(items: any[], locale: string): T[] {
	return flatten(items, locale) as T[];
}

/**
 * Helper to resolve the correct URL for a simple string path based on locale.
 */
export function getNavUrl(url: string | null | undefined, locale: string = defaultLocale): string {
	if (!url) return '#';
	if (url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:')) return url;

	const validLocale = locale || defaultLocale;
	const cleanPath = url.replace(/^\/+/g, '');

	const isDefault = validLocale === defaultLocale || validLocale.startsWith(defaultLocale);

	if (!isDefault) {
		if (cleanPath === validLocale || cleanPath.startsWith(`${validLocale}/`)) {
			return `/${cleanPath}`;
		}
		const urlLocale = validLocale.split('-')[0];
		return `/${urlLocale}/${cleanPath}`;
	}

	return `/${cleanPath}`;
}

/**
 * Helper to resolve the correct URL for a page object based on locale.
 */
export function getPageLink(page: any, locale: string = defaultLocale): string {
	if (!page) return '#';

	const validLocale = locale || defaultLocale;
	let permalink: string | null = null;

	// Support both keys
	const translations = page.traductions || page.translations;

	// Try to find permalink in flattened object or translations
	if (page._currentLocale === validLocale && page.permalink) {
		permalink = page.permalink;
	} else if (Array.isArray(translations) && translations.length > 0) {
		const t = translations.find((t: any) => {
			const rawCode = t.langues_code || t.languages_code || t.language;
			const code = typeof rawCode === 'string' ? rawCode : rawCode?.code;

			if (!code) return false;

			return code === validLocale || code?.startsWith(validLocale) || validLocale?.startsWith(code);
		});

		if (t?.permalink) {
			permalink = t.permalink;
		} else {
			permalink = page.permalink || translations[0]?.permalink;
		}
	} else if (page.permalink) {
		permalink = page.permalink;
	}

	if (!permalink) return '#';

	const cleanPath = permalink.replace(/^\/+/g, '');
	const isDefault = validLocale === defaultLocale || validLocale.startsWith(defaultLocale);

	if (!isDefault) {
		if (cleanPath === validLocale || cleanPath.startsWith(`${validLocale}/`)) {
			return `/${cleanPath}`;
		}
		const urlLocale = validLocale.split('-')[0];
		return `/${urlLocale}/${cleanPath}`;
	}

	return `/${cleanPath}`;
}
