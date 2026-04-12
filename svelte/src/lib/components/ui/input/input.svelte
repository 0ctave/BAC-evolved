<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type $$Props = HTMLInputAttributes;

	let className: $$Props['class'] = undefined;
	export let value: $$Props['value'] = undefined;
	export { className as class };

	export let readonly: $$Props['readonly'] = undefined;
</script>

<input
	class={cn(
		'border-iron/20 dark:border-limestone-100/20 text-iron dark:text-limestone-50 ring-offset-background placeholder:text-iron-muted/40 dark:placeholder:text-limestone-400/30 focus-visible:border-primary focus-visible:bg-limestone-50/50 dark:focus-visible:bg-iron-light/10 flex h-12 w-full rounded-none border-b-2 bg-transparent px-0 py-3 text-base font-medium transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	bind:value
	{readonly}
	on:blur
	on:change
	on:click
	on:focus
	on:focusin
	on:focusout
	on:keydown
	on:keypress
	on:keyup
	on:mouseover
	on:mouseenter
	on:mouseleave
	on:mousemove
	on:paste
	on:input
	on:wheel|passive
	{...$$restProps}
/>
