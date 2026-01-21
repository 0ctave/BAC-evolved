import { createDirectus, rest, readItems } from '@directus/sdk';
import { PUBLIC_API_URL } from '$env/static/public';

// Define the interface matching your 'langues' collection
export interface LanguageConfig {
	code: string;       // e.g., 'fr-FR'
	slug: string;       // e.g., 'fr' (or 'en')
	is_default: boolean;
	direction: 'ltr' | 'rtl';
}

// In-memory cache variables
let cachedLanguages: LanguageConfig | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 300000; // 5 minutes in milliseconds

// Create a dedicated client for system operations
const client = createDirectus(PUBLIC_API_URL).with(rest());

/**
 * Fetches languages from Directus with caching.
 * This prevents hitting the API on every single request.
 */
export async function getAppLanguages(): Promise<LanguageConfig> {
	const now = Date.now();

	// Return cache if valid
	if (cachedLanguages && (now - lastFetchTime < CACHE_TTL)) {
		return cachedLanguages;
	}

	try {
		console.log('Refreshing language cache from Directus...');
		const response = await client.request(
			readItems('langues', {
				fields: ['code', 'slug', 'is_default', 'direction'],
				filter: {
					status: { _eq: 'published' } // Optional: only fetch published languages
				}
			})
		);


		cachedLanguages = response.map((l: any) => ({
			code: l.code,
			slug: l.slug || l.code.split('-'), // Fallback if slug missing
			is_default: l.is_default || false,
			direction: l.direction || 'ltr'
		}));

		lastFetchTime = now;
		return cachedLanguages;
	} catch (error) {
		console.error('Failed to load languages from Directus:', error);
		return;
	}
}