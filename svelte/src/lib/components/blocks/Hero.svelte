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
</script>

<section
		class={cn(
		'relative mx-auto flex w-full flex-col md:gap-10', // Section scales naturally
		layout === 'image_center'
			? 'items-center text-center'
			: 'items-start text-left'
	)}
>


	{#if hasContent}
		<div
				class={cn(
				'flex w-full flex-col gap-6 relative z-10 mt-6 md:mt-0',
				'panel-backdrop p-8 md:p-12',
				layout === 'image_center' ? 'items-center md:w-3/4' : 'items-start md:w-2/3 md:ml-12'
			)}
		>
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
						class="heading-section !mb-4 leading-[1.1]"
						data-directus={setAttr({ collection: 'block_hero', item: id, fields: 'headline', mode: 'popover' })}
				/>
			{/if}

			{#if description}
				<div class="relative">
					{#if layout !== 'image_center'}
						<div class="absolute -left-6 top-2 h-full w-1 bg-primary/20 rounded-full"></div>
					{/if}
					<BaseText
							content={description}
							class="text-body text-lg md:text-xl max-w-xl"
							data-directus={setAttr({ collection: 'block_hero', item: id, fields: 'description', mode: 'popover' })}
					/>
				</div>
			{/if}

			{#if button_group && button_group.buttons.length > 0}
				<div
						class={cn(
							(alignment === 'center' || (!alignment && layout === 'image_center')) && 'flex justify-center',
							'mt-6'
						)}
						data-directus={setAttr({ collection: 'block_button_group', item: button_group.id, fields: 'buttons', mode: 'modal' })}
				>
					<ButtonGroup buttons={button_group.buttons} />
				</div>
			{/if}
		</div>
	{/if}
	<!--
        BLOCK 1: Image Content (Top)
        Fix:
        1. Removed 'aspect-[9/16]' and 'absolute' positioning which were causing fixed gaps.
        2. Set the image to 'w-full h-auto' on mobile. This ensures the container
           hugs the image exactly, removing all top/bottom padding.
        3. Removed 'rotate-90' on mobile. CSS rotation does not update the parent's height
           in the layout flow, so rotating a landscape image into a portrait space
           always forces either a fixed height (with gaps) or overlap.
    -->
	{#if image}
		<div
				class="relative w-full flex justify-center items-center"
				data-directus={setAttr({ collection: 'block_hero', item: id, fields: ['image', 'layout'], mode: 'modal' })}
		>
			<div class="w-full relative group flex justify-center items-center md:h-full">
				<DirectusImage
						uuid={image}
						alt={tagline || headline || 'Hero Image'}
						sizes="100vw"
						class="
							/* Mobile / Vertical Mode */
							w-full h-auto object-contain

							/* Desktop / Horizontal Mode */
							md:relative md:rotate-0 md:h-auto md:w-full md:max-w-full md:inset-auto

							/* Shared Styles */
							bg-transparent mx-auto dark:invert transition-transform duration-500
						"
				/>
			</div>
		</div>
	{/if}

	<!--
        BLOCK 2: Text Content (Bottom)
    -->

</section>