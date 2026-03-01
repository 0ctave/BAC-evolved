<script lang="ts">
    import { fly, slide } from 'svelte/transition';
    import { booking } from '$lib/logic/booking.svelte';

    let {
        quantity = $bindable(),
        max,
        selectedDate, // Now passed from parent
        timeRange,    // Now passed from parent
        visiteName    // Now passed from parent
    } = $props<{
        quantity: number,
        max: number,
        selectedDate: string,
        timeRange: string,
        visiteName: string
    }>();

    const l = $derived(booking.labels);
</script>

<div class="space-y-6" transition:slide>
    <!-- DATE & CONFIRMATION HEADER -->
    <div class="flex flex-col gap-2 p-6 bg-limestone-50 dark:bg-iron-light/10 border-2 border-iron/5 rounded-2xl relative overflow-hidden">
        <div class="flex items-start justify-between">
            <div class="flex flex-col text-left">
                <span class="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Sélection confirmée</span>
                <h5 class="text-xl font-bold text-iron dark:text-limestone-50 leading-tight uppercase tracking-tight">{visiteName}</h5>
                <p class="text-base font-medium text-iron-muted dark:text-limestone-400 capitalize mt-2 flex items-center gap-2 font-heading">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {selectedDate}
                </p>
                <p class="text-lg font-bold text-iron dark:text-limestone-100 mt-1 tabular-nums">
                    {timeRange}
                </p>
            </div>

            <div class="w-14 h-14 rounded-2xl bg-white dark:bg-iron shadow-sm border border-iron/5 flex items-center justify-center text-primary flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        </div>
    </div>

    <!-- QUANTITY PICKER -->
    <div class="space-y-4">
        <h4 class="text-xs font-bold text-iron dark:text-limestone-50 uppercase tracking-widest italic">{l.tour_quantity_title || 'Nombre de billets'}</h4>

        <div class="p-8 bg-white dark:bg-[#252426] rounded-2xl border border-limestone-200 dark:border-iron-light shadow-sm flex items-center justify-between transition-all hover:shadow-md">
            <div class="flex flex-col text-left">
                <span class="text-xs font-bold text-iron-muted uppercase tracking-[0.2em] mb-1">{l.tour_quantity_unit || 'Quantité'}</span>
                <span class="text-[10px] text-iron-muted/60 font-medium">Capacité : {max} disponibles</span>
            </div>

            <div class="flex items-center gap-8">
                <button class="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-iron-light shadow-sm text-iron-muted dark:text-limestone-50 border border-iron/20 transition-all active:scale-90 disabled:opacity-30"
                        onclick={() => quantity = Math.max(1, quantity - 1)} disabled={quantity <= 1}>
                    <span class="text-2xl font-bold leading-none mb-0.5">−</span>
                </button>

                <span class="font-bold text-iron dark:text-limestone-50 text-4xl tabular-nums w-12 text-center select-none italic">
                    {#key quantity}
                        <div in:fly={{ y: 20, duration: 300 }} class="inline-block">{quantity}</div>
                    {/key}
                </span>

                <button class="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-iron-light shadow-sm text-iron-muted dark:text-limestone-50 border border-iron/20 transition-all active:scale-90 disabled:opacity-30"
                        onclick={() => quantity++} disabled={quantity >= max}>
                    <span class="text-2xl font-bold leading-none mb-0.5">+</span>
                </button>
            </div>
        </div>
    </div>
</div>