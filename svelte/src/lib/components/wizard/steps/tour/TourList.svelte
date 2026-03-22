<script lang="ts">
    import { fly, scale } from 'svelte/transition';
    import { booking } from '$lib/logic/booking.svelte';
    import type { Visite } from '$lib/types/directus-schema';

    interface Props {
        visites: Visite[];
        selectedId: number | null | 'all';
        onSelect: (id: number | 'all') => void;
        loading: boolean;
    }

    let { visites, selectedId, onSelect, loading }: Props = $props();
    const l = $derived(booking.labels);
</script>

<div class="space-y-4">
    <div class="flex justify-between items-end">
        <span class="text-xs font-bold text-primary tracking-widest uppercase">{l.tour_list_label || 'Activité'}</span>
    </div>

    <div class="flex gap-4 overflow-x-auto pb-4 custom-scrollbar scroll-smooth snap-x">
        {#if loading}
            {#each Array(3) as _}
                <div class="h-16 w-40 bg-limestone-100 dark:bg-iron-light/30 rounded-xl animate-pulse border border-black/5"></div>
            {/each}
        {:else}
            <!-- ALL Card -->
            <button
                    onclick={() => onSelect('all')}
                    class="snap-start min-w-[140px] p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-start gap-1 relative overflow-hidden group
                {selectedId === 'all'
                    ? 'border-primary bg-primary text-white shadow-sm translate-y-[-2px]'
                    : 'border-iron/10 bg-white dark:bg-[#252426] text-iron hover:border-primary/50'}"
            >
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-70">Explorer</span>
                <span class="text-base font-bold truncate w-full text-left leading-tight">Toutes les visites</span>
                {#if selectedId === 'all'}
                    <div class="absolute top-2 right-2 text-white" in:scale>
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                    </div>
                {/if}
            </button>

            {#each visites as visite, i (visite.id)}
                <button
                        onclick={() => onSelect(visite.id)}
                        in:fly={{ x: 20, duration: 400, delay: i * 50 }}
                        class="snap-start min-w-[180px] p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-start gap-1 relative overflow-hidden group
                    {selectedId === visite.id
                        ? 'border-primary bg-primary text-white shadow-sm translate-y-[-2px]'
                        : 'border-iron/10 bg-white dark:bg-[#252426] text-iron hover:border-primary/50'}"
                >
                    <span class="text-[10px] font-bold uppercase tracking-widest opacity-70">Visite</span>
                    <span class="text-base font-bold truncate w-full text-left leading-tight">{visite.nom}</span>
                    {#if selectedId === visite.id}
                        <div class="absolute top-2 right-2 text-white" in:scale>
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                        </div>
                    {/if}
                </button>
            {/each}
        {/if}
    </div>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar { height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.15); border-radius: 10px; }
    :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.15); }
    .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.15) transparent; }
</style>