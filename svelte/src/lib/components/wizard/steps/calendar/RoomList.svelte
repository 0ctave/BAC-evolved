<script lang="ts">
    import type {DateRange} from "bits-ui";
    import {type DateValue} from "@internationalized/date";
    import { fly, fade, slide } from 'svelte/transition';
    import { cubicOut, quintOut } from 'svelte/easing';
    import { flip } from 'svelte/animate';

    let {
        rooms,
        loading,
        selectedRoomId,
        value,
        onSelect,
        isRoomAvailableRange,
        getRoomImage
    } = $props<{
        rooms: any[],
        loading: boolean,
        selectedRoomId: string | number,
        value: DateRange,
        onSelect: (id: any) => void,
        isRoomAvailableRange: (id: string | number, start: DateValue, end: DateValue) => boolean,
        getRoomImage: (room: any) => string | null
    }>();
</script>

<div class="flex-1 overflow-y-auto p-2 custom-scrollbar relative min-h-[400px]">
    {#if loading}
        <!-- Loading State: Absolute to prevent layout jump when fading out -->
        <div class="space-y-4 absolute inset-0 p-2 z-20 bg-[var(--background-color)]" out:fade={{ duration: 200 }}>
            {#each [1, 2, 3] as i}
                <div class="h-24 bg-limestone-100 dark:bg-iron-light rounded-xl w-full animate-pulse"
                     style="animation-delay: {i * 150}ms"></div>
            {/each}
        </div>
    {:else if rooms.length === 0}
        <div in:fly={{ y: 10, duration: 400 }} class="p-8 mt-4 bg-limestone-50 dark:bg-iron text-iron-muted dark:text-limestone-400 rounded-xl text-center border-dashed border-2 border-limestone-200 dark:border-iron-light font-serif italic">
            Aucune chambre disponible.
        </div>
    {:else}
        <!-- Content State -->
        <div class="space-y-4 pb-4">
            <!-- "ALL" Button -->
            <div in:fly={{ y: 20, duration: 400, delay: 0, easing: cubicOut }}>
                <button
                        onclick={() => onSelect('any')}
                        class="w-full p-3 rounded-xl border-2 text-left transition-all duration-300 flex items-center gap-4 group relative overflow-hidden
                    {selectedRoomId === 'any'
                        ? 'border-primary bg-white dark:bg-[#252426] shadow-retro-primary -translate-y-1'
                        : 'border-iron/10 dark:border-limestone-100/10 bg-white dark:bg-[#252426] hover:border-primary hover:shadow-retro-sm active:scale-[0.98] active:translate-y-0'}"
                >
                    <div class="w-16 h-16 border border-iron/10 flex items-center justify-center text-iron-muted dark:text-limestone-300 flex-shrink-0 bg-limestone-50 dark:bg-iron-light group-hover:bg-primary/5 transition-colors">
                        <span class="font-heading font-bold text-2xl group-hover:scale-110 transition-transform duration-300">ALL</span>
                    </div>
                    <div>
                        <h4 class="font-heading font-bold text-iron dark:text-limestone-50 text-xl group-hover:text-primary transition-colors">Combiné</h4>
                        <p class="text-sm text-iron-muted dark:text-limestone-400 font-sans">Voir toutes les disponibilités</p>
                    </div>
                    <!-- Animated arrow -->
                    <div class="ml-auto opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </div>
                </button>
            </div>

            {#each rooms as room, i (room.id)}
                {@const isAvailable = value.start && value.end ? isRoomAvailableRange(room.id, value.start, value.end) : true}

                <!-- animate:flip ensures reordering is smooth (physics based) -->
                <div
                        animate:flip={{ duration: 400, easing: quintOut }}
                        in:fly={{ y: 30, duration: 500, delay: (i + 1) * 80, easing: cubicOut }}
                >
                    <button
                            onclick={() => onSelect(room.id)}
                            disabled={!isAvailable && selectedRoomId !== room.id}
                            class="w-full p-3 rounded-xl border-2 text-left transition-all duration-300 group relative overflow-hidden flex gap-4 items-stretch
                        {!isAvailable ? 'opacity-60 grayscale' : ''}
                        {selectedRoomId === room.id
                            ? 'border-primary bg-white dark:bg-[#252426] shadow-retro-primary -translate-y-1 z-10'
                            : 'border-iron/10 dark:border-limestone-100/10 bg-white dark:bg-[#252426] hover:border-primary hover:shadow-retro-sm active:scale-[0.98] active:translate-y-0'}"
                    >
                        <div class="w-24 border border-iron/10 dark:border-limestone-100/10 overflow-hidden flex-shrink-0 relative bg-limestone-50 dark:bg-iron-light rounded-lg">
                            {#if getRoomImage(room)}
                                <img src={getRoomImage(room)} alt={room.nom}
                                     class="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 ease-out"/>
                            {/if}
                        </div>

                        <div class="flex-1 py-1 flex flex-col justify-center min-w-0 pr-8">
                            <h4 class="font-heading font-bold text-xl leading-tight transition-colors truncate
                                {isAvailable ? 'text-iron dark:text-limestone-50 group-hover:text-primary' : 'text-iron-muted dark:text-limestone-400'}">
                                {room.nom}
                            </h4>

                            {#if !isAvailable && value.start && value.end}
                                <p class="text-xs font-bold text-red-500 uppercase tracking-widest mt-1 flex items-center gap-1" in:slide={{ axis: 'y', duration: 200 }}>
                                    <span class="inline-block w-1.5 h-1.5 rounded-full bg-red-500"></span> Indisponible
                                </p>
                            {:else}
                                <div class="mt-auto pt-1 flex items-baseline gap-1">
                                    <span class="text-lg font-bold text-primary font-sans">{room.prix_nuit}€</span>
                                    <span class="text-xs text-iron-muted dark:text-limestone-400">/nuit</span>
                                </div>
                            {/if}
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
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d2c595; }
</style>