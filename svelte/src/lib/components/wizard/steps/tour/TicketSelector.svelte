<script lang="ts">
	import { fly, slide } from 'svelte/transition';
	import { booking } from '$lib/logic/booking.svelte';

	let {
		quantity = $bindable(),
		max,
		selectedDate, // Now passed from parent
		timeRange, // Now passed from parent
		visiteName // Now passed from parent
	} = $props<{
		quantity: number;
		max: number;
		selectedDate: string;
		timeRange: string;
		visiteName: string;
	}>();

	const l = $derived(booking.labels);
</script>

<div class="space-y-6" transition:slide>
	<!-- DATE & CONFIRMATION HEADER -->
	<div
		class="bg-limestone-50 dark:bg-iron-light/10 border-iron/5 relative flex flex-col gap-2 overflow-hidden rounded-2xl border-2 p-6"
	>
		<div class="flex items-start justify-between">
			<div class="flex flex-col text-left">
				<span class="text-primary mb-1 text-[10px] font-bold tracking-widest uppercase"
					>Sélection confirmée</span
				>
				<h5
					class="text-iron dark:text-limestone-50 text-xl leading-tight font-bold tracking-tight uppercase"
				>
					{visiteName}
				</h5>
				<p
					class="text-iron-muted dark:text-limestone-400 font-heading mt-2 flex items-center gap-2 text-base font-medium capitalize"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 opacity-50"
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
					{selectedDate}
				</p>
				<p class="text-iron dark:text-limestone-100 mt-1 text-lg font-bold tabular-nums">
					{timeRange}
				</p>
			</div>

			<div
				class="dark:bg-iron border-iron/5 text-primary flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border bg-white shadow-sm"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-8 w-8"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
		</div>
	</div>

	<!-- QUANTITY PICKER -->
	<div class="space-y-4">
		<h4 class="text-iron dark:text-limestone-50 text-xs font-bold tracking-widest uppercase italic">
			{l.tour_quantity_title || 'Nombre de billets'}
		</h4>

		<div
			class="border-limestone-200 dark:border-iron-light flex items-center justify-between rounded-2xl border bg-white p-8 shadow-sm transition-all hover:shadow-md dark:bg-[#252426]"
		>
			<div class="flex flex-col text-left">
				<span class="text-iron-muted mb-1 text-xs font-bold tracking-[0.2em] uppercase"
					>{l.tour_quantity_unit || 'Quantité'}</span
				>
				<span class="text-iron-muted/60 text-[10px] font-medium">Capacité : {max} disponibles</span>
			</div>

			<div class="flex items-center gap-8">
				<button
					class="dark:bg-iron-light text-iron-muted dark:text-limestone-50 border-iron/20 flex h-12 w-12 items-center justify-center rounded-xl border bg-white shadow-sm transition-all active:scale-90 disabled:opacity-30"
					onclick={() => (quantity = Math.max(1, quantity - 1))}
					disabled={quantity <= 1}
				>
					<span class="mb-0.5 text-2xl leading-none font-bold">−</span>
				</button>

				<span
					class="text-iron dark:text-limestone-50 w-12 text-center text-4xl font-bold italic tabular-nums select-none"
				>
					{#key quantity}
						<div in:fly={{ y: 20, duration: 300 }} class="inline-block">{quantity}</div>
					{/key}
				</span>

				<button
					class="dark:bg-iron-light text-iron-muted dark:text-limestone-50 border-iron/20 flex h-12 w-12 items-center justify-center rounded-xl border bg-white shadow-sm transition-all active:scale-90 disabled:opacity-30"
					onclick={() => quantity++}
					disabled={quantity >= max}
				>
					<span class="mb-0.5 text-2xl leading-none font-bold">+</span>
				</button>
			</div>
		</div>
	</div>
</div>
