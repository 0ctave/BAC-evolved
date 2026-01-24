<script lang="ts">
    import { fade, slide } from 'svelte/transition';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';
    import type { PricingResult } from '$lib/logic/pricing';

    let { priceEstimate, adults, children, isRoomSelected } = $props<{
        priceEstimate: PricingResult | null,
        adults: number,
        children: number,
        isRoomSelected: boolean
    }>();

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

<div class="mt-auto border-t border-limestone-100 dark:border-iron-light p-6">
    {#if priceEstimate}
        <div class="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden"
             in:fade={{ duration: 300 }}>

            <div class="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none mix-blend-overlay"></div>

            <p class="text-sm text-iron-muted dark:text-limestone-400 font-medium uppercase tracking-wider relative z-10">Total estimé</p>

            <div class="flex flex-col items-center relative z-10">
                <div class="h-16 flex items-baseline overflow-hidden">
                    <span class="text-6xl font-black text-primary tabular-nums tracking-tighter leading-none">
                        {$displayedPrice.toFixed(0)}€
                    </span>
                </div>
                <!-- Added "Tax included" label -->
                <span class="text-[10px] text-iron-muted/60 dark:text-limestone-400/60 font-medium uppercase tracking-tight -mt-1">
                    Taxe de séjour incluse
                </span>
            </div>

            <div class="flex items-center gap-3 text-sm text-iron-muted dark:text-limestone-400 relative z-10"
                 transition:slide={{ axis: 'y', duration: 400 }}>
                <span>{priceEstimate.details.length}
                    nuit{priceEstimate.details.length > 1 ? 's' : ''}</span>
                <span class="w-1 h-1 rounded-full bg-limestone-300 dark:bg-iron-light"></span>
                <span>{adults} adulte{adults > 1 ? 's' : ''}</span>
                {#if children > 0}
                    <span class="w-1 h-1 rounded-full bg-limestone-300 dark:bg-iron-light"></span>
                    <span>{children} enfant{children > 1 ? 's' : ''}</span>
                {/if}
            </div>
        </div>
    {:else if !isRoomSelected}
        <div class="bg-limestone-50 dark:bg-iron border border-limestone-100 dark:border-iron-light rounded-2xl p-6 text-center text-iron-muted dark:text-limestone-400 text-sm transition-colors duration-300"
             in:fade>
            Sélectionnez une chambre et vos dates pour voir le prix.
        </div>
    {:else}
        <div class="h-32 bg-limestone-50 dark:bg-iron border border-limestone-100 dark:border-iron-light rounded-2xl animate-pulse"></div>
    {/if}
</div>