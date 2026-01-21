<script lang="ts">
	import DirectusImage from '../shared/DirectusImage.svelte';
	import {
		Dialog,
		DialogClose,
		DialogContent,
		DialogDescription,
		DialogOverlay,
		DialogTitle
	} from '../ui/dialog';

	import { ArrowLeft, ArrowRight, ZoomIn, X } from '@lucide/svelte';
	import Headline from '../ui/Headline.svelte';
	import Tagline from '../ui/Tagline.svelte';
	import setAttr from '$lib/directus/visualEditing';

	interface GalleryProps {
		data: {
			id: string;
			tagline?: string;
			headline?: string;
			items: Array<{
				id: string;
				directus_file: string;
				sort?: number;
			}>;
		};
	}

	let { data }: GalleryProps = $props();
	const { tagline, headline, items = [], id } = $derived(data);
	let isLightboxOpen = $state(false);
	let currentIndex = $state(0);

	let sortedItems = $derived(items ? [...items].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)) : []);
	const isValidIndex = $derived(
			sortedItems.length > 0 && currentIndex >= 0 && currentIndex < sortedItems.length
	);

	const handleOpenLightbox = (index: number) => {
		currentIndex = index;
		isLightboxOpen = true;
	};
	const handlePrev = () => {
		if (currentIndex > 0) currentIndex--;
	};

	const handleNext = () => {
		if (currentIndex < sortedItems.length - 1) {
			currentIndex++;
		} else {
			currentIndex = 0;
		}
	};
</script>

<section class="p-8 md:p-12">
	<div class="text-center mb-12 max-w-2xl mx-auto">
		{#if tagline}
			<Tagline
					{tagline}
					class="font-heading font-bold uppercase tracking-widest text-xs text-primary mb-3"
					data-directus={setAttr({ collection: 'block_gallery', item: id, fields: 'tagline', mode: 'popover' })}
			/>
		{/if}
		{#if headline}
			<Headline
					{headline}
					class="heading-section !mb-0"
					data-directus={setAttr({ collection: 'block_gallery', item: id, fields: 'headline', mode: 'popover' })}
			/>
		{/if}
	</div>

	{#if sortedItems.length > 0}
		<div
				class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto"
				data-directus={setAttr({ collection: 'block_gallery', item: id, fields: 'items', mode: 'modal' })}
		>
			{#each sortedItems as item, index}
				<button
						class="relative h-[300px] w-full overflow-hidden group rounded-lg shadow-sm hover:shadow-md transition-all"
						onclick={() => handleOpenLightbox(index)}
						aria-label={`Gallery item ${item.id}`}
				>
					<DirectusImage
							uuid={item.directus_file}
							alt={`Gallery item ${item.id}`}
							fill
							sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
							class="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
					/>
					<div
							class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
					>
						<div class="bg-white text-primary p-3 rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-100">
							<ZoomIn class="size-6" />
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Lightbox -->
	{#if isLightboxOpen && isValidIndex}
		<Dialog open={isLightboxOpen} onOpenChange={() => (isLightboxOpen = false)}>
			<DialogOverlay class="fixed inset-0 z-50 bg-[#181719]/95 backdrop-blur-md" />
			<DialogContent
					class="z-50 flex max-h-full max-w-full items-center justify-center border-none bg-transparent p-4 outline-none"
			>
				<DialogTitle class="sr-only">Gallery Image</DialogTitle>
				<DialogDescription class="sr-only">
					Viewing image {currentIndex + 1} of {sortedItems.length}.
				</DialogDescription>

				<!-- Wrapper: frame-atelier to match theme -->
				<div class="frame-atelier relative flex h-[85vh] w-auto max-w-[95vw] items-center justify-center p-1 !rotate-0 shadow-2xl bg-white">
					<DirectusImage
							uuid={sortedItems[currentIndex].directus_file}
							alt={`Gallery item ${sortedItems[currentIndex].id}`}
							width={1600}
							height={1200}
							class="h-full w-full object-contain"
					/>
				</div>

				<div class="absolute inset-x-0 bottom-8 flex items-center justify-center gap-8 pointer-events-none">
					<button
							class="pointer-events-auto btn-atelier-dark rounded-full px-6 py-3"
							onclick={handlePrev}
							aria-label="Previous"
					>
						<ArrowLeft class="size-5" />
						<span class="font-bold text-sm uppercase tracking-widest hidden sm:inline">Prev</span>
					</button>
					<button
							class="pointer-events-auto btn-atelier-dark rounded-full px-6 py-3"
							onclick={handleNext}
							aria-label="Next"
					>
						<span class="font-bold text-sm uppercase tracking-widest hidden sm:inline">Next</span>
						<ArrowRight class="size-5" />
					</button>
				</div>
				<DialogClose>
					<button
							class="absolute right-6 top-6 rounded-full bg-white text-iron hover:text-primary p-2 shadow-lg hover:rotate-90 transition-all duration-300"
							aria-label="Close"
					>
						<X class="size-6" />
					</button>
				</DialogClose>
			</DialogContent>
		</Dialog>
	{/if}
</section>