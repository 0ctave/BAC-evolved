<script lang="ts">
    import { fly } from 'svelte/transition';

    let {
        adults = $bindable(),
        children = $bindable(),
        maxAdults,
        maxChildren,
        totalCapacity // NEW: Passed from parent to enforce room limits
    } = $props<{
        adults: number,
        children: number,
        maxAdults: number,
        maxChildren: number,
        totalCapacity: number
    }>();

    // Derived to check current total against limit
    let currentTotal = $derived(adults + children);
    let isTotalMaxReached = $derived(currentTotal >= totalCapacity);
</script>

<div class="space-y-4">
    <h4 class="text-sm font-bold text-iron dark:text-limestone-50 uppercase tracking-wide">Voyageurs</h4>
    <div class="grid {maxChildren > 0 ? 'grid-cols-2' : 'grid-cols-1'} gap-4">

        <!-- Adultes -->
        <div class="p-3 bg-white dark:bg-[#252426] rounded-2xl border border-limestone-200 dark:border-iron-light flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transition-shadow duration-300">
            <span class="text-xs font-bold text-iron-muted dark:text-limestone-400">Adultes</span>
            <div class="flex items-center gap-3">
                <button class="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-iron-light shadow-sm text-iron-muted dark:text-limestone-300 hover:text-primary dark:hover:text-primary hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed border border-limestone-100 dark:border-iron transition-all active:scale-90"
                        onclick={() => adults = Math.max(1, adults - 1)} disabled={adults <= 1}>
                    <span class="text-lg leading-none mb-0.5">-</span>
                </button>

                <span class="font-bold text-iron dark:text-limestone-50 w-6 h-8 flex items-center justify-center text-lg tabular-nums select-none overflow-hidden relative">
                    {#key adults}
                        <span in:fly={{ y: 15, duration: 250 }} class="absolute">
                            {adults}
                        </span>
                    {/key}
                </span>

                <button class="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-iron-light shadow-sm text-iron-muted dark:text-limestone-300 hover:text-primary dark:hover:text-primary hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed border border-limestone-100 dark:border-iron transition-all active:scale-90"
                        onclick={() => adults++} disabled={adults >= maxAdults || isTotalMaxReached}>
                    <span class="text-lg leading-none mb-0.5">+</span>
                </button>
            </div>
        </div>

        <!-- Enfants -->
        {#if maxChildren > 0}
            <div class="p-3 bg-white dark:bg-[#252426] rounded-2xl border border-limestone-200 dark:border-iron-light flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transition-shadow duration-300">
                <span class="text-xs font-bold text-iron-muted dark:text-limestone-400">Enfants</span>
                <div class="flex items-center gap-3">
                    <button class="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-iron-light shadow-sm text-iron-muted dark:text-limestone-300 hover:text-primary dark:hover:text-primary hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed border border-limestone-100 dark:border-iron transition-all active:scale-90"
                            onclick={() => children = Math.max(0, children - 1)} disabled={children <= 0}>
                        <span class="text-lg leading-none mb-0.5">-</span>
                    </button>

                    <span class="font-bold text-iron dark:text-limestone-50 w-6 h-8 flex items-center justify-center text-lg tabular-nums select-none overflow-hidden relative">
                        {#key children}
                            <span in:fly={{ y: 15, duration: 250 }} class="absolute">
                                {children}
                            </span>
                        {/key}
                    </span>

                    <button class="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-iron-light shadow-sm text-iron-muted dark:text-limestone-300 hover:text-primary dark:hover:text-primary hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed border border-limestone-100 dark:border-iron transition-all active:scale-90"
                            onclick={() => children++} disabled={children >= maxChildren || isTotalMaxReached}>
                        <span class="text-lg leading-none mb-0.5">+</span>
                    </button>
                </div>
            </div>
        {/if}
    </div>
</div>