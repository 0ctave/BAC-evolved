<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import type { PricingResult } from '$lib/logic/pricing';
	import { booking } from '$lib/logic/booking.svelte';

	let { priceEstimate, adults, children, isRoomSelected, hasDates } = $props<{
		priceEstimate: PricingResult | null;
		adults: number;
		children: number;
		isRoomSelected: boolean;
		hasDates: boolean;
	}>();

	// Translations
	const l = $derived(booking.labels);

	const displayedPrice = tweened(0, {
		duration: 800,
		easing: cubicOut
	});

	$effect(() => {
		if (priceEstimate?.total) {
			displayedPrice.set(priceEstimate.total);
		} else {
			displayedPrice.set(0);
		}
	});
</script>

<div class="border-limestone-100 dark:border-iron-light mt-auto border-t p-6">
	{#if priceEstimate}
		<!-- PRICE DISPLAY -->
		<div
			class="bg-primary/5 dark:bg-primary/10 border-primary/20 relative flex flex-col items-center justify-center space-y-2 overflow-hidden rounded-2xl border p-6 text-center"
			in:fade={{ duration: 300 }}
		>
			<div
				class="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent mix-blend-overlay"
			></div>

			<p
				class="text-iron-muted dark:text-limestone-400 relative z-10 text-sm font-medium tracking-wider uppercase"
			>
				{l.price_est_total_label}
			</p>

			<div class="relative z-10 flex flex-col items-center">
				<div class="flex h-16 items-baseline overflow-hidden">
					<span class="text-primary text-6xl leading-none font-black tracking-tighter tabular-nums">
						{$displayedPrice.toFixed(0)}€
					</span>
				</div>
				<span
					class="text-iron-muted/60 dark:text-limestone-400/60 -mt-1 text-[10px] font-medium tracking-tight uppercase"
				>
					{l.price_est_tax_included}
				</span>
			</div>

			<div
				class="text-iron-muted dark:text-limestone-400 relative z-10 flex items-center gap-3 text-sm"
				transition:slide={{ axis: 'y', duration: 400 }}
			>
				<span
					>{priceEstimate.details.length}
					{priceEstimate.details.length > 1
						? l.price_est_unit_nights
						: l.price_est_unit_night}</span
				>
				<span class="bg-limestone-300 dark:bg-iron-light h-1 w-1 rounded-full"></span>
				<span>{adults} {adults > 1 ? l.price_est_unit_adults : l.price_est_unit_adult}</span>
				{#if children > 0}
					<span class="bg-limestone-300 dark:bg-iron-light h-1 w-1 rounded-full"></span>
					<span>{children} {children > 1 ? l.price_est_unit_children : l.price_est_unit_child}</span
					>
				{/if}
			</div>
		</div>
	{:else}
		<!-- GUIDANCE MESSAGES -->
		<div
			class="bg-limestone-50 dark:bg-iron border-limestone-100 dark:border-iron-light text-iron-muted dark:text-limestone-400 flex min-h-[128px] flex-col items-center justify-center rounded-2xl border p-6 text-center text-sm transition-colors duration-300"
			in:fade
		>
			{#if isRoomSelected && !hasDates}
				<!-- Case: Room Selected, Dates Missing -->
				<div class="animate-in fade-in zoom-in flex flex-col items-center gap-2 duration-300">
					<div
						class="bg-primary/10 text-primary mb-1 flex h-10 w-10 items-center justify-center rounded-full"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<p class="text-iron dark:text-limestone-100 font-bold">
						{l.price_est_prompt_dates_title}
					</p>
					<p class="max-w-[200px] text-xs leading-relaxed opacity-80">
						{l.price_est_prompt_dates_desc}
					</p>
				</div>
			{:else if !isRoomSelected && hasDates}
				<!-- Case: Dates Selected, Room Missing -->
				<div class="animate-in fade-in zoom-in flex flex-col items-center gap-2 duration-300">
					<div
						class="bg-primary/10 text-primary mb-1 flex h-10 w-10 items-center justify-center rounded-full"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
							/>
						</svg>
					</div>
					<p class="text-iron dark:text-limestone-100 font-bold">{l.price_est_prompt_room_title}</p>
					<p class="max-w-[200px] text-xs leading-relaxed opacity-80">
						{l.price_est_prompt_room_desc}
					</p>
				</div>
			{:else}
				<!-- Case: Nothing Selected -->
				<div class="flex flex-col items-center gap-2 opacity-60">
					<p>{l.price_est_prompt_global}</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
