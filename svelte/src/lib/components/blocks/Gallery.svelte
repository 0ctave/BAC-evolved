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
	import { fade, fly, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { reveal } from '$lib/actions';

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
	let visible = $state(false);

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

<section class="p-8 md:p-12" use:reveal onreveal={() => (visible = true)}>
	{#if visible}
		<div class="mx-auto mb-12 max-w-2xl text-center" in:fly={{ y: -20, duration: 800 }}>
			{#if tagline}
				<Tagline
					{tagline}
					class="font-heading text-primary mb-3 text-xs font-bold tracking-widest uppercase"
					data-directus={setAttr({
						collection: 'block_gallery',
						item: id,
						fields: 'tagline',
						mode: 'popover'
					})}
				/>
			{/if}
			{#if headline}
				<Headline
					{headline}
					class="heading-section !mb-0"
					data-directus={setAttr({
						collection: 'block_gallery',
						item: id,
						fields: 'headline',
						mode: 'popover'
					})}
				/>
			{/if}
		</div>

		{#if sortedItems.length > 0}
			<div
				class="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
				data-directus={setAttr({
					collection: 'block_gallery',
					item: id,
					fields: 'items',
					mode: 'modal'
				})}
			>
				{#each sortedItems as item, index (item.id)}
					<div in:scale={{ duration: 600, delay: index * 100, easing: cubicOut }}>
						<button
							class="group relative h-[300px] w-full overflow-hidden rounded-lg shadow-sm transition-all hover:shadow-md"
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
								<div
									class="text-primary scale-0 transform rounded-full bg-white p-3 shadow-lg transition-transform delay-100 duration-300 group-hover:scale-100"
								>
									<ZoomIn class="size-6" />
								</div>
							</div>
						</button>
					</div>
				{/each}
			</div>
		{/if}
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
				<div
					class="frame-atelier relative flex h-[85vh] w-auto max-w-[95vw] !rotate-0 items-center justify-center bg-white p-1 shadow-2xl"
					in:scale={{ duration: 400, start: 0.9, easing: cubicOut }}
				>
					<DirectusImage
						uuid={sortedItems[currentIndex].directus_file}
						alt={`Gallery item ${sortedItems[currentIndex].id}`}
						width={1600}
						height={1200}
						class="h-full w-full object-contain"
					/>
				</div>

				<div
					class="pointer-events-none absolute inset-x-0 bottom-8 flex items-center justify-center gap-8"
				>
					<button
						class="btn-atelier-dark pointer-events-auto rounded-full px-6 py-3"
						onclick={handlePrev}
						aria-label="Previous"
					>
						<ArrowLeft class="size-5" />
						<span class="hidden text-sm font-bold tracking-widest uppercase sm:inline">Prev</span>
					</button>
					<button
						class="btn-atelier-dark pointer-events-auto rounded-full px-6 py-3"
						onclick={handleNext}
						aria-label="Next"
					>
						<span class="hidden text-sm font-bold tracking-widest uppercase sm:inline">Next</span>
						<ArrowRight class="size-5" />
					</button>
				</div>
				<DialogClose>
					<button
						class="text-iron hover:text-primary absolute top-6 right-6 rounded-full bg-white p-2 shadow-lg transition-all duration-300 hover:rotate-90"
						aria-label="Close"
					>
						<X class="size-6" />
					</button>
				</DialogClose>
			</DialogContent>
		</Dialog>
	{/if}
</section>
