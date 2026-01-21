<!-- Made by Alex -->
<!-- Not ShadCN -->

<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type SemanticElement =
			| 'div'
			| 'section'
			| 'main'
			| 'article'
			| 'aside'
			| 'nav'
			| 'header'
			| 'footer'
			| 'form';

	interface ContainerProps {
		class?: string;
		as?: SemanticElement;
		children: Snippet;
		role?: string;
	}

	const { class: className, as: Component = 'div', children }: ContainerProps = $props();
</script>

<svelte:element
		this={Component}
		class={cn('mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 transition-all duration-300', className)}
>
	{@render children()}
</svelte:element>