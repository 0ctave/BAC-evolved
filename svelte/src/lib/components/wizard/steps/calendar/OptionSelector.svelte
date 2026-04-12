<script lang="ts">
	import { Switch } from 'bits-ui';
	import { slide } from 'svelte/transition';
	import { booking } from '$lib/logic/booking.svelte';

	let { parking = $bindable(), parkingDetails } = $props<{
		parking: boolean;
		parkingDetails: { dailyRate: number; total: number; nights: number };
	}>();

	// Translations
	const l = $derived(booking.labels);
</script>

<div class="space-y-4">
	<h4 class="text-iron dark:text-limestone-50 text-sm font-bold tracking-wide uppercase">
		{l.options_title}
	</h4>

	<div
		class="border-limestone-200 dark:border-iron-light flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-[#252426]"
	>
		<div class="flex items-center gap-3">
			<div
				class="bg-limestone-100 dark:bg-iron-light text-iron-muted dark:text-limestone-300 flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300"
				class:text-primary={parking}
				class:bg-primary-50={parking}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 transition-transform duration-300 {parking ? 'scale-110' : ''}"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 14l-7 7m0 0l-7-7m7 7V3"
					/>
					<path d="M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 001 1h3" opacity="0.5" />
				</svg>
			</div>
			<div>
				<div class="flex items-baseline gap-2">
					<p class="text-iron dark:text-limestone-50 font-bold">{l.options_parking_title}</p>
					{#if parkingDetails}
						<!-- Display effective daily rate -->
						<span class="text-primary text-sm font-bold" in:slide={{ axis: 'x', duration: 300 }}>
							{parkingDetails.dailyRate}€
							<span class="text-iron-muted text-[10px] font-normal opacity-80"
								>{l.options_parking_unit}</span
							>
						</span>
					{/if}
				</div>
				<p class="text-iron-muted dark:text-limestone-400 text-xs">{l.options_parking_desc}</p>
			</div>
		</div>

		<Switch.Root
			checked={parking}
			onCheckedChange={(v) => (parking = v)}
			class="bg-limestone-200 dark:bg-iron-light data-[state=checked]:bg-primary focus:ring-primary/50 relative h-7 w-12 cursor-pointer rounded-full shadow-inner transition-colors duration-300 focus:ring-2 focus:outline-none"
		>
			<Switch.Thumb
				class="block h-5 w-5 translate-x-1 rounded-full bg-white shadow-md transition-transform duration-300 data-[state=checked]:translate-x-6"
			/>
		</Switch.Root>
	</div>
</div>
