<script lang="ts">
    import { slide, fade, fly, scale } from 'svelte/transition';
    import { booking } from '$lib/logic/booking.svelte';
    import type { CreneauxVisite, Visite, ReservationsVisite } from '$lib/types/directus-schema';

    interface Props {
        slots: CreneauxVisite[];
        visites: Visite[];
        loading: boolean;
        selectedSlotId: string | number | null;
        onSelect: (id: string | number) => void;
        hasDate: boolean;
    }

    let { slots, visites, loading, selectedSlotId, onSelect, hasDate }: Props = $props();
    const l = $derived(booking.labels);

    function getVisite(slot: CreneauxVisite) {
        const sId = typeof slot.visite_id === 'object' ? slot.visite_id?.id : slot.visite_id;
        return visites.find(v => String(v.id) === String(sId));
    }

    function formatTimeRange(isoString: string, duration: number) {
        if (!isoString) return "";
        const start = new Date(isoString);
        const end = new Date(start.getTime() + (duration || 0) * 60000);
        const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
        return `${start.toLocaleTimeString('fr-FR', options)} — ${end.toLocaleTimeString('fr-FR', options)}`;
    }

    function formatDateShort(isoString: string) {
        if (!isoString) return "";
        return new Date(isoString).toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    }

    /**
     * Capacity Calculation
     */
    function getRemaining(slot: any) {
        const total = Number(slot.capacite_max) || 0;
        let reserved = 0;

        const reservations = slot.reservations_visite;

        if (Array.isArray(reservations)) {
            reserved = reservations.reduce((acc: number, r: ReservationsVisite) => {
                if (r && (r.statut === 'confirmee' || r.statut === 'en_attente')) {
                    return acc + (Number(r.quantite_billets) || 0);
                }
                return acc;
            }, 0);
        }

        return Math.max(0, total - reserved);
    }
</script>

<div class="space-y-4">
    <div class="flex justify-between items-center">
        <h4 class="text-xs font-bold text-iron/60 dark:text-limestone-400 uppercase tracking-widest italic">
            {#if hasDate}
                {l.tour_slots_title || 'Créneaux disponibles'}
            {:else}
                Sessions à venir
            {/if}
        </h4>
    </div>

    <div class="relative min-h-[160px] custom-scrollbar max-h-[400px] overflow-y-auto pr-2">
        {#if loading}
            <div class="space-y-3" in:fade>
                {#each Array(3) as _}
                    <div class="h-20 bg-limestone-100 dark:bg-iron-light/20 rounded-2xl w-full animate-pulse border border-black/5"></div>
                {/each}
            </div>
        {:else if slots.length === 0}
            <div class="p-10 bg-limestone-50 dark:bg-iron-light/10 rounded-2xl text-center border-2 border-dashed border-iron/10 italic" in:fly={{y: 10}}>
                <p class="text-sm text-iron-muted">Aucun créneau disponible pour cette sélection.</p>
            </div>
        {:else}
            <div class="grid grid-cols-1 gap-3">
                {#each slots as slot, i (slot.id)}
                    {@const v = getVisite(slot)}
                    {@const remaining = getRemaining(slot)}
                    {@const isSelected = String(selectedSlotId) === String(slot.id)}

                    <button
                            onclick={() => onSelect(slot.id)}
                            disabled={remaining <= 0}
                            in:fly={{ y: 20, duration: 400, delay: i * 50 }}
                            class="p-5 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group relative overflow-hidden
                        {isSelected
                            ? 'border-primary bg-primary text-white shadow-sm translate-y-[-2px]'
                            : 'border-iron/10 bg-white dark:bg-[#252426] text-iron hover:border-primary/50'}
                        {remaining <= 0 ? 'opacity-50 cursor-not-allowed grayscale' : ''}"
                    >
                        <div class="flex items-center gap-6 relative z-10 min-w-0 flex-1 text-left">
                            <div class="flex-shrink-0 w-32">
                                <span class="text-xl font-bold tabular-nums leading-none tracking-tight">
                                    {formatTimeRange(slot.date_heure_debut, v?.duree_minutes || 0)}
                                </span>
                            </div>

                            <div class="flex flex-col items-start min-w-0">
                                <span class="text-[10px] font-bold uppercase tracking-widest {isSelected ? 'text-white/80' : 'text-primary'} mb-0.5 italic">
                                    {formatDateShort(slot.date_heure_debut)}
                                </span>
                                <h5 class="text-base font-bold leading-tight truncate w-full uppercase tracking-tight">
                                    {v?.nom || 'Visite'}
                                </h5>
                            </div>
                        </div>

                        <div class="text-right relative z-10 flex flex-col items-end ml-4">
                            <span class="text-[10px] font-bold uppercase tracking-widest opacity-70 block mb-1 leading-none">
                                {remaining <= 0 ? 'Complet' : 'Places'}
                            </span>
                            <div class="flex items-center gap-2">
                                <span class="font-bold text-lg tabular-nums">{remaining}</span>
                                {#if remaining > 0 && remaining < 5}
                                    <div class="w-2 h-2 rounded-full bg-amber-400 animate-pulse border border-white shadow-sm"></div>
                                {/if}
                            </div>
                        </div>

                        {#if isSelected}
                            <div class="absolute -top-2 -right-2 opacity-10 text-white" in:scale>
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        {/if}
                    </button>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
</style>