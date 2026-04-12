declare global {
	namespace App {
		interface Locals {
			directusCode: string; // The specific ISO code (fr-FR)
			langSlug: string; // The URL prefix (fr)
			isDefault: boolean;
		}
	}
}

declare module 'svelte/elements' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	export interface HTMLAttributes<T> {
		onreveal?: (event: CustomEvent<any>) => void;
	}
}

export {};
