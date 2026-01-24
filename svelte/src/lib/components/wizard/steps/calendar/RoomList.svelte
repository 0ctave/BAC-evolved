<script lang="ts">
    import type {DateRange} from "bits-ui";
    import {type DateValue} from "@internationalized/date";
    import { fly, fade, slide, scale } from 'svelte/transition';
    import { cubicOut, quintOut } from 'svelte/easing';
    import { flip } from 'svelte/animate';

    let {
        rooms,
        loading,
        selectedRoomId,
        value,
        hoveredDate,
        onSelect,
        isRoomAvailableRange,
        getRoomImage,
        roomPrices // NEW: Receive calculated prices including taxes
    } = $props<{
        rooms: any[],
        loading: boolean,
        selectedRoomId: string | number,
        value: DateRange,
        hoveredDate: DateValue | null,
        onSelect: (id: any) => void,
        isRoomAvailableRange: (id: string | number, start: DateValue, end: DateValue) => boolean,
        getRoomImage: (room: any) => string | null,
        roomPrices: Record<string | number, number>
    }>();

    // Derived state to find if only ONE room is left when in 'any' mode
    let singleRemainingRoomId = $derived.by(() => {
        if (selectedRoomId !== 'any' || !value.start) return null;

        const start = value.start;
        let end = value.end;

        if (!end) {
            if (hoveredDate) {
                if (hoveredDate.compare(start) < 0) {
                    const s = hoveredDate;
                    const e = start;
                    const availableRooms = rooms.filter(r => isRoomAvailableRange(r.id, s, e));
                    if (availableRooms.length === 1) return availableRooms[0].id;
                    return null;
                } else {
                    end = hoveredDate;
                }
            } else {
                end = start.add({ days: 1 });
            }
        }

        const s = start.compare(end) <= 0 ? start : end;
        const e = start.compare(end) <= 0 ? end : start;

        const availableRooms = rooms.filter(r => isRoomAvailableRange(r.id, s, e));

        if (availableRooms.length === 1) {
            return availableRooms[0].id;
        }
        return null;
    });
</script>

<div class="flex-1 overflow-y-auto p-1 custom-scrollbar relative min-h-[500px]">
    {#if loading}
        <div class="space-y-6 absolute inset-0 p-2 z-20 bg-[var(--background-color)]" out:fade={{ duration: 200 }}>
            {#each [1, 2, 3] as i}
                <div class="h-32 bg-limestone-100 dark:bg-iron-light/30 rounded-xl w-full animate-pulse border-2 border-black/5"
                     style="animation-delay: {i * 150}ms"></div>
            {/each}
        </div>
    {:else if rooms.length === 0}
        <div in:fly={{ y: 10, duration: 400 }} class="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed border-iron/20 rounded-xl bg-limestone-50/50">
            <span class="text-4xl mb-2">🥀</span>
            <p class="font-heading text-xl text-iron-muted italic">Aucune chambre disponible pour le moment.</p>
        </div>
    {:else}
        <div class="space-y-5 pb-6">
            <!-- "ALL" (Combiné) Option -->
            <div in:fly={{ y: 20, duration: 400, delay: 0, easing: cubicOut }}>
                <button
                        onclick={() => onSelect('any')}
                        data-state={selectedRoomId === 'any' ? 'active' : 'inactive'}
                        class="w-full card-interactive flex items-center gap-5 group !p-4"
                >
                    <!-- Icon Box -->
                    <div class="w-16 h-16 rounded-lg border-2 border-iron dark:border-limestone-200 flex items-center justify-center bg-limestone-50 dark:bg-iron-light group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-300 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>

                    <div class="flex-1 text-left">
                        <div class="flex justify-between items-center">
                            <h4 class="font-heading font-bold text-xl text-iron dark:text-limestone-50 group-hover:text-primary transition-colors">Tout le gîte</h4>
                            {#if selectedRoomId === 'any'}
                                <span class="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded" in:scale>Sélectionné</span>
                            {/if}
                        </div>
                        <p class="text-sm text-iron-muted dark:text-limestone-400 mt-1">Réserver l'ensemble des chambres disponibles</p>
                    </div>
                </button>
            </div>

            <!-- Individual Rooms -->
            {#each rooms as room, i (room.id)}
                {@const isAvailable = value.start ? isRoomAvailableRange(room.id, value.start, value.end || value.start.add({days:1})) : true}
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
                            {!isAvailable ? 'opacity-80 grayscale-[0.5]' : ''}
                            {isOnlyOption ? '!border-amber-400 !bg-amber-50 dark:!bg-amber-900/10 !shadow-[0px_0px_15px_rgba(251,191,36,0.3)] ring-2 ring-amber-400/20' : ''}"
                    >
                        <!-- Highlight for ONLY remaining option -->
                        {#if isOnlyOption}
                            <div class="absolute top-0 right-0 bg-amber-400 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm z-20 uppercase tracking-widest flex items-center gap-1" in:fly={{ y: -10, duration: 300 }}>
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                                Seule option dispo
                            </div>
                        {/if}

                        <!-- Image Section -->
                        <div class="relative w-full sm:w-32 h-40 sm:h-32 rounded-lg border-2 border-black dark:border-white overflow-hidden flex-shrink-0 bg-gray-100">
                            {#if getRoomImage(room)}
                                <img src={getRoomImage(room)} alt={room.nom}
                                     class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"/>
                            {:else}
                                <div class="w-full h-full flex items-center justify-center bg-iron/5 text-iron/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                            {/if}

                            <!-- Price Badge (Overlay on Image) -->
                            <div class="absolute bottom-0 right-0 bg-white dark:bg-iron border-t-2 border-l-2 border-black dark:border-white px-2 py-1 rounded-tl-lg shadow-sm z-10 flex flex-col items-end">
                                <span class="font-bold font-heading text-lg text-iron dark:text-white leading-none">{displayPrice}€</span>
                                <span class="text-[9px] font-bold text-iron-muted dark:text-limestone-400 uppercase tracking-wide">/nuit</span>
                            </div>
                        </div>

                        <!-- Content Section -->
                        <div class="flex-1 text-left flex flex-col justify-between py-1 min-w-0 w-full">
                            <div>
                                <div class="flex justify-between items-start">
                                    <h4 class="font-heading font-bold text-xl text-iron dark:text-limestone-50 leading-tight group-hover:text-primary transition-colors truncate pr-2">
                                        {room.nom}
                                    </h4>
                                </div>
                                <div class="flex items-center gap-3 mt-2 text-xs text-iron-muted dark:text-limestone-400 font-bold uppercase tracking-wider">
                                    <span class="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                                        {room.capacite_adultes || 2} Pers.
                                    </span>
                                    {#if room.surface}
                                        <span class="w-1 h-1 rounded-full bg-iron/20"></span>
                                        <span>{room.surface}m²</span>
                                    {/if}
                                </div>
                            </div>

                            <!-- Availability Status or Action -->
                            <div class="mt-3">
                                {#if !isAvailable && value.start}
                                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-900/50">
                                        <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                        <span class="text-xs font-bold uppercase tracking-widest">Non disponible</span>
                                    </div>
                                    <!-- Overlay "SOLD OUT" stamp effect -->
                                    <div class="absolute top-1/2 right-4 -translate-y-1/2 rotate-[-12deg] border-4 border-red-500/20 text-red-500/20 font-black text-4xl uppercase p-2 pointer-events-none select-none mask-image">
                                        COMPLET
                                    </div>
                                {:else if selectedRoomId === room.id}
                                    <div class="text-sm text-primary font-bold flex items-center gap-2">
                                        Sélectionné
                                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                {:else}
                                    <span class="text-xs text-iron-muted/60 group-hover:text-primary transition-colors">Cliquer pour sélectionner</span>
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