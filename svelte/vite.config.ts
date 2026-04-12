import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { enhancedImages } from '@sveltejs/enhanced-img';

export default defineConfig({
	plugins: [enhancedImages(), sveltekit()],
	optimizeDeps: {
		exclude: ['@vinejs/vine'] // Prevent Vite from aggressively optimizing and throwing node:dns warnings
	},
	build: {
		// Increases the limit to 800kB to reduce common warnings for libraries like libphonenumber-js
		chunkSizeWarningLimit: 800,
		rollupOptions: {
			external: ['node:dns/promises', 'node:dns', 'node:net', 'node:http', 'node:https'],
			output: {
				// Group large libraries into their own chunks to improve caching and reduce individual chunk size
				manualChunks: (id) => {
					if (id.includes('node_modules')) {
						if (
							id.includes('intl-tel-input') ||
							id.includes('libphonenumber-js') ||
							id.includes('svelte-tel-input')
						) {
							return 'vendor-tel-input';
						}
						if (id.includes('lodash-es')) {
							return 'vendor-lodash';
						}
						if (id.includes('@directus/sdk')) {
							return 'vendor-directus';
						}
					}
				}
			},
			onwarn(warning, warn) {
				// Silence sourcemap issues often found in third-party libraries (like svelte-tel-input)
				// and misplaced annotation comments.
				if (warning.code === 'SOURCEMAP_ERROR' || warning.code === 'INVALID_ANNOTATION') {
					if (warning.message.includes('node_modules')) {
						return;
					}
				}
				warn(warning);
			}
		}
	}
});
