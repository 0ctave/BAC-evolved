<script lang="ts">
	interface Props {
		headline?: string | null;
		as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
		[key: string]: any;
		'data-directus'?: string;
	}

	let { headline, as = 'p', 'data-directus': dataDirectus, ...props }: Props = $props();
</script>

{#if headline}
	<svelte:element
			this={as}
			class="font-heading font-bold text-iron dark:text-limestone-50 {props.class}
         text-4xl md:text-5xl lg:text-6xl leading-tight"
			data-directus={dataDirectus}
	>
		{headline}
	</svelte:element>
{/if}