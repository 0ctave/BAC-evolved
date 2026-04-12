<script lang="ts">
	import { cn } from '$lib/utils';
	import Headline from '../ui/Headline.svelte';
	import Tagline from '../ui/Tagline.svelte';
	import setAttr from '$lib/directus/visualEditing';
	import Text from '$lib/components/ui/Text.svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { reveal } from '$lib/actions';

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
	const { id, headline, tagline, address, description, layout, carte, zoom = 15 } = $derived(data);

	let visible = $state(false);

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
	class="panel-backdrop mx-auto w-full overflow-hidden rounded-none p-0 max-md:rounded-none"
	use:reveal
	onreveal={() => (visible = true)}
>
	{#if visible}
		<div
			class={cn(
				'relative flex h-full min-h-[600px] flex-col md:flex-row md:items-start',
				layout === 'map_right' ? '' : 'md:flex-row-reverse'
			)}
			in:fly={{ y: 40, duration: 800, easing: cubicOut }}
		>
			<!-- Text Content Side -->
			<div class="flex flex-1 flex-col justify-center p-8 md:p-16 lg:p-24">
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
						<div in:fly={{ x: -20, duration: 600, delay: 200 }}>
							<Tagline
								{tagline}
								class="font-heading text-primary mb-4 block text-xs font-bold tracking-widest uppercase"
							/>
						</div>
					{/if}

					{#if headline}
						<div in:fly={{ x: -20, duration: 600, delay: 350 }}>
							<Headline {headline} class="heading-section mb-6" />
						</div>
					{/if}

					<div class="space-y-6">
						{#if address}
							<div class="flex flex-col gap-1" in:fly={{ x: -20, duration: 600, delay: 500 }}>
								<span class="text-primary/60 text-xs font-bold tracking-tighter uppercase"
									>Address</span
								>
								<p class="font-heading text-iron dark:text-limestone-50 text-2xl italic">
									{address}
								</p>
							</div>
						{/if}

						{#if description}
							<div
								class="text-body prose max-w-none text-base leading-relaxed md:prose-lg md:text-xl"
								in:fly={{ x: -20, duration: 600, delay: 650 }}
							>
								<Text content={description} />
							</div>
						{/if}
					</div>

					<!-- Action Link to external map -->
					{#if coords}
						<div class="mt-10" in:fly={{ y: 20, duration: 600, delay: 800 }}>
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
				class="bg-limestone-100 dark:bg-iron-light/10 relative min-h-[400px] flex-1 grayscale-[0.5] transition-all duration-700 hover:grayscale-0 md:min-h-[70vh]"
				data-directus={setAttr({
					collection: 'block_map',
					item: id,
					fields: ['carte', 'layout'],
					mode: 'modal'
				})}
				in:fade={{ duration: 1000, delay: 400 }}
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
						class="absolute inset-0 h-full w-full border-0"
						style="filter: contrast(1.1) brightness(0.9);"
					></iframe>
				{:else}
					<div
						class="text-iron-muted absolute inset-0 flex items-center justify-center p-8 text-center italic"
					>
						Location data unavailable or malformed.
					</div>
				{/if}

				<!-- Decorative Overlay for Atelier look -->
				<div
					class="pointer-events-none absolute inset-0 border-l-2 border-black/10 md:border-x-2 md:border-l-0 dark:border-white/10"
				></div>
			</div>
		</div>
	{/if}
</section>

<style>
	iframe {
		transition: filter 0.5s ease;
	}
</style>
