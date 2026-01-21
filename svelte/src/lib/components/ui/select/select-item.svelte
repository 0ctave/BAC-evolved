<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { Select as SelectPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		value,
		label,
		children: childrenProp,
		...restProps
	}: WithoutChild<SelectPrimitive.ItemProps> = $props();
</script>

<SelectPrimitive.Item
		bind:ref
		{value}
		class={cn(
		'relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm outline-none transition-colors data-[highlighted]:bg-limestone-50 dark:data-[highlighted]:bg-iron-light/30 data-[highlighted]:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
		className
	)}
		{...restProps}
>
	{#snippet children({ selected, highlighted })}
		<span class="absolute left-2 flex size-3.5 items-center justify-center">
			{#if selected}
				<Check class="size-4 text-primary" />
			{/if}
		</span>
		{#if childrenProp}
			{@render childrenProp({ selected, highlighted })}
		{:else}
			{label || value}
		{/if}
	{/snippet}
</SelectPrimitive.Item>