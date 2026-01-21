<script lang="ts">
	import { toggleMode, mode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils';

	interface props {
		class?: string;
	}

	const { class: className }: props = $props();
</script>

<Button
		onclick={toggleMode}
		variant="outline"
		class={cn(
		'rounded-lg border-2 border-iron/10 bg-white p-2 transition-all duration-300',
        'hover:border-primary hover:shadow-retro-sm hover:-translate-y-0.5',
        'dark:border-limestone-100/20 dark:bg-[#252426] dark:hover:border-primary',
		className
	)}
>
	{#if mode.current === 'dark'}
		<svg
				xmlns="http://www.w3.org/2000/svg"
				class="size-5 text-limestone-100"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
		>
			<path
					d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0m-5 0h1m8-9v1m8 8h1m-9 8v1M5.6 5.6l.7.7m12.1-.7l-.7.7m0 11.4l.7.7m-12.1-.7l-.7.7"
			/>
		</svg>
	{:else}
		<svg
				xmlns="http://www.w3.org/2000/svg"
				class="size-5 text-iron"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
		>
			<path d="M12 3h.393a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 2.992z" />
		</svg>
	{/if}
	<span class="sr-only">Toggle theme</span>
</Button>