<script lang="ts">
	import type { DateRange } from 'bits-ui';
	import { type DateValue } from '@internationalized/date';
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut, quintOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';
	import type { Chambre } from '$lib/types/directus-schema';
	import { booking } from '$lib/logic/booking.svelte';

	interface Props {
		rooms: Chambre[];
		loading: boolean;
		selectedRoomId: string | number;
		value: DateRange;
		hoveredDate: DateValue | null;
		onSelect: (id: any) => void;
		isRoomAvailableRange: (id: string | number, start: DateValue, end: DateValue) => boolean;
		getRoomImage: (room: any) => string | null;
		roomPrices: Record<string | number, number>;
		adults: number;
		children: number;
		isInvalid?: boolean;
	}

	let {
		rooms,
		loading,
		selectedRoomId,
		value,
		hoveredDate,
		onSelect,
		isRoomAvailableRange,
		getRoomImage,
		roomPrices,
		adults,
		children,
		isInvalid = false
	}: Props = $props();

	// Translations
	const l = $derived(booking.labels);

	function fitsTravelers(room: Chambre) {
		const maxAdults = room.capacite_adultes || 2;
		const maxTotal = (room.capacite_adultes || 2) + (room.capacite_enfants || 0);
		return adults <= maxAdults && adults + children <= maxTotal;
	}

	let singleRemainingRoomId = $derived.by(() => {
		if (selectedRoomId !== 'any' || !value.start) return null;
		const start = value.start;
		const end = value.end || hoveredDate || start.add({ days: 1 });
		const s = start.compare(end) <= 0 ? start : end;
		const e = start.compare(end) <= 0 ? end : start;

		const available = rooms.filter((r) => fitsTravelers(r) && isRoomAvailableRange(r.id, s, e));
		return available.length === 1 ? available[0].id : null;
	});
</script>

<div
	class="custom-scrollbar relative min-h-[500px] flex-1 overflow-y-auto rounded-xl p-2 transition-all duration-300 {isInvalid
		? 'bg-red-50/50 ring-2 ring-red-500'
		: ''}"
>
	{#if loading}
		<div
			class="absolute inset-0 z-20 space-y-6 bg-[var(--background-color)] p-2"
			out:fade={{ duration: 200 }}
		>
			{#each Array(3) as _unused, i (i)}
				<div
					class="bg-limestone-100 dark:bg-iron-light/30 h-32 w-full animate-pulse rounded-xl border-2 border-black/5"
				></div>
			{/each}
		</div>
	{:else if rooms.length === 0}
		<div
			in:fly={{ y: 10, duration: 400 }}
			class="border-iron/20 bg-limestone-50/50 flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center"
		>
			<span class="mb-2 text-4xl">🥀</span>
			<p class="font-heading text-iron-muted text-xl italic">{l.room_list_empty_desc}</p>
		</div>
	{:else}
		<div class="space-y-5 pb-6">
			<!-- "ALL" (Combined View) Option -->
			<div in:fly={{ y: 20, duration: 400, delay: 0, easing: cubicOut }}>
				<button
					onclick={() => onSelect('any')}
					data-state={selectedRoomId === 'any' ? 'active' : 'inactive'}
					class="card-interactive group flex w-full items-center gap-5 !p-4"
				>
					<div
						class="border-iron dark:border-limestone-200 bg-limestone-50 dark:bg-iron-light group-hover:bg-primary group-hover:border-primary flex h-16 w-16 items-center justify-center rounded-lg border-2 shadow-sm transition-all duration-300 group-hover:text-white"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-8 w-8"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
							/>
						</svg>
					</div>

					<div class="flex-1 text-left">
						<div class="flex items-center justify-between">
							<h4
								class="font-heading text-iron dark:text-limestone-50 group-hover:text-primary text-xl font-bold transition-colors"
							>
								{l.room_list_all_filter}
							</h4>
							{#if selectedRoomId === 'any'}
								<span
									class="text-primary bg-primary/10 rounded px-2 py-1 text-xs font-bold tracking-widest uppercase"
									in:scale>{l.room_list_filter_active}</span
								>
							{/if}
						</div>
						<p class="text-iron-muted dark:text-limestone-400 mt-1 text-sm">
							{l.room_list_all_desc}
						</p>
					</div>
				</button>
			</div>

			<!-- Individual Rooms -->
			{#each rooms as room, i (room.id)}
				{@const hasCorrectCapacity = fitsTravelers(room)}
				{@const isAvailableDates = value.start
					? isRoomAvailableRange(room.id, value.start, value.end || value.start.add({ days: 1 }))
					: true}
				{@const isAvailable = hasCorrectCapacity && isAvailableDates}
				{@const isOnlyOption = singleRemainingRoomId === room.id}
				{@const displayPrice = roomPrices[room.id] || room.prix_nuit}

				<div
					animate:flip={{ duration: 400, easing: quintOut }}
					in:fly={{ y: 30, duration: 500, delay: (i + 1) * 80, easing: cubicOut }}
				>
					<button
						onclick={() => onSelect(room.id)}
						disabled={!isAvailable && selectedRoomId !== room.id}
						data-state={selectedRoomId === room.id ? 'active' : 'inactive'}
						class="card-interactive group relative flex w-full flex-col gap-4 overflow-hidden !p-3 transition-all duration-300 sm:flex-row
                            {!isAvailable ? 'cursor-not-allowed opacity-60 grayscale-[0.8]' : ''}
                            {isOnlyOption
							? '!border-amber-400 !bg-amber-50 !shadow-[0px_0px_15px_rgba(251,191,36,0.3)] ring-2 ring-amber-400/20 dark:!bg-amber-900/10'
							: ''}"
					>
						{#if isOnlyOption}
							<div
								class="absolute top-0 right-0 z-20 flex items-center gap-1 rounded-bl-lg bg-amber-400 px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase shadow-sm"
								in:fly={{ y: -10, duration: 300 }}
							>
								{l.room_list_only_option}
							</div>
						{/if}

						<!-- Image Section -->
						<div
							class="relative h-32 w-full flex-shrink-0 overflow-hidden rounded-lg border-2 border-black bg-gray-100 sm:w-32 dark:border-white"
						>
							{#if getRoomImage(room)}
								<img
									src={getRoomImage(room)}
									alt={room.nom}
									class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
								/>
							{:else}
								<div class="bg-iron/5 text-iron/20 flex h-full w-full items-center justify-center">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-8 w-8"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
										/></svg
									>
								</div>
							{/if}

							<div
								class="dark:bg-iron absolute right-0 bottom-0 z-10 flex flex-col items-end rounded-tl-lg border-t-2 border-l-2 border-black bg-white px-2 py-1 shadow-sm dark:border-white"
							>
								<span class="font-heading text-iron text-lg leading-none font-bold dark:text-white"
									>{displayPrice}€</span
								>
								<span
									class="text-iron-muted dark:text-limestone-400 text-[9px] font-bold tracking-wide uppercase"
									>{l.room_list_price_unit}</span
								>
							</div>
						</div>

						<!-- Content Section -->
						<div class="flex w-full min-w-0 flex-1 flex-col justify-between py-1 text-left">
							<div>
								<h4
									class="font-heading text-iron dark:text-limestone-50 group-hover:text-primary truncate pr-2 text-xl leading-tight font-bold transition-colors"
								>
									{room.nom}
								</h4>
								<div
									class="text-iron-muted dark:text-limestone-400 mt-2 flex items-center gap-3 text-xs font-bold tracking-wider uppercase"
								>
									<span
										>{(l.room_list_capacity_max || '')
											.replace('{adulte}', String(room.capacite_adultes))
											.replace('{enfant}', String(room.capacite_enfants))}</span
									>
								</div>
							</div>

							<div class="mt-3">
								{#if !hasCorrectCapacity}
									<div
										class="inline-flex items-center gap-2 rounded border border-amber-200 bg-amber-100 px-3 py-1 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/30 dark:text-amber-200"
									>
										<span class="text-xs font-bold tracking-widest uppercase"
											>{l.room_list_error_capacity}</span
										>
									</div>
								{:else if !isAvailableDates && value.start}
									<div
										class="inline-flex items-center gap-2 rounded border border-red-200 bg-red-100 px-3 py-1 text-red-700 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-200"
									>
										<span class="text-xs font-bold tracking-widest uppercase"
											>{l.room_list_error_unavailable}</span
										>
									</div>
								{:else if selectedRoomId === room.id}
									<div class="text-primary flex items-center gap-2 text-sm font-bold">
										{l.room_list_selected}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/></svg
										>
									</div>
								{:else}
									<span
										class="text-iron-muted/60 group-hover:text-primary text-xs transition-colors"
										>{l.room_list_select_prompt}</span
									>
								{/if}
							</div>
						</div>
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: var(--color-limestone-400);
	}
</style>
