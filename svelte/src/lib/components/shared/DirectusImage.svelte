<script lang="ts">
	import { getDirectusAssetURL } from '$lib/directus/directus-utils';
	import { type DirectusFile } from '$lib/types/directus-schema';

	interface Props {
		uuid: string | DirectusFile;
		width?: number;
		height?: number;
		quality?: number;
		format?: 'webp' | 'jpg' | 'png' | 'avif';
		fit?: 'cover' | 'contain' | 'inside' | 'outside';
		alt: string;
		class?: string;
		showCaption?: boolean;
		[key: string]: any;
	}

	let {
		uuid,
		width,
		height,
		quality,
		format,
		fit,
		alt,
		class: className,
		showCaption = false,
		...props
	}: Props = $props();

	let src = $derived(getDirectusAssetURL(uuid, { width, height, quality, format, fit }));
</script>

{#if showCaption && alt}
	<figure class="group relative m-0 flex h-full w-full overflow-hidden p-0">
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
		<figcaption
			class="text-limestone-50 pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#181719]/90 via-[#181719]/60 to-transparent px-4 pt-12 pb-4 text-sm font-medium"
		>
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
