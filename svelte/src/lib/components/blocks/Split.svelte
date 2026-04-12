<script lang="ts">
	import { cn } from '$lib/utils';
	import DirectusImage from '../shared/DirectusImage.svelte';
	import BaseText from '$lib/components/ui/Text.svelte';
	import Headline from '../ui/Headline.svelte';
	import Tagline from '../ui/Tagline.svelte';
	import setAttr from '$lib/directus/visualEditing';
	import ButtonGroup from './ButtonGroup.svelte';
	import { ArrowLeft, ArrowRight } from '@lucide/svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { reveal } from '$lib/actions';

	interface Props {
		data: {
			id: string;
			headline: string;
			tagline: string;
			content: string; // Restored your original 'content' variable
			layout: 'image_left' | 'image_right';
			images?: any[]; // Array for single image or carousel
			bouton_groupe?: {
				// Restored your original 'bouton_groupe'
				id: string;
				buttons: Array<any>;
			};
		};
	}

	let { data }: Props = $props();
	const { headline, content, images = [], tagline, layout, bouton_groupe, id } = $derived(data);

	let visible = $state(false);

	// Helper to safely extract the image UUID from strings or objects
	const getImageUrl = (img: any): string => {
		if (!img) return '';
		if (typeof img === 'string') return img;
		if (img.directus_files_id) {
			return typeof img.directus_files_id === 'string'
				? img.directus_files_id
				: img.directus_files_id.id || '';
		}
		if (img.directus_file)
			return typeof img.directus_file === 'string' ? img.directus_file : img.directus_file.id || '';
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

<section
	class="mx-auto w-full overflow-hidden p-0 px-6 py-12 md:py-20"
	use:reveal
	onreveal={() => (visible = true)}
>
	<!-- Padding removed, handled by container -->
	{#if visible}
		<div
			class={cn(
				'surface-atelier relative flex h-full flex-col md:flex-row',
				'max-md:rounded-none',
				layout === 'image_right' ? '' : 'md:flex-row-reverse'
			)}
			in:fly={{ y: 40, duration: 800, easing: cubicOut }}
		>
			<!-- Text Content Side -->
			<div class="flex flex-1 flex-col justify-center p-8 md:p-16">
				<div
					data-directus={setAttr({
						collection: 'block_split',
						item: id,
						fields: ['headline', 'content'],
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

					{#if content}
						<div
							class="text-body prose md:prose-lg max-w-none text-base leading-relaxed md:text-xl"
							in:fly={{ x: -20, duration: 600, delay: 500 }}
						>
							<BaseText {content} />
						</div>
					{/if}

					{#if bouton_groupe && bouton_groupe.buttons.length > 0}
						<div
							class={cn(
								'mt-10 md:mt-12',
								'flex w-full',
								layout === 'image_right' ? 'justify-start' : 'justify-end'
							)}
							data-directus={setAttr({
								collection: 'block_button_group',
								item: bouton_groupe.id,
								fields: 'buttons',
								mode: 'modal'
							})}
							in:fly={{ y: 20, duration: 600, delay: 650 }}
						>
							<ButtonGroup buttons={bouton_groupe.buttons} />
						</div>
					{/if}
				</div>
			</div>

			<!-- Image Side - Edge to Edge in the container -->
			{#if processedImages.length > 0}
				<div
					class="relative min-h-[300px] flex-1 overflow-hidden md:min-h-full"
					data-directus={setAttr({
						collection: 'block_split',
						item: id,
						fields: ['images', 'layout'],
						mode: 'modal'
					})}
					in:fade={{ duration: 800, delay: 400 }}
				>
					{#if processedImages.length === 1}
						<DirectusImage
							uuid={getImageUrl(processedImages[0])}
							alt={tagline || headline || 'Split Image'}
							fill
							sizes="(max-width: 768px) 100vw, 50vw"
							class="absolute inset-0 h-full w-full object-cover"
						/>
					{:else if isCarousel}
						<div
							class="absolute inset-0 h-full w-full"
							ontouchstart={handleTouchStart}
							ontouchmove={handleTouchMove}
							ontouchend={handleTouchEnd}
							role="region"
							aria-roledescription="carousel"
						>
							<!-- Slides Track -->
							<div
								class="flex h-full w-full transition-transform duration-700 ease-in-out will-change-transform"
								style={`transform: translateX(-${currentIndex * 100}%);`}
							>
								{#each processedImages as img, i (img.id || i)}
									<div
										class="relative h-full w-full flex-shrink-0"
										aria-hidden={currentIndex !== i}
									>
										<DirectusImage
											uuid={getImageUrl(img)}
											alt={`Split carousel slide ${i + 1}`}
											fill
											sizes="(max-width: 768px) 100vw, 50vw"
											class="absolute inset-0 h-full w-full object-cover"
										/>
									</div>
								{/each}
							</div>

							<!-- Floating Controls -->
							<button
								class="hover:text-iron absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-white"
								onclick={prev}
								aria-label="Previous slide"
							>
								<ArrowLeft class="size-5" />
							</button>

							<button
								class="hover:text-iron absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-white"
								onclick={next}
								aria-label="Next slide"
							>
								<ArrowRight class="size-5" />
							</button>

							<!-- Indicators -->
							<div
								class="absolute right-0 bottom-6 left-0 z-10 flex items-center justify-center gap-2"
							>
								{#each processedImages as _unused, i (i)}
									<button
										class={cn(
											'h-2 rounded-full shadow-sm transition-all duration-300',
											currentIndex === i ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
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
	{/if}
</section>
