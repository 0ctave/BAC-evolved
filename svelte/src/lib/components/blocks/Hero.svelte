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
			// Restored alignment prop as requested, made optional
			alignment?: 'left' | 'center' | 'right';
			button_group?: {
				id: string;
				buttons: Array<any>;
			};
		};
	}

	let { data }: Props = $props();
	// Restored alignment in destructuring
	const { headline, description, image, button_group, tagline, layout, id, alignment } = $derived(data);

	// Derived value to check if there is any content to display
	const hasContent = $derived(headline || tagline || description || (button_group && button_group.buttons && button_group.buttons.length > 0));
</script>

<section
		class={cn(
		'relative mx-auto flex w-full flex-col gap-6 md:gap-10',
		// Removed md:p-12 to allow the image to take full width like RichText block
		// Layout is strictly stacked (Image Top, Content Bottom) as per previous request.
		layout === 'image_center'
			? 'items-center text-center'
			: 'items-start text-left'
	)}
>
	<!--
        BLOCK 1: Image Content (Top)
        Full width container.
    -->
	{#if image}
		<div
				class="relative w-full flex justify-center items-center py-16 md:py-0"
				data-directus={setAttr({ collection: 'block_hero', item: id, fields: ['image', 'layout'], mode: 'modal' })}
		>
			<div class="w-full relative group flex justify-center">
				<DirectusImage
						uuid={image}
						alt={tagline || headline || 'Hero Image'}
						sizes="100vw"
						class="
							/* Mobile / Vertical Mode */
							rotate-90 origin-center
							h-[100vw] w-auto max-w-none shrink-0

							/* Desktop / Horizontal Mode */
							md:rotate-0 md:h-auto md:w-full md:max-w-full

							/* Shared Styles */
							object-contain bg-transparent mx-auto dark:invert transition-transform duration-500
						"
				/>
			</div>
		</div>
	{/if}

	<!--
        BLOCK 2: Text Content (Bottom)
        Width constrained for readability.
        Only rendered if there is actual content.
    -->
	{#if hasContent}
		<div
				class={cn(
				'flex w-full flex-col gap-6 relative z-10',
				'panel-backdrop p-8 md:p-12',
				// Added md:ml-12 to compensate for removed section padding when left-aligned
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
				<!--
					 Using the restored 'alignment' prop if available, otherwise defaulting to layout-based center check.
				-->
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
</section>