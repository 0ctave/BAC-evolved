<script lang="ts">
	import type { WithElementRef, WithoutChildren } from 'bits-ui';
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> = $props();
</script>

<textarea
	bind:this={ref}
	class={cn(
		'border-iron/20 dark:border-limestone-100/20 text-iron dark:text-limestone-50 ring-offset-background placeholder:text-iron-muted/40 dark:placeholder:text-limestone-400/30 focus-visible:border-primary focus-visible:bg-limestone-50/50 dark:focus-visible:bg-iron-light/10 flex min-h-[80px] w-full resize-y rounded-none border-b-2 bg-transparent px-0 py-3 text-base font-medium transition-all duration-300 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	bind:value
	{...restProps}
></textarea>
