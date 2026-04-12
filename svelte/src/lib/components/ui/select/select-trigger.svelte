<script lang="ts">
	import { Select as SelectPrimitive, type WithoutChild } from 'bits-ui';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChild<SelectPrimitive.TriggerProps> = $props();
</script>

<SelectPrimitive.Trigger
	bind:ref
	class={cn(
		'border-iron/20 dark:border-limestone-100/20 text-iron dark:text-limestone-50 ring-offset-background placeholder:text-iron-muted/40 dark:placeholder:text-limestone-400/30 focus:border-primary focus:bg-limestone-50/50 dark:focus:bg-iron-light/10 data-[placeholder]:text-iron-muted/40 dark:data-[placeholder]:text-limestone-400/40 flex h-12 w-full items-center justify-between rounded-none border-b-2 bg-transparent px-0 py-3 text-base font-medium transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<ChevronDown class="size-4 opacity-50" />
</SelectPrimitive.Trigger>
