<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { booking } from '$lib/logic/booking.svelte';

	let {
		adults = $bindable(),
		children = $bindable(),
		maxAdults,
		maxChildren,
		totalCapacity // NEW: Passed from parent to enforce room limits
	} = $props<{
		adults: number;
		children: number;
		maxAdults: number;
		maxChildren: number;
		totalCapacity: number;
	}>();

	// Derived to check current total against limit
	let currentTotal = $derived(adults + children);
	let isTotalMaxReached = $derived(currentTotal >= totalCapacity);

	// Translations
	const l = $derived(booking.labels);
</script>

<div class="space-y-4">
	<div class="flex items-baseline justify-between">
		<h4 class="text-iron dark:text-limestone-50 text-sm font-bold tracking-wide uppercase">
			{l.travelers_title}
		</h4>
		{#if isTotalMaxReached}
			<span
				in:fade
				class="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
			>
				{l.travelers_max_reached}
			</span>
		{/if}
	</div>

	<div class="grid {maxChildren > 0 ? 'grid-cols-2' : 'grid-cols-1'} gap-4">
		<!-- Adultes -->
		<div
			class="border-limestone-200 dark:border-iron-light flex flex-col items-center justify-center gap-2 rounded-2xl border bg-white p-3 shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-[#252426]"
		>
			<span class="text-iron-muted dark:text-limestone-400 text-xs font-bold"
				>{l.travelers_adults}</span
			>
			<div class="flex items-center gap-3">
				<button
					class="dark:bg-iron-light text-iron-muted dark:text-limestone-300 hover:text-primary dark:hover:text-primary hover:border-primary/30 border-limestone-100 dark:border-iron flex h-8 w-8 items-center justify-center rounded-xl border bg-white shadow-sm transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-30"
					onclick={() => (adults = Math.max(1, adults - 1))}
					disabled={adults <= 1}
				>
					<span class="mb-0.5 text-lg leading-none">-</span>
				</button>

				<span
					class="text-iron dark:text-limestone-50 relative flex h-8 w-6 items-center justify-center overflow-hidden text-lg font-bold tabular-nums select-none"
				>
					{#key adults}
						<span in:fly={{ y: 15, duration: 250 }} class="absolute">
							{adults}
						</span>
					{/key}
				</span>

				<button
					class="dark:bg-iron-light text-iron-muted dark:text-limestone-300 hover:text-primary dark:hover:text-primary hover:border-primary/30 border-limestone-100 dark:border-iron flex h-8 w-8 items-center justify-center rounded-xl border bg-white shadow-sm transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-30"
					onclick={() => adults++}
					disabled={adults >= maxAdults || isTotalMaxReached}
				>
					<span class="mb-0.5 text-lg leading-none">+</span>
				</button>
			</div>
		</div>

		<!-- Enfants -->
		{#if maxChildren > 0}
			<div
				class="border-limestone-200 dark:border-iron-light flex flex-col items-center justify-center gap-2 rounded-2xl border bg-white p-3 shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-[#252426]"
			>
				<span class="text-iron-muted dark:text-limestone-400 text-xs font-bold"
					>{l.travelers_children}</span
				>
				<div class="flex items-center gap-3">
					<button
						class="dark:bg-iron-light text-iron-muted dark:text-limestone-300 hover:text-primary dark:hover:text-primary hover:border-primary/30 border-limestone-100 dark:border-iron flex h-8 w-8 items-center justify-center rounded-xl border bg-white shadow-sm transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-30"
						onclick={() => (children = Math.max(0, children - 1))}
						disabled={children <= 0}
					>
						<span class="mb-0.5 text-lg leading-none">-</span>
					</button>

					<span
						class="text-iron dark:text-limestone-50 relative flex h-8 w-6 items-center justify-center overflow-hidden text-lg font-bold tabular-nums select-none"
					>
						{#key children}
							<span in:fly={{ y: 15, duration: 250 }} class="absolute">
								{children}
							</span>
						{/key}
					</span>

					<button
						class="dark:bg-iron-light text-iron-muted dark:text-limestone-300 hover:text-primary dark:hover:text-primary hover:border-primary/30 border-limestone-100 dark:border-iron flex h-8 w-8 items-center justify-center rounded-xl border bg-white shadow-sm transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-30"
						onclick={() => children++}
						disabled={children >= maxChildren || isTotalMaxReached}
					>
						<span class="mb-0.5 text-lg leading-none">+</span>
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
