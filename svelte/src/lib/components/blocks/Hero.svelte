<script lang="ts">
	import { cn } from '$lib/utils';
	import DirectusImage from '../shared/DirectusImage.svelte';
	import BaseText from '$lib/components/ui/Text.svelte';
	import ButtonGroup from './ButtonGroup.svelte';
	import Headline from '../ui/Headline.svelte';
	import Tagline from '../ui/Tagline.svelte';
	import setAttr from '$lib/directus/visualEditing';

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
	const { headline, description, image, button_group, tagline, layout, id, alignment } = $derived(data);

	const hasContent = $derived(headline || tagline || description || (button_group && button_group.buttons && button_group.buttons.length > 0));

	const isSideLayout = $derived(layout === 'image_left' || layout === 'image_right');
</script>

<section
		class={cn(
		'relative w-full flex flex-col overflow-hidden transition-all duration-500',
		isSideLayout
			? 'md:grid md:grid-cols-2 md:items-center md:px-12 lg:px-24 md:gap-12'
			: 'items-center text-center px-6 md:px-12'
	)}
>
	<!-- BLOCK: Content Area -->
	{#if hasContent}
		<div
				class={cn(
				'flex flex-col relative z-10 transition-all duration-500',
				// BASE STYLES: The panel backdrop card
				'panel-backdrop p-8 md:p-12 lg:p-16',

				// MOBILE: Edge-to-edge, flat sides, no margins
				'max-md:rounded-none max-md:border-x-0 order-1 mt-12 mb-0',

				// DESKTOP: Rounded card that hugs its content
				'md:order-none md:rounded-2xl md:border-2 md:my-16 md:w-full',

				isSideLayout
					? (layout === 'image_right' ? 'md:order-1' : 'md:order-2')
					: 'max-w-4xl mx-auto',

				isSideLayout ? 'items-start text-left' : 'items-center text-center'
			)}
		>
			<div class="w-full flex flex-col">
				{#if tagline}
					<Tagline
							{tagline}
							class="font-heading font-bold uppercase tracking-[0.2em] text-sm text-primary mb-2"
							data-directus={setAttr({ collection: 'block_hero', item: id, fields: 'tagline', mode: 'popover' })}
					/>
				{/if}

				{#if headline}
					<Headline
							{headline}
							class={cn(
							"heading-section !mb-4 leading-[1.05] tracking-tight text-primary",
							isSideLayout ? "text-3xl md:text-3xl lg:text-4xl" : "text-3xl md:text-5xl"
						)}
							data-directus={setAttr({ collection: 'block_hero', item: id, fields: 'headline', mode: 'popover' })}
					/>
				{/if}

				{#if description}
					<div class="relative w-full">
						{#if isSideLayout}
							<div class="hidden lg:block absolute -left-8 top-2 h-full w-1.5 bg-primary/20 rounded-full"></div>
						{/if}
						<BaseText
								content={description}
								class="text-body text-lg md:text-xl opacity-90 leading-relaxed max-w-xl"
								data-directus={setAttr({ collection: 'block_hero', item: id, fields: 'description', mode: 'popover' })}
						/>
					</div>
				{/if}

				{#if button_group && button_group.buttons.length > 0}
					<div
							class={cn(
							'mt-6 md:mt-8',
							(alignment === 'center' || (!alignment && layout === 'image_center')) && 'w-full flex justify-center'
						)}
							data-directus={setAttr({ collection: 'block_button_group', item: button_group.id, fields: 'buttons', mode: 'modal' })}
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
				"relative w-full flex justify-center items-center p-0 m-0 overflow-hidden bg-transparent",
				// Order 2 on mobile (below content), resets on desktop
				'order-2 md:order-none',
				isSideLayout && (layout === 'image_left' ? 'md:order-1' : 'md:order-2')
			)}
				data-directus={setAttr({ collection: 'block_hero', item: id, fields: ['image', 'layout'], mode: 'modal' })}
		>
			<div class={cn(
				"w-full flex justify-center items-center relative transition-all duration-700",
				// MOBILE: Set height to 100vw for side-layouts so the rotated image fits perfectly without gaps
				isSideLayout ? "max-md:h-[100vw]" : "h-auto"
			)}>
				<div class={cn(
					"transition-transform duration-1000 ease-in-out flex items-center justify-center",
					// Rotation: Fits width perfectly by filling the square container
					isSideLayout ? "max-md:rotate-90 max-md:w-[100vw] max-md:h-[100vw]" : "w-full h-auto",
					"md:rotate-0 md:w-full md:max-h-[85vh]"
				)}>
					<DirectusImage
							uuid={image}
							alt={tagline || headline || 'Hero Image'}
							sizes={isSideLayout ? "(max-width: 768px) 100vw, 50vw" : "100vw"}
							class="w-full h-full object-contain p-0 m-0 bg-transparent"
					/>
				</div>
			</div>
		</div>
	{/if}
</section>