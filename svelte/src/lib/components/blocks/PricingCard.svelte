<script lang="ts">
	import { CheckCircle2 } from '@lucide/svelte';
	import { Badge } from '../ui/badge';
	import { Separator } from '../ui/separator';
	import setAttr from '$lib/directus/visualEditing';
	import Button from './Button.svelte';
	import type { ButtonVariant } from '../ui/button';

	interface PricingCardProps {
		card: {
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
		};
	}

	let { card }: PricingCardProps = $props();
</script>

<div
		class={`flex max-w-[600px] flex-col rounded-xl border-2 p-8 md:min-h-[450px] transition-all duration-300 bg-white dark:bg-[#252426] ${
		card.is_highlighted
            ? 'border-primary shadow-retro-primary -translate-y-2'
            : 'border-iron/10 dark:border-limestone-100/10 shadow-retro dark:shadow-none hover:-translate-y-1 hover:border-primary/50'
	}`}
>
	<!-- Header -->
	<div class="mb-6 flex items-start justify-between gap-2">
		{#if card.title}
			<h3
					class="font-heading font-bold text-2xl text-iron dark:text-limestone-50 uppercase tracking-wide"
					data-directus={setAttr({
					collection: 'block_pricing_cards',
					item: card.id,
					fields: ['title'],
					mode: 'popover'
				})}
			>
				{card.title}
			</h3>
		{/if}
		{#if card.badge}
			<div class="flex-shrink-0">
				<Badge
						variant={card.is_highlighted ? 'default' : 'outline'}
						class="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-primary text-primary"
						data-directus={setAttr({
						collection: 'block_pricing_cards',
						item: card.id,
						fields: ['badge'],
						mode: 'popover'
					})}
				>
					{card.badge}
				</Badge>
			</div>
		{/if}
	</div>

	{#if card.price}
		<p
				data-directus={setAttr({
				collection: 'block_pricing_cards',
				item: card.id,
				fields: ['price'],
				mode: 'popover'
			})}
				class="text-5xl font-heading font-black text-primary mb-2"
		>
			{card.price}
		</p>
	{/if}
	{#if card.description}
		<p
				data-directus={setAttr({
				collection: 'block_pricing_cards',
				item: card.id,
				fields: ['description'],
				mode: 'popover'
			})}
				class="text-iron-muted dark:text-limestone-400 font-serif italic text-lg"
		>
			{card.description}
		</p>
	{/if}

	<div class="my-8 border-t-2 border-dashed border-iron/10 dark:border-limestone-100/10"></div>

	{#if card.features && Array.isArray(card.features)}
		<div class="flex-grow">
			<ul
					class="space-y-4"
					data-directus={setAttr({
					collection: 'block_pricing_cards',
					item: card.id,
					fields: ['features'],
					mode: 'popover'
				})}
			>
				{#each card.features as feature}
					<li class="flex items-start gap-3 text-iron dark:text-limestone-100">
						<div class="mt-1 text-primary">
							<CheckCircle2 class="size-5" />
						</div>
						<p class="leading-relaxed font-medium">{feature}</p>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<div class="mt-8 pt-4">
		{#if card.button}
			<div
					data-directus={setAttr({
					collection: 'block_button',
					item: card.button.id,
					fields: ['type', 'label', 'variant', 'url', 'page', 'post'],
					mode: 'popover'
				})}
			>
				<Button
						id={card.button.id}
						block={true}
						variant={card.button.variant as ButtonVariant}
						url={card.button.url}
						label={card.button.label}
				></Button>
			</div>
		{/if}
	</div>
</div>