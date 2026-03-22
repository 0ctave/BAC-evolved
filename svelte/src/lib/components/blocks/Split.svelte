<script lang="ts">
    import {cn} from '$lib/utils';
    import DirectusImage from '../shared/DirectusImage.svelte';
    import BaseText from '$lib/components/ui/Text.svelte';
    import Headline from '../ui/Headline.svelte';
    import Tagline from '../ui/Tagline.svelte';
    import setAttr from '$lib/directus/visualEditing';
    import ButtonGroup from "./ButtonGroup.svelte";
    import { ArrowLeft, ArrowRight } from '@lucide/svelte';

    interface Props {
        data: {
            id: string;
            headline: string;
            tagline: string;
            content: string; // Restored your original 'content' variable
            layout: 'image_left' | 'image_right';
            images?: any[]; // Array for single image or carousel
            bouton_groupe?: { // Restored your original 'bouton_groupe'
                id: string;
                buttons: Array<any>;
            };
        };
    }

    let {data}: Props = $props();
    const {headline, content, images = [], tagline, layout, bouton_groupe, id} = $derived(data);

    // Helper to safely extract the image UUID from strings or objects
    const getImageUrl = (img: any): string => {
        if (!img) return '';
        if (typeof img === 'string') return img;
        if (img.directus_files_id) {
            return typeof img.directus_files_id === 'string'
                ? img.directus_files_id
                : img.directus_files_id.id || '';
        }
        if (img.directus_file) return typeof img.directus_file === 'string' ? img.directus_file : img.directus_file.id || '';
        return '';
    };

    // Carousel state and logic
    const processedImages = $derived.by(() => {
        if (!images || !Array.isArray(images) || images.length === 0) return [];

        // If images are strings, map them into a consistent structure
        if (typeof images[0] === 'string') {
            return images.map((img, i) => ({ id: `img-${i}`, directus_files_id: img }));
        }

        // If objects, sort them by the sort field
        return [...images].sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
    });

    const isCarousel = $derived(processedImages.length > 1);

    let currentIndex = $state(0);
    let timer: ReturnType<typeof setInterval>;

    const next = () => {
        if (!isCarousel) return;
        currentIndex = (currentIndex + 1) % processedImages.length;
    };

    const prev = () => {
        if (!isCarousel) return;
        currentIndex = (currentIndex - 1 + processedImages.length) % processedImages.length;
    };

    const goTo = (index: number) => {
        currentIndex = index;
    };

    // Swipe interaction logic
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
        touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchMove = (e: TouchEvent) => {
        touchEndX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = () => {
        const threshold = 50; // Minimum swipe distance in pixels
        if (touchStartX - touchEndX > threshold) {
            next(); // Swiped left
        }
        if (touchStartX - touchEndX < -threshold) {
            prev(); // Swiped right
        }
        // Reset values
        touchStartX = 0;
        touchEndX = 0;
    };

    /*onMount(() => {
        startAutoPlay();
        return () => stopAutoPlay();
    });*/
</script>

<section class="mx-auto w-full p-0 panel-backdrop rounded-none overflow-hidden overflow-hidden">
    <!-- Padding removed, handled by container -->
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
                    <div class="prose prose-lg text-iron-muted dark:text-limestone-300 font-sans text-xl leading-relaxed">
                        <BaseText content={content}/>
                    </div>
                {/if}


                {#if bouton_groupe && bouton_groupe.buttons.length > 0}
                    <div
                            class={cn(
                            'mt-10 md:mt-12',
                            'w-full flex',
                            layout === 'image_right' ? 'justify-start' : 'justify-end'
                        )}
                            data-directus={setAttr({ collection: 'block_button_group', item: bouton_groupe.id, fields: 'buttons', mode: 'modal' })}
                    >
                        <ButtonGroup buttons={bouton_groupe.buttons} />
                    </div>
                {/if}
            </div>
        </div>

        <!-- Image Side - Edge to Edge in the container -->
        {#if processedImages.length > 0}
            <div
                    class="flex-1 relative min-h-[300px] md:min-h-full overflow-hidden"
                    data-directus={setAttr({ collection: 'block_split', item: id, fields: ['images', 'layout'], mode: 'modal' })}
            >
                {#if processedImages.length === 1}
                    <DirectusImage
                            uuid={getImageUrl(processedImages[0])}
                            alt={tagline || headline || 'Split Image'}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            class="w-full h-full object-cover absolute inset-0"
                    />
                {:else if isCarousel}
                    <div
                            class="absolute inset-0 w-full h-full"
                            ontouchstart={handleTouchStart}
                            ontouchmove={handleTouchMove}
                            ontouchend={handleTouchEnd}
                            role="region"
                            aria-roledescription="carousel"
                    >
                        <!-- Slides Track -->
                        <div
                                class="flex w-full h-full transition-transform duration-700 ease-in-out will-change-transform"
                                style={`transform: translateX(-${currentIndex * 100}%);`}
                        >
                            {#each processedImages as img, i (img.id || i)}
                                <div class="w-full h-full flex-shrink-0 relative" aria-hidden={currentIndex !== i}>
                                    <DirectusImage
                                            uuid={getImageUrl(img)}
                                            alt={`Split carousel slide ${i + 1}`}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            class="object-cover w-full h-full absolute inset-0"
                                    />
                                </div>
                            {/each}
                        </div>

                        <!-- Floating Controls -->
                        <button
                                class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white text-white hover:text-iron backdrop-blur-sm p-3 rounded-full shadow-lg transition-all z-10"
                                onclick={prev}
                                aria-label="Previous slide"
                        >
                            <ArrowLeft class="size-5" />
                        </button>

                        <button
                                class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white text-white hover:text-iron backdrop-blur-sm p-3 rounded-full shadow-lg transition-all z-10"
                                onclick={next}
                                aria-label="Next slide"
                        >
                            <ArrowRight class="size-5" />
                        </button>

                        <!-- Indicators -->
                        <div class="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2 z-10">
                            {#each processedImages as _, i}
                                <button
                                        class={cn(
                                        "h-2 rounded-full transition-all duration-300 shadow-sm",
                                        currentIndex === i
                                            ? "w-8 bg-white"
                                            : "w-2 bg-white/50 hover:bg-white/80"
                                    )}
                                        onclick={() => goTo(i)}
                                        aria-label={`Go to slide ${i + 1}`}
                                ></button>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</section>