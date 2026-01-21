<script lang="ts">
	import Hero from '$lib/components/blocks/Hero.svelte';
	import RichText from '$lib/components/blocks/RichText.svelte';
	import Gallery from '$lib/components/blocks/Gallery.svelte';
	import Pricing from '$lib/components/blocks/Pricing.svelte';
	import Posts from '$lib/components/blocks/Posts.svelte';
	import Form from '$lib/components/blocks/Form.svelte';
	import Split from '$lib/components/blocks/Split.svelte';
	import WizardContainer from '$lib/components/wizard/WizardContainer.svelte';

	// CHANGED: Use the standard store for maximum compatibility
	import { page } from '$app/stores';
	import { flatten } from '$lib/directus/directus-utils';
	import { defaultLocale } from '$lib/i18n';

	interface BaseBlockProps {
		block: {
			collection: string;
			item: any;
			id: string;
		};
	}

	let { block }: BaseBlockProps = $props();

	const components = {
		block_hero: Hero,
		block_richtext: RichText,
		block_gallery: Gallery,
		block_pricing: Pricing,
		block_posts: Posts,
		block_form: Form,
		block_split: Split,
		block_booking: WizardContainer
	} as const;

	// Resolve Component
	const Component = $derived(components[block.collection as keyof typeof components]);

	// Resolve Locale from Store
	// We use $page.data because 'page' is a store
	const locale = $derived($page.data.locale || defaultLocale);

	// Flatten Data
	const localizedItem = $derived(block.item ? flatten(block.item, locale) : null);

	// DEBUG: Check why a block might not render
	$effect(() => {
		if (!Component) {
			console.error(`[BaseBlock] Component NOT FOUND for collection: "${block.collection}". Check imports and mapping.`);
		}
		if (!localizedItem) {
			console.error(`[BaseBlock] Data flattening FAILED for block: "${block.collection}". Item might be null.`);
		}
		if (Component && localizedItem) {
			// console.log(`[BaseBlock] Rendering ${block.collection} OK`);
		}
	});
</script>

{#if Component && localizedItem}
	<!-- Pass the flattened data to the specific block -->
	<Component data={localizedItem} />
{:else}
	<!-- Visual Debugger for failed blocks (Hidden in production via CSS usually, or remove in prod) -->
	<div class="border-2 border-red-500 p-4 m-4 text-red-600 bg-red-50">
		<strong>Block Error:</strong> {block.collection} <br/>
		Has Component: {!!Component} <br/>
		Has Data: {!!localizedItem}
	</div>
{/if}