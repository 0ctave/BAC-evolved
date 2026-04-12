<script lang="ts">
	import { cn } from '$lib/utils';
	import Button, { type ButtonProps } from './Button.svelte';

	interface ButtonGroupProps {
		buttons: Array<ButtonProps>;
		[key: string]: any;
	}

	let { buttons, ...props }: ButtonGroupProps = $props();
</script>

{#if buttons && buttons.length > 0}
	<div class={cn('flex flex-wrap items-center gap-4', props.class)}>
		{#each buttons as button (button)}
			<Button {...button} />
		{/each}
	</div>
{/if}
