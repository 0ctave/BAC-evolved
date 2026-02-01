<script lang="ts">
	import { toggleMode, mode } from 'mode-watcher';
	import { cn } from '$lib/utils';

	interface props {
		class?: string;
	}

	let { class: className }: props = $props();

	// We assume mode is a reactive object from mode-watcher (Svelte 5 version)
	// Access mode.current directly without $
	const currentMode = $derived(mode?.current);
</script>

<button
		onclick={toggleMode}
		class={cn(
		"relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
		/* Track Colors */
		"bg-limestone-200 border-iron/10", // Light
		"dark:bg-iron dark:border-limestone-100/10", // Dark
		className
	)}
		aria-label="Toggle Dark Mode"
		title="Toggle Dark Mode"
>
	<span class="sr-only">Toggle Dark Mode</span>

	<!-- Track Decoration Icons (Behind thumb) -->
	<!-- Moon visible on the right when thumb is left (Light Mode) -->
	<span class="absolute right-1.5 flex h-5 w-5 items-center justify-center text-iron-muted/40 transition-opacity duration-300"
		  class:opacity-0={currentMode === 'dark'}
		  class:opacity-100={currentMode !== 'dark'}>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
    </span>

	<!-- Sun visible on the left when thumb is right (Dark Mode) -->
	<span class="absolute left-1.5 flex h-5 w-5 items-center justify-center text-iron-muted/40 transition-opacity duration-300"
		  class:opacity-0={currentMode !== 'dark'}
		  class:opacity-100={currentMode === 'dark'}>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
    </span>

	<!-- Sliding Thumb -->
	<span
			class={cn(
			"pointer-events-none relative block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] flex items-center justify-center border border-black/5 dark:border-white/10 dark:bg-iron-light",
			currentMode === 'dark' ? "translate-x-7" : "translate-x-0.5"
		)}
	>
        <!-- Icon inside Thumb: Sun (Light Mode) -->
        <span class="absolute inset-0 flex items-center justify-center transition-all duration-300"
			  class:opacity-0={currentMode === 'dark'}
			  class:rotate-90={currentMode === 'dark'}
			  class:scale-0={currentMode === 'dark'}
			  class:opacity-100={currentMode !== 'dark'}
			  class:rotate-0={currentMode !== 'dark'}
			  class:scale-100={currentMode !== 'dark'}>
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500 fill-amber-500/20"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        </span>

		<!-- Icon inside Thumb: Moon (Dark Mode) -->
        <span class="absolute inset-0 flex items-center justify-center transition-all duration-300"
			  class:opacity-0={currentMode !== 'dark'}
			  class:-rotate-90={currentMode !== 'dark'}
			  class:scale-0={currentMode !== 'dark'}
			  class:opacity-100={currentMode === 'dark'}
			  class:rotate-0={currentMode === 'dark'}
			  class:scale-100={currentMode === 'dark'}>
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary fill-primary/20"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </span>
    </span>
</button>