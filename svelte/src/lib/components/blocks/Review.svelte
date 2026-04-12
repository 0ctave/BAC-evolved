<script lang="ts">
	import Headline from '../ui/Headline.svelte';
	import Tagline from '../ui/Tagline.svelte';
	import setAttr from '$lib/directus/visualEditing';
	import CommentList from '$lib/components/ui/CommentList.svelte';
	import { fade, fly } from 'svelte/transition';
	import { reveal } from '$lib/actions';

	interface Props {
		data: {
			id: string;
			headline?: string;
			tagline?: string;
			limit?: number;
		};
	}

	let { data }: Props = $props();
	const { id, headline, tagline, limit = 5 } = $derived(data);

	let visible = $state(false);
</script>

<!-- Le data-directus permet l'édition en live via l'admin Directus -->
<section
	class="relative z-10 mx-auto w-full overflow-hidden px-6 py-12 md:py-20"
	data-directus={setAttr({
		collection: 'block_reviews',
		item: id,
		fields: ['headline', 'tagline', 'limit'],
		mode: 'popover'
	})}
	use:reveal
	onreveal={() => (visible = true)}
>
	{#if visible}
		<!-- Block Content Area (Title & Tagline) -->
		<div class="mx-auto mb-12 max-w-4xl text-center md:mb-16" in:fly={{ y: -20, duration: 800 }}>
			{#if tagline}
				<Tagline
					{tagline}
					class="font-heading text-primary mb-3 block text-sm font-bold tracking-[0.2em] uppercase"
				/>
			{/if}

			{#if headline}
				<Headline {headline} class="heading-section !mb-0 text-4xl md:text-5xl" />
			{/if}
		</div>

		<!-- Logic Display Component -->
		<div class="mx-auto max-w-4xl" in:fade={{ duration: 1000, delay: 300 }}>
			<CommentList {limit} />
		</div>
	{/if}
</section>
