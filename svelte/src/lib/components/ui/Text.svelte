<script lang="ts">
	import { cn } from '$lib/utils';

	interface TextProps {
		content: string;
		class?: string;
		'data-directus'?: string | undefined;
	}

	let { content, 'data-directus': dataDirectus, ...props }: TextProps = $props();
</script>

<div
	class={cn(
		'prose prose-lg max-w-none font-sans leading-relaxed',
		'text-iron-muted dark:text-limestone-300',
		// --- HEADINGS ---
		'prose-headings:font-heading prose-headings:font-bold prose-headings:text-iron dark:prose-headings:text-limestone-50',
		// --- LINKS & QUOTES ---
		'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
		'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:bg-primary/5 prose-blockquote:p-4',
		// --- DECORATION ---
		'prose-strong:text-iron dark:prose-strong:text-limestone-100',
		props.class
	)}
	data-directus={dataDirectus}
>
	{@html content}
</div>

<style>
	/* ENSURE LISTS ARE VISIBLE */
	:global(.prose ul) {
		list-style-type: disc !important;
		padding-left: 1.5rem !important;
		margin-left: 0.5rem !important;
	}

	:global(.prose ol) {
		list-style-type: decimal !important;
		padding-left: 1.5rem !important;
		margin-left: 0.5rem !important;
	}

	:global(.prose li::marker) {
		color: var(--color-primary, #f55677) !important;
		font-weight: bold;
	}

	/* TABLE ARRAY STYLING - BORDERLESS */
	:global(.prose table) {
		width: 100% !important;
		border-collapse: collapse !important;
		margin: 2rem 0 !important;
		border: none !important;
	}

	:global(.prose th) {
		background-color: rgba(45, 42, 46, 0.03) !important;
		padding: 1rem !important;
		font-weight: bold !important;
		text-transform: uppercase !important;
		font-size: 0.75rem !important;
		letter-spacing: 0.1em !important;
		border: none !important;
		text-align: center !important;
	}

	:global(.dark .prose th) {
		background-color: rgba(252, 251, 247, 0.03) !important;
	}

	:global(.prose td) {
		padding: 1rem !important;
		border: none !important;
		vertical-align: middle !important;
		text-align: center !important;
	}

	/* CENTER IMAGES IN TABLES */
	:global(.prose td img) {
		margin: 0 auto !important;
		display: block !important;
		border-radius: 0.5rem;
	}

	/* RESPONSIVE STACKING FOR TABLES (Mobile) */
	@media (max-width: 768px) {
		:global(.prose table),
		:global(.prose tbody),
		:global(.prose tr),
		:global(.prose td) {
			display: block !important;
			width: 100% !important;
		}

		/* Hide headers on mobile to save space and avoid awkward layout */
		:global(.prose thead) {
			display: none !important;
		}

		:global(.prose tr) {
			margin-bottom: 2.5rem !important;
			border-bottom: 1px dashed rgba(45, 42, 46, 0.1) !important;
			padding-bottom: 1rem !important;
		}

		:global(.dark .prose tr) {
			border-bottom-color: rgba(252, 251, 247, 0.1) !important;
		}

		:global(.prose td) {
			padding: 0.75rem 0 !important;
		}

		/* Ensure images stay centered when stacked */
		:global(.prose td img) {
			max-width: 100% !important;
			height: auto !important;
		}
	}
</style>
