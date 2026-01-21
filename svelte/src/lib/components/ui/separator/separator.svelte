<script lang="ts">
	import { Separator as SeparatorPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		orientation = 'horizontal',
		...restProps
	}: SeparatorPrimitive.RootProps = $props();
</script>

<SeparatorPrimitive.Root
		bind:ref
		class={cn(
		'bg-iron/10 dark:bg-limestone-100/10 shrink-0',
		orientation === 'horizontal' ? 'h-[2px] w-full' : 'min-h-full w-[2px]',
		className
	)}
		{orientation}
		{...restProps}
/>