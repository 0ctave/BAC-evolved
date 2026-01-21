<script lang="ts">
	import { Checkbox as CheckboxPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import Check from '@lucide/svelte/icons/check';
	import Minus from '@lucide/svelte/icons/minus';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props();
</script>

<CheckboxPrimitive.Root
		bind:ref
		class={cn(
		'peer h-5 w-5 shrink-0 rounded-md border-2 border-iron/20 dark:border-limestone-100/20 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white transition-all duration-200',
		className
	)}
		bind:checked
		bind:indeterminate
		{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div class="flex items-center justify-center text-current w-full h-full">
			{#if indeterminate}
				<Minus class="size-3.5" />
			{:else}
				<Check class={cn('size-3.5', !checked && 'text-transparent')} />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>