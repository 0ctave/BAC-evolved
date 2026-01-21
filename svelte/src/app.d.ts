declare global {
	namespace App {
		interface Locals {
			directusCode: string; // The specific ISO code (fr-FR)
			langSlug: string; // The URL prefix (fr)
			isDefault: boolean;
		}
	}
}
export {};
