<script lang="ts">
	import type { PageBlock } from '$lib/types/directus-schema';
	import BaseBlock from '../blocks/BaseBlock.svelte';
	import Container from '../ui/Container.svelte';

	interface PageBuilderProps {
		sections: PageBlock[];
	}

	let { sections }: PageBuilderProps = $props();

	// DEBUG: Trace what the component actually receives
	$effect(() => {
		if (!sections || sections.length === 0) {
			console.warn('[PageBuilder] No sections provided to PageBuilder!');
		}
	});

	const validBlocks = $derived(
			(sections || []).filter(
					(block): block is PageBlock & { collection: string; item: object } => {
						const hasCollection = !!block.collection && typeof block.collection === 'string';
						const hasItem = !!block.item && typeof block.item === 'object';
						const isNotHidden = block.hide_block !== true;
						return hasCollection && hasItem && isNotHidden;
					}
			)
	);
</script>

{#if !sections || sections.length === 0}
	<div class="py-10 text-center text-gray-400">
		<p>No content blocks found.</p>
	</div>
{/if}

{#each validBlocks as block (block.id)}
	<!--
       Mobile: No vertical padding (py-0), content spans full width.
       Desktop: Standard padding (md:py-10), floating cards.
    -->
	<div class="py-2 md:py-10" data-background={block.background} data-collection={block.collection}>
		<!--
           We use a div instead of Container on mobile to force full width
           (assuming Container adds px-4 or similar).
           On desktop, we want the constraints.
        -->
		<div class="w-full md:container md:mx-auto md:px-4">
			<!--
                GLOBAL WRAPPER:
                Mobile: Square corners (rounded-none), no border radius.
                Desktop: Large rounded corners (md:rounded-[2rem]).
            -->
			<div>
				<BaseBlock {block} />
			</div>
		</div>
	</div>
{/each}