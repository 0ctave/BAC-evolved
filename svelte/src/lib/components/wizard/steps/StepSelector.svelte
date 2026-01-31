<script lang="ts">
    import { booking } from '$lib/logic/booking.svelte';
    import { fly } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';

    // Helper to check active state
    let isRoom = $derived(booking.type === 'CHAMBRE');
    let isVisit = $derived(booking.type === 'VISITE');

    // Translation helper from global store
    const l = $derived(booking.labels);

    function handleSelect(type: 'CHAMBRE' | 'VISITE') {
        booking.type = type;
        booking.nextStep();
    }
</script>

<div class="text-center mb-16" in:fly={{ y: -20, duration: 600, delay: 0 }}>
    <h2 class="heading-page">{l.step_selector_title}</h2>
    <div class="w-16 h-1 bg-primary mx-auto rounded-full"></div>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

    <!-- Carte Hébergement -->
    <div class="h-full" in:fly={{ y: 30, duration: 600, delay: 100, easing: cubicOut }}>
        <button
                onclick={() => handleSelect('CHAMBRE')}
                class="surface-interactive group w-full h-full flex flex-col items-start active:scale-[0.98] transition-all duration-300"
                data-state={isRoom ? 'active' : 'inactive'}
        >
            <div class="mb-4 p-3 bg-limestone-50 dark:bg-iron-light rounded-xl group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-iron dark:text-limestone-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
            </div>

            <h3 class="heading-section group-hover:text-primary transition-colors text-2xl text-left">
                {l.step_selector_room_title}
            </h3>
            <p class="text-body text-left mt-2">
                {l.step_selector_room_desc}
            </p>

            <div class="mt-auto pt-8 w-full flex justify-end">
                <div class="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary font-bold text-xl">
                    ⟶
                </div>
            </div>

            {#if isRoom}
                <div class="absolute top-4 right-4 text-primary" in:fly={{ y: 10, duration: 300 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            {/if}
        </button>
    </div>

    <!-- Carte Visite -->
    <div class="h-full" in:fly={{ y: 30, duration: 600, delay: 200, easing: cubicOut }}>
        <button
                onclick={() => handleSelect('VISITE')}
                class="surface-interactive group w-full h-full flex flex-col items-start active:scale-[0.98] transition-all duration-300"
                data-state={isVisit ? 'active' : 'inactive'}
        >
            <div class="mb-4 p-3 bg-limestone-50 dark:bg-iron-light rounded-xl group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-iron dark:text-limestone-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
            </div>

            <h3 class="heading-section group-hover:text-primary transition-colors text-2xl text-left">
                {l.step_selector_visit_title}
            </h3>
            <p class="text-body text-left mt-2">
                {l.step_selector_visit_desc}
            </p>

            <div class="mt-auto pt-8 w-full flex justify-end">
                <div class="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary font-bold text-xl">
                    ⟶
                </div>
            </div>

            {#if isVisit}
                <div class="absolute top-4 right-4 text-primary" in:fly={{ y: 10, duration: 300 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            {/if}
        </button>
    </div>
</div>