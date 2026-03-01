<script lang="ts">
    import { cn } from '$lib/utils';
    import BaseText from '$lib/components/ui/Text.svelte';
    import Headline from '../ui/Headline.svelte';
    import Tagline from '../ui/Tagline.svelte';
    import setAttr from '$lib/directus/visualEditing';
    import { onMount } from 'svelte';
    import RichText from "$lib/components/blocks/RichText.svelte";
    import Text from "$lib/components/ui/Text.svelte";

    interface Props {
        data: {
            id: string;
            headline: string;
            tagline: string;
            address: string;
            description?: string;
            layout: 'map_left' | 'map_right';
            carte: any; // Matches your schema; usually arrives as an object from the API
            zoom?: number;
        };
    }

    let { data }: Props = $props();
    const {
        id,
        headline,
        tagline,
        address,
        description,
        layout,
        carte,
        zoom = 15
    } = $derived(data);

    // Parse location data safely
    const coords = $derived.by(() => {
        try {
            if (!carte) return null;

            // Handle both raw string and pre-parsed object
            const geojson = typeof carte === 'string' ? JSON.parse(carte) : carte;

            if (geojson && geojson.type === 'Point' && Array.isArray(geojson.coordinates)) {
                return {
                    lng: geojson.coordinates[0],
                    lat: geojson.coordinates[1]
                };
            }
        } catch (e) {
            // This catch handles cases where 'carte' might be a malformed string
            console.error('MapBlock: Error processing coordinate data', e);
        }
        return null;
    });

    // --- Scroll Logic for the "Sliding" Text Container ---
    let scrollY = $state(0);
    let sectionRef = $state<HTMLElement>();
    let isDesktop = $state(false);

    const textDrift = $derived.by(() => {
        if (!isDesktop || !sectionRef) return 0;
        const rect = sectionRef.getBoundingClientRect();
        const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1000;
        const sectionCenter = rect.top + rect.height / 2;
        const viewportCenter = windowHeight / 2;
        return (viewportCenter - sectionCenter) * 0.12;
    });

    onMount(() => {
        const updateMedia = () => (isDesktop = window.innerWidth >= 768);
        updateMedia();
        window.addEventListener('resize', updateMedia);
        return () => window.removeEventListener('resize', updateMedia);
    });

    // Calculate bbox for OpenStreetMap embed
    const delta = $derived(0.01 / Math.pow(2, zoom - 13));
    const bbox = $derived(
        coords
            ? [coords.lng - delta, coords.lat - delta, coords.lng + delta, coords.lat + delta].join(',')
            : ''
    );

    const mapUrl = $derived(
        coords
            ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lng}`
            : ''
    );
</script>

<svelte:window bind:scrollY />

<section
        bind:this={sectionRef}
        class="mx-auto w-full p-0 panel-backdrop rounded-none overflow-hidden"
>
    <div
            class={cn(
			'relative flex flex-col md:flex-row h-full min-h-[600px] md:items-start',
			layout === 'map_right' ? '' : 'md:flex-row-reverse'
		)}
    >
        <!-- Text Content Side -->
        <div class="flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-center">
            <div
                    class="transition-transform duration-75 ease-out will-change-transform md:sticky md:top-32"
                    data-directus={setAttr({
					collection: 'block_map',
					item: id,
					fields: ['headline', 'address', 'description'],
					mode: 'popover'
				})}
            >
                {#if tagline}
                    <Tagline
                            {tagline}
                            class="font-heading font-bold uppercase tracking-widest text-xs text-primary mb-4 block"
                    />
                {/if}

                {#if headline}
                    <Headline {headline} class="heading-section mb-6" />
                {/if}

                <div class="space-y-6">
                    {#if address}
                        <div class="flex flex-col gap-1">
                            <span class="text-xs font-bold uppercase tracking-tighter text-primary/60">Address</span>
                            <p class="text-2xl font-heading italic text-iron dark:text-limestone-50">
                                {address}
                            </p>
                        </div>
                    {/if}

                    {#if description}
                        <div class="prose prose-lg text-iron-muted dark:text-limestone-300 font-sans text-xl leading-relaxed">
                            <Text content={description} />
                        </div>
                    {/if}
                </div>

                <!-- Action Link to external map -->
                {#if coords}
                    <div class="mt-10">
                        <a
                                href="https://www.google.com/maps/search/?api=1&query={coords.lat},{coords.lng}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="btn-atelier-outline text-xs"
                        >
                            Itinéraire
                        </a>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Map Side -->
        <div
                class="flex-1 relative min-h-[400px] md:min-h-[70vh] bg-limestone-100 dark:bg-iron-light/10 grayscale-[0.5] hover:grayscale-0 transition-all duration-700"
                data-directus={setAttr({
				collection: 'block_map',
				item: id,
				fields: ['carte', 'layout'],
				mode: 'modal'
			})}
        >
            {#if coords}
                <iframe
                        title="Location Map"
                        width="100%"
                        height="100%"
                        frameborder="0"
                        scrolling="no"
                        marginheight="0"
                        marginwidth="0"
                        src={mapUrl}
                        class="absolute inset-0 w-full h-full border-0"
                        style="filter: contrast(1.1) brightness(0.9);"
                ></iframe>
            {:else}
                <div class="absolute inset-0 flex items-center justify-center text-iron-muted italic p-8 text-center">
                    Location data unavailable or malformed.
                </div>
            {/if}

            <!-- Decorative Overlay for Atelier look -->
            <div class="absolute inset-0 pointer-events-none border-l-2 md:border-l-0 md:border-x-2 border-black/10 dark:border-white/10"></div>
        </div>
    </div>
</section>

<style>
    iframe {
        transition: filter 0.5s ease;
    }
</style>