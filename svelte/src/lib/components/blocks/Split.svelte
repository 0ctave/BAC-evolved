<script lang="ts">
    import { cn } from '$lib/utils';
    import DirectusImage from '../shared/DirectusImage.svelte';
    import BaseText from '$lib/components/ui/Text.svelte';
    import Headline from '../ui/Headline.svelte';
    import Tagline from '../ui/Tagline.svelte';
    import setAttr from '$lib/directus/visualEditing';

    interface Props {
        data: {
            id: string;
            headline: string;
            tagline: string;
            content: string;
            layout: 'image_left' | 'image_right';
            image: string;
        };
    }

    let { data }: Props = $props();
    const { headline, content, image, tagline, layout, id } = $derived(data);
</script>

<section class="mx-auto w-full p-0 panel-backdrop rounded-none overflow-hidden overflow-hidden"> <!-- Padding removed, handled by container -->
    <div
            class={cn(
			'relative flex flex-col md:flex-row h-full',
			layout === 'image_right' ? '' : 'md:flex-row-reverse'
		)}
    >
        <!-- Text Content Side -->
        <div class="flex-1 p-8 md:p-16 flex flex-col justify-center">
            <div
                    data-directus={setAttr({ collection: 'block_split', item: id, fields: ['headline', 'content'], mode: 'popover' })}
            >
                {#if tagline}
                    <Tagline
                            {tagline}
                            class="font-heading font-bold uppercase tracking-widest text-xs text-primary mb-4 block"
                    />
                {/if}

                {#if headline}
                    <Headline
                            {headline}
                            class="heading-section mb-6"
                    />
                {/if}

                {#if content}
                    <div class="prose prose-lg text-iron-muted dark:text-limestone-300 font-sans leading-relaxed">
                        <BaseText content={content} />
                    </div>
                {/if}
            </div>
        </div>

        <!-- Image Side - Edge to Edge in the container -->
        {#if image}
            <div
                    class="flex-1 relative min-h-[300px] md:min-h-full"
                    data-directus={setAttr({ collection: 'block_split', item: id, fields: ['image', 'layout'], mode: 'modal' })}
            >
                <DirectusImage
                        uuid={image}
                        alt={tagline || headline || 'Split Image'}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        class="w-full h-full object-cover absolute inset-0"
                />
            </div>
        {/if}
    </div>
</section>