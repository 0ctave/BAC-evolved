<script lang="ts">
    import { Switch } from "bits-ui";
    import { slide } from 'svelte/transition';
    import { booking } from '$lib/logic/booking.svelte';

    let { parking = $bindable(), parkingDetails } = $props<{
        parking: boolean,
        parkingDetails: { dailyRate: number, total: number, nights: number }
    }>();

    // Translations
    const l = $derived(booking.labels);
</script>

<div class="space-y-4">
    <h4 class="text-sm font-bold text-iron dark:text-limestone-50 uppercase tracking-wide">{l.options_title}</h4>

    <div class="p-4 bg-white dark:bg-[#252426] rounded-2xl border border-limestone-200 dark:border-iron-light flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-limestone-100 dark:bg-iron-light flex items-center justify-center text-iron-muted dark:text-limestone-300 transition-colors duration-300"
                 class:text-primary={parking}
                 class:bg-primary-50={parking}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-300 {parking ? 'scale-110' : ''}" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                    <path d="M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 001 1h3" opacity="0.5"/>
                </svg>
            </div>
            <div>
                <div class="flex items-baseline gap-2">
                    <p class="font-bold text-iron dark:text-limestone-50">{l.options_parking_title}</p>
                    {#if parkingDetails}
                        <!-- Display effective daily rate -->
                        <span class="text-sm font-bold text-primary" in:slide={{ axis: 'x', duration: 300 }}>
                            {parkingDetails.dailyRate}€ <span class="text-[10px] font-normal text-iron-muted opacity-80">{l.options_parking_unit}</span>
                        </span>
                    {/if}
                </div>
                <p class="text-xs text-iron-muted dark:text-limestone-400">{l.options_parking_desc}</p>
            </div>
        </div>

        <Switch.Root
                checked={parking}
                onCheckedChange={(v) => parking = v}
                class="w-12 h-7 bg-limestone-200 dark:bg-iron-light rounded-full relative data-[state=checked]:bg-primary transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer shadow-inner"
        >
            <Switch.Thumb
                    class="block w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 translate-x-1 data-[state=checked]:translate-x-6"
            />
        </Switch.Root>
    </div>
</div>