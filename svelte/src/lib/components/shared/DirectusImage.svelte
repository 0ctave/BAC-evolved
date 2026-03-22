<script lang="ts">
	import { getDirectusAssetURL } from '$lib/directus/directus-utils';
	import { type DirectusFile } from '$lib/types/directus-schema';

	interface Props {
		uuid: string | DirectusFile;
		width?: number | string;
		height?: number | string;
		alt: string;
		class?: string;
		showCaption?: boolean; // New prop to toggle caption display safely
		[key: string]: any;
	}

	let { uuid, width, height, alt, class: className, showCaption = false, ...props }: Props = $props();
	let src = $derived(getDirectusAssetURL(uuid));
</script>

{#if showCaption && alt}
	<figure class="relative w-full h-full m-0 p-0 overflow-hidden flex group">
		<img
				{src}
				{alt}
				{width}
				{height}
				class={className}
				{...props.fill ? { style: 'object-fit: cover; width: 100%; height: 100%;' } : {}}
				{...props.sizes ? { sizes: props.sizes } : {}}
				loading={props.loading || 'lazy'}
				decoding={props.decoding || 'async'}
				{...props}
		/>
		<!-- Beautiful gradient overlay for the text description -->
		<figcaption class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#181719]/90 via-[#181719]/60 to-transparent pt-12 pb-4 px-4 text-limestone-50 text-sm font-medium z-10 pointer-events-none">
			{alt}
		</figcaption>
	</figure>
{:else}
	<img
			{src}
			{alt}
			{width}
			{height}
			class={className}
			{...props.fill ? { style: 'object-fit: cover; width: 100%; height: 100%;' } : {}}
			{...props.sizes ? { sizes: props.sizes } : {}}
			loading={props.loading || 'lazy'}
			decoding={props.decoding || 'async'}
			{...props}
	/>
{/if}