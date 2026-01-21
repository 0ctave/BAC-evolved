<script lang="ts">
	interface TitleProps {
		title?: string | null;
		class?: string;
		as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
	}

	let { title, as = 'h2', ...props }: TitleProps = $props();
</script>

{#if title}
	<svelte:element
			this={as}
			class="font-heading font-bold text-iron dark:text-limestone-100 {props.class}
         text-lg md:text-xl lg:text-2xl"
	>
		{title}
	</svelte:element>
{/if}