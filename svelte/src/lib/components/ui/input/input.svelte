<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { InputEvents } from './index.js';
	import { cn } from '$lib/utils.js';

	type $$Props = HTMLInputAttributes;
	type $$Events = InputEvents;

	let className: $$Props['class'] = undefined;
	export let value: $$Props['value'] = undefined;
	export { className as class };

	export let readonly: $$Props['readonly'] = undefined;
</script>

<input
		class={cn(
		'flex h-12 w-full bg-transparent border-b-2 border-iron/20 dark:border-limestone-100/20 px-0 py-3 text-base font-medium text-iron dark:text-limestone-50 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-iron-muted/40 dark:placeholder:text-limestone-400/30 focus-visible:outline-none focus-visible:border-primary focus-visible:bg-limestone-50/50 dark:focus-visible:bg-iron-light/10 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 rounded-none',
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