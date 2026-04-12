<script lang="ts">
	import { cn } from '$lib/utils';
	import DirectusImage from '../shared/DirectusImage.svelte';
	import BaseText from '$lib/components/ui/Text.svelte';
	import ButtonGroup from './ButtonGroup.svelte';
	import Headline from '../ui/Headline.svelte';
	import Tagline from '../ui/Tagline.svelte';
	import setAttr from '$lib/directus/visualEditing';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		data: {
			id: string;
			headline: string;
			tagline: string;
			description: string;
			layout: 'image_center' | 'image_left' | 'image_right';
			image: string;
			alignment?: 'left' | 'center' | 'right';
			button_group?: {
				id: string;
				buttons: Array<any>;
			};
		};
	}

	let { data }: Props = $props();
	const { headline, description, image, button_group, tagline, layout, id, alignment } =
		$derived(data);

	const hasContent = $derived(
		headline ||
			tagline ||
			description ||
			(button_group && button_group.buttons && button_group.buttons.length > 0)
	);

	const isSideLayout = $derived(layout === 'image_left' || layout === 'image_right');
</script>

<section
	class={cn(
		'relative flex w-full flex-col overflow-hidden transition-all duration-500',
		isSideLayout
			? 'px-6 py-12 md:grid md:grid-cols-2 md:items-center md:gap-8 md:px-12 lg:gap-16 lg:px-24'
			: 'min-h-[60vh] items-center justify-center px-6 text-center md:min-h-[80vh] md:px-12'
	)}
>
	<!-- BLOCK: Content Area -->
	{#if hasContent}
		<div
			class={cn(
				'relative z-10 flex flex-col transition-all duration-500',
				// BASE STYLES: The panel backdrop card (Glass effect with borders)
				'panel-backdrop p-8 md:p-12 lg:p-16',

				// MOBILE: Match surface-atelier look for coherence
				'order-1 mb-8 max-md:rounded-none max-md:border-black max-md:shadow-[4px_4px_0px_0px_#000] max-md:dark:border-white max-md:dark:shadow-[4px_4px_0px_0px_#fff]',

				// DESKTOP: Rounded card that hugs its content
				'md:order-none md:my-16 md:w-full md:rounded-2xl md:border-2',

				isSideLayout
					? layout === 'image_right'
						? 'md:order-1'
						: 'md:order-2'
					: 'mx-auto max-w-4xl shadow-retro-primary md:shadow-retro-white',

				isSideLayout ? 'items-start text-left' : 'items-center text-center'
			)}
			in:fly={{ y: 30, duration: 800, easing: cubicOut, delay: 100 }}
		>
			<div class="flex w-full flex-col">
				{#if tagline}
					<div in:fly={{ y: 15, duration: 600, delay: 300 }}>
						<Tagline
							{tagline}
							class="font-heading text-primary mb-2 text-sm font-bold tracking-[0.2em] uppercase"
							data-directus={setAttr({
								collection: 'block_hero',
								item: id,
								fields: 'tagline',
								mode: 'popover'
							})}
						/>
					</div>
				{/if}

				{#if headline}
					<div in:fly={{ y: 20, duration: 600, delay: 450 }}>
						<Headline
							{headline}
							class={cn(
								'!mb-4 leading-[1.05] tracking-tight',
								isSideLayout ? 'heading-section text-3xl md:text-3xl lg:text-4xl' : 'heading-page'
							)}
							data-directus={setAttr({
								collection: 'block_hero',
								item: id,
								fields: 'headline',
								mode: 'popover'
							})}
						/>
					</div>
				{/if}

				{#if description}
					<div class="relative w-full" in:fly={{ y: 20, duration: 600, delay: 600 }}>
						{#if isSideLayout}
							<div
								class="bg-primary absolute top-2 -left-8 hidden h-full w-1.5 rounded-full lg:block"
							></div>
						{/if}
						<BaseText
							content={description}
							class="text-body max-w-xl text-base leading-relaxed opacity-90 md:text-xl"
							data-directus={setAttr({
								collection: 'block_hero',
								item: id,
								fields: 'description',
								mode: 'popover'
							})}
						/>
					</div>
				{/if}

				{#if button_group && button_group.buttons.length > 0}
					<div
						class={cn(
							'mt-6 md:mt-8',
							(alignment === 'center' || (!alignment && layout === 'image_center')) &&
								'flex w-full justify-center'
						)}
						data-directus={setAttr({
							collection: 'block_button_group',
							item: button_group.id,
							fields: 'buttons',
							mode: 'modal'
						})}
						in:fly={{ y: 20, duration: 600, delay: 750 }}
					>
						<ButtonGroup buttons={button_group.buttons} />
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- BLOCK: Image Area -->
	{#if image}
		<div
			class={cn(
				'm-0 flex items-center justify-center bg-transparent p-0',
				isSideLayout
					? 'relative order-2 w-full md:order-none'
					: 'absolute inset-0 z-0 h-full w-full overflow-hidden',
				isSideLayout && (layout === 'image_left' ? 'md:order-1' : 'md:order-2')
			)}
			data-directus={setAttr({
				collection: 'block_hero',
				item: id,
				fields: ['image', 'layout'],
				mode: 'modal'
			})}
			in:fade={{ duration: 1000, delay: 200 }}
		>
			<div
				class={cn(
					'relative flex w-full items-center justify-center transition-all duration-700',
					// MOBILE: Landscape aspect ratio for side-layouts to fit the rotated 375x521 image
					isSideLayout ? 'max-md:aspect-[521/375]' : 'h-full'
				)}
				in:fly={{
					x: isSideLayout ? (layout === 'image_left' ? -40 : 40) : 0,
					duration: 1000,
					delay: 400
				}}
			>
				<div
					class={cn(
						'flex items-center justify-center transition-transform duration-1000 ease-in-out',
						// Rotation Logic for Mobile (Landscape rotated portrait)
						isSideLayout
							? 'max-md:absolute max-md:top-1/2 max-md:left-1/2 max-md:-translate-x-1/2 max-md:-translate-y-1/2 max-md:rotate-90 max-md:h-[calc(100%*521/375)] max-md:w-[calc(100%*375/521)]'
							: 'h-full w-full',

						// Desktop Styling: Controlled height to avoid being "too big"
						'md:rotate-0',
						isSideLayout
							? 'md:max-h-[750px] md:w-auto md:max-w-full'
							: 'md:h-full md:w-full'
					)}
				>
					<DirectusImage
						uuid={image}
						alt={tagline || headline || 'Hero Image'}
						sizes={isSideLayout ? '(max-width: 768px) 100vw, 50vw' : '100vw'}
						class={cn(
							'm-0 bg-transparent p-0',
							isSideLayout
								? 'h-full w-auto object-contain md:max-h-[700px]'
								: 'h-full w-full object-cover'
						)}
					/>
				</div>
			</div>
		</div>
	{/if}
</section>
