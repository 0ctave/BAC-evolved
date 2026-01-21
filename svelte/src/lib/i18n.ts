/**
 * Global I18n Configuration
 * * NOTE: The actual list of supported languages is now fetched dynamically from Directus.
 * This file serves only as the static fallback configuration.
 */

export const defaultLocale = 'fr';

// Legacy export to prevent import errors, but it is effectively ignored
// in favor of the dynamic list from the database.
export const supportedLocales: string[] = [];

/**
 * Helper to normalize language codes
 * Converts 'en-US' -> 'en' for cleaner URLs
 */
export function normalizeLocale(locale: string): string {
	if (!locale) return defaultLocale;
	return locale.split('-')[0];
}
