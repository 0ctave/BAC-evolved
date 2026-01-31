<script lang="ts">
    import type { DateRange } from "bits-ui";
    import { type DateValue } from "@internationalized/date";
    import { fly, fade, scale } from 'svelte/transition';
    import { cubicOut, quintOut } from 'svelte/easing';
    import { flip } from 'svelte/animate';
    import type { Chambre } from "$lib/types/directus-schema";
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
        rooms, loading, selectedRoomId, value, hoveredDate, onSelect,
        isRoomAvailableRange, getRoomImage, roomPrices, adults, children, isInvalid = false
    }: Props = $props();

    // Translations
    const l = $derived(booking.labels);

    function fitsTravelers(room: Chambre) {
        const maxAdults = room.capacite_adultes || 2;
        const maxTotal = (room.capacite_adultes || 2) + (room.capacite_enfants || 0);
        return adults <= maxAdults && (adults + children) <= maxTotal;
    }

    let singleRemainingRoomId = $derived.by(() => {
        if (selectedRoomId !== 'any' || !value.start) return null;
        const start = value.start;
        const end = value.end || hoveredDate || start.add({ days: 1 });
        const s = start.compare(end) <= 0 ? start : end;
        const e = start.compare(end) <= 0 ? end : start;

        const available = rooms.filter(r => fitsTravelers(r) && isRoomAvailableRange(r.id, s, e));
        return available.length === 1 ? available[0].id : null;
    });
</script>

<div class="flex-1 overflow-y-auto p-2 custom-scrollbar relative min-h-[500px] transition-all duration-300 rounded-xl {isInvalid ? 'bg-red-50/50 ring-2 ring-red-500' : ''}">
    {#if loading}
        <div class="space-y-6 absolute inset-0 p-2 z-20 bg-[var(--background-color)]" out:fade={{ duration: 200 }}>
            {#each Array(3) as _, i}
                <div class="h-32 bg-limestone-100 dark:bg-iron-light/30 rounded-xl w-full animate-pulse border-2 border-black/5"></div>
            {/each}
        </div>
    {:else if rooms.length === 0}
        <div in:fly={{ y: 10, duration: 400 }} class="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed border-iron/20 rounded-xl bg-limestone-50/50">
            <span class="text-4xl mb-2">🥀</span>
            <p class="font-heading text-xl text-iron-muted italic">{l.room_list_empty_desc}</p>
        </div>
    {:else}
        <div class="space-y-5 pb-6">
            <!-- "ALL" (Combined View) Option -->
            <div in:fly={{ y: 20, duration: 400, delay: 0, easing: cubicOut }}>
                <button
                        onclick={() => onSelect('any')}
                        data-state={selectedRoomId === 'any' ? 'active' : 'inactive'}
                        class="w-full card-interactive flex items-center gap-5 group !p-4"
                >
                    <div class="w-16 h-16 rounded-lg border-2 border-iron dark:border-limestone-200 flex items-center justify-center bg-limestone-50 dark:bg-iron-light group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-300 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>

                    <div class="flex-1 text-left">
                        <div class="flex justify-between items-center">
                            <h4 class="font-heading font-bold text-xl text-iron dark:text-limestone-50 group-hover:text-primary transition-colors">{l.room_list_all_filter}</h4>
                            {#if selectedRoomId === 'any'}
                                <span class="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded" in:scale>{l.room_list_filter_active}</span>
                            {/if}
                        </div>
                        <p class="text-sm text-iron-muted dark:text-limestone-400 mt-1">
                            {l.room_list_all_desc}
                        </p>
                    </div>
                </button>
            </div>

            <!-- Individual Rooms -->
            {#each rooms as room, i (room.id)}
                {@const hasCorrectCapacity = fitsTravelers(room)}
                {@const isAvailableDates = value.start ? isRoomAvailableRange(room.id, value.start, value.end || value.start.add({days:1})) : true}
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
                            class="w-full card-interactive flex flex-col sm:flex-row gap-4 !p-3 group relative overflow-hidden transition-all duration-300
                            {!isAvailable ? 'opacity-60 grayscale-[0.8] cursor-not-allowed' : ''}
                            {isOnlyOption ? '!border-amber-400 !bg-amber-50 dark:!bg-amber-900/10 !shadow-[0px_0px_15px_rgba(251,191,36,0.3)] ring-2 ring-amber-400/20' : ''}"
                    >
                        {#if isOnlyOption}
                            <div class="absolute top-0 right-0 bg-amber-400 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm z-20 uppercase tracking-widest flex items-center gap-1" in:fly={{ y: -10, duration: 300 }}>
                                {l.room_list_only_option}
                            </div>
                        {/if}

                        <!-- Image Section -->
                        <div class="relative w-full sm:w-32 h-32 rounded-lg border-2 border-black dark:border-white overflow-hidden flex-shrink-0 bg-gray-100">
                            {#if getRoomImage(room)}
                                <img src={getRoomImage(room)} alt={room.nom}
                                     class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"/>
                            {:else}
                                <div class="w-full h-full flex items-center justify-center bg-iron/5 text-iron/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                            {/if}

                            <div class="absolute bottom-0 right-0 bg-white dark:bg-iron border-t-2 border-l-2 border-black dark:border-white px-2 py-1 rounded-tl-lg shadow-sm z-10 flex flex-col items-end">
                                <span class="font-bold font-heading text-lg text-iron dark:text-white leading-none">{displayPrice}€</span>
                                <span class="text-[9px] font-bold text-iron-muted dark:text-limestone-400 uppercase tracking-wide">{l.room_list_price_unit}</span>
                            </div>
                        </div>

                        <!-- Content Section -->
                        <div class="flex-1 text-left flex flex-col justify-between py-1 min-w-0 w-full">
                            <div>
                                <h4 class="font-heading font-bold text-xl text-iron dark:text-limestone-50 leading-tight group-hover:text-primary transition-colors truncate pr-2">
                                    {room.nom}
                                </h4>
                                <div class="flex items-center gap-3 mt-2 text-xs text-iron-muted dark:text-limestone-400 font-bold uppercase tracking-wider">
                                    <span>{(l.room_list_capacity_max || "").replace('{total}', (room.capacite_adultes || 2) + (room.capacite_enfants || 0))}</span>
                                </div>
                            </div>

                            <div class="mt-3">
                                {#if !hasCorrectCapacity}
                                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50">
                                        <span class="text-xs font-bold uppercase tracking-widest">{l.room_list_error_capacity}</span>
                                    </div>
                                {:else if !isAvailableDates && value.start}
                                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-900/50">
                                        <span class="text-xs font-bold uppercase tracking-widest">{l.room_list_error_unavailable}</span>
                                    </div>
                                {:else if selectedRoomId === room.id}
                                    <div class="text-sm text-primary font-bold flex items-center gap-2">
                                        {l.room_list_selected} <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                {:else}
                                    <span class="text-xs text-iron-muted/60 group-hover:text-primary transition-colors">{l.room_list_select_prompt}</span>
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
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--color-limestone-400); }
</style>