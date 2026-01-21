<script lang="ts">
	import setAttr from '$lib/directus/visualEditing';
	import Headline from '../ui/Headline.svelte';
	import Tagline from '../ui/Tagline.svelte';
	import PricingCard from './PricingCard.svelte';

	interface PricingCardType {
		id: string;
		title: string;
		description?: string;
		price?: string;
		badge?: string;
		features?: string[];
		button?: {
			id: string;
			label: string | null;
			variant: string | null;
			url: string | null;
		};
		is_highlighted?: boolean;
	}

	interface PricingData {
		id: string;
		tagline?: string;
		headline?: string;
		pricing_cards: PricingCardType[];
	}

	interface PricingProps {
		data: PricingData;
	}

	const { data }: PricingProps = $props();
	const { tagline, headline, pricing_cards, id } = $derived(data);

	const gridClasses = $derived.by(() => {
		if (pricing_cards.length === 1) return 'grid-cols-1';
		if (pricing_cards.length === 2) return 'grid-cols-1 md:grid-cols-2';
		return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
	});

	const containerStyles = $derived(() => {
		pricing_cards.length <= 2 ? 'mx-auto max-w-4xl' : 'max-w-7xl mx-auto';
	});
</script>

{#if pricing_cards || Array.isArray(pricing_cards)}
	<section class="py-12 space-y-12">
		<div class="text-center">
			{#if tagline}
				<Tagline
						{tagline}
						class="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-2 inline-block border border-primary px-2 py-1"
						data-directus={setAttr({
                        collection: 'block_pricing',
                        item: id,
                        fields: 'tagline',
                        mode: 'popover'
                    })}
				/>
			{/if}
			{#if headline}
				<Headline
						{headline}
						class="mt-2 !font-heading !font-bold text-4xl text-iron dark:text-limestone-50"
						data-directus={setAttr({
                        collection: 'block_pricing',
                        item: id,
                        fields: 'headline',
                        mode: 'popover'
                    })}
				/>
			{/if}
		</div>

		<div
				class={`grid gap-8 ${gridClasses} ${containerStyles}`}
				data-directus={setAttr({
				collection: 'block_pricing',
				item: id,
				fields: ['pricing_cards'],
				mode: 'modal'
			})}
		>
			{#each pricing_cards as card (card.id)}
				<PricingCard {card} />
			{/each}
		</div>
	</section>
{/if}