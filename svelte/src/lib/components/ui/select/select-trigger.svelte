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
		'flex h-12 w-full items-center justify-between bg-transparent border-b-2 border-iron/20 dark:border-limestone-100/20 px-0 py-3 text-base font-medium text-iron dark:text-limestone-50 ring-offset-background placeholder:text-iron-muted/40 dark:placeholder:text-limestone-400/30 focus:outline-none focus:border-primary focus:bg-limestone-50/50 dark:focus:bg-iron-light/10 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 rounded-none [&>span]:line-clamp-1 data-[placeholder]:text-iron-muted/40 dark:data-[placeholder]:text-limestone-400/40',
		className
	)}
		{...restProps}
>
	{@render children?.()}
	<ChevronDown class="size-4 opacity-50" />
</SelectPrimitive.Trigger>