<script lang="ts">
	import setAttr from '$lib/directus/visualEditing';
	import { cn } from '$lib/utils';
	import Headline from '../ui/Headline.svelte';
	import Tagline from '../ui/Tagline.svelte';
	import Text from '../ui/Text.svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { reveal } from '$lib/actions';

	interface RichTextProps {
		data: {
			id: string;
			headline?: string;
			content: string;
			alignment?: 'left' | 'center' | 'right';
			tagline?: string;
		};
		class?: string;
	}

	let { data, class: className }: RichTextProps = $props();

	const { headline, content, alignment = 'left', tagline, id } = $derived(data);

	let visible = $state(false);
</script>

<div
	class="panel-backdrop border rounded-none p-8 max-md:rounded-none md:p-16"
	use:reveal
	onreveal={() => (visible = true)}
>
	{#if visible}
		<div
			class={cn(
				'mx-auto max-w-[800px]',
				alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left',
				className
			)}
			in:fly={{ y: 30, duration: 800, easing: cubicOut }}
		>
			{#if tagline}
				<div in:fly={{ y: 15, duration: 600, delay: 200 }} class="mb-2">
					<Tagline
						{tagline}
						class="text-primary block text-xs font-bold tracking-[0.2em] uppercase"
						data-directus={setAttr({
							collection: 'block_richtext',
							item: id,
							fields: 'tagline',
							mode: 'popover'
						})}
					/>
				</div>
			{/if}

			{#if headline}
				<div in:fly={{ y: 20, duration: 600, delay: 350 }}>
					<Headline
						{headline}
						class="heading-section mb-10 !text-3xl leading-tight md:!text-5xl"
						data-directus={setAttr({
							collection: 'block_richtext',
							item: id,
							fields: 'headline',
							mode: 'popover'
						})}
					/>
				</div>
			{/if}

			{#if content}
				<div i
					 n:fly={{ y: 20, duration: 600, delay: 500 }}>
					<Text
						{content}
						data-directus={setAttr({
							collection: 'block_richtext',
							item: id,
							fields: 'content',
							mode: 'drawer'
						})}
					/>
				</div>
			{/if}
		</div>
	{/if}
</div>
