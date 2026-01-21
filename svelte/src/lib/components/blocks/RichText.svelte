<script lang="ts">
	import setAttr from '$lib/directus/visualEditing';
	import { cn } from '$lib/utils';
	import Headline from '../ui/Headline.svelte';
	import Tagline from '../ui/Tagline.svelte';
	import Text from '../ui/Text.svelte';

	interface RichTextProps {
		data: {
			id: string;
			headline?: string;
			content: string;
			alignment?: 'left' | 'center' | 'right';
			tagline?: string;
		};
		class?: string;
	}

	let { data, class: className }: RichTextProps = $props();

	const { headline, content, alignment = 'left', tagline, id } = $derived(data);
</script>

<div class="panel-backdrop rounded-none overflow-hidden p-8 md:p-16">
	<div
			class={cn(
            'mx-auto max-w-[800px] space-y-6',
            alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left',
            className
        )}
	>
		{#if tagline}
			<Tagline
					{tagline}
					class="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-2 block"
					data-directus={setAttr({
                    collection: 'block_richtext',
                    item: id,
                    fields: 'tagline',
                    mode: 'popover'
                })}
			/>
		{/if}

		{#if headline}
			<Headline
					{headline}
					class="heading-section !text-4xl md:!text-5xl mb-6 leading-tight"
					data-directus={setAttr({
                    collection: 'block_richtext',
                    item: id,
                    fields: 'headline',
                    mode: 'popover'
                })}
			/>
		{/if}

		{#if content}
			<div class="prose prose-lg prose-stone dark:prose-invert font-sans leading-loose text-iron-muted dark:text-limestone-300 max-w-none">
				<Text
						{content}
						data-directus={setAttr({
                        collection: 'block_richtext',
                        item: id,
                        fields: 'content',
                        mode: 'drawer'
                    })}
				/>
			</div>
		{/if}
	</div>
</div>