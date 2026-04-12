<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: SelectPrimitive.GroupHeadingProps = $props();
</script>

<SelectPrimitive.GroupHeading
	bind:ref
	class={cn(
		'text-iron-muted dark:text-limestone-400 py-1.5 pr-2 pl-8 text-xs font-bold tracking-widest uppercase',
		className
	)}
	{...restProps}
/>
