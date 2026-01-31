<script lang="ts">
    import { booking } from '$lib/logic/booking.svelte';
    import { fetchVisites, fetchSlots } from '$lib/directus/booking-fetchers';
    import { Calendar } from "bits-ui";
    import { today, getLocalTimeZone, DateFormatter, type DateValue, CalendarDate } from "@internationalized/date";
    import { onMount } from 'svelte';
    import { fly, fade, slide, scale } from 'svelte/transition';
    import { cubicOut, quintOut } from 'svelte/easing';
    import { flip } from 'svelte/animate';

    const df = new DateFormatter('fr-FR', { dateStyle: 'full' });

    let visites = $state<any[]>([]);
    let slots = $state<any[]>([]);
    let loadingVisites = $state(true);
    let loadingSlots = $state(false);

    let value = $state<DateValue | undefined>(
        booking.tourSelection.selectedDate as unknown as DateValue
    );

    let placeholder = $state<DateValue>(value ?? today(getLocalTimeZone()));
    let selectedVisiteId = $state<number | null>(null);
    let hoveredDate = $state<DateValue | null>(null);

    // Reactively fetch slots when date or activity changes
    $effect(() => {
        booking.tourSelection.selectedDate = value as unknown as CalendarDate;
        if (value && selectedVisiteId) {
            untrack(() => loadSlots(value!.toString()));
        }
    });

    onMount(async () => {
        try {
            const data = await fetchVisites(fetch);
            visites = data || [];
            if (visites.length > 0) selectedVisiteId = visites[0].id;
        } finally {
            loadingVisites = false;
        }
    });

    async function loadSlots(dateStr: string) {
        if (!selectedVisiteId) return;
        loadingSlots = true;
        try {
            slots = await fetchSlots(selectedVisiteId, dateStr, fetch);
            // Auto-deselect slot if not available on the new date
            if (!slots.some(s => s.id === booking.tourSelection.creneau_visite)) {
                booking.tourSelection.creneau_visite = null;
            }
        } finally {
            loadingSlots = false;
        }
    }

    const currentSlot = $derived(slots.find(s => s.id === booking.tourSelection.creneau_visite));
    const maxPlaces = $derived(currentSlot ? (currentSlot.capacite_max - (currentSlot.place_reservee || 0)) : 10);

    // Constraint: can't book more places than available
    $effect(() => {
        if (booking.tourSelection.quantite_billets > maxPlaces) {
            booking.tourSelection.quantite_billets = maxPlaces;
        }
    });

    function formatTime(isoString: string) {
        return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
    <div class="space-y-8">
        <div class="space-y-4">
            <span class="text-xs font-bold text-primary tracking-widest uppercase">Activité</span>
            <div class="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                {#each visites as visite, i (visite.id)}
                    <button
                            onclick={() => selectedVisiteId = visite.id}
                            class="px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all border
                        {selectedVisiteId === visite.id ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-[#252426] border-limestone-200 text-iron-muted'}"
                    >
                        {visite.nom}
                    </button>
                {/each}
            </div>
        </div>

        <div class="p-6 bg-white dark:bg-[#252426] rounded-3xl border border-limestone-200">
            <Calendar.Root bind:value bind:placeholder minValue={today(getLocalTimeZone())} locale="fr-FR" class="w-full">
                {#snippet children({ months, weekdays })}
                    <Calendar.Header class="flex items-center justify-between pb-6">
                        <Calendar.PrevButton class="calendar-nav-btn">←</Calendar.PrevButton>
                        <Calendar.Heading class="text-lg font-bold" />
                        <Calendar.NextButton class="calendar-nav-btn">→</Calendar.NextButton>
                    </Calendar.Header>
                    {#each months as month}
                        <Calendar.Grid class="w-full">
                            <Calendar.GridHead>
                                <Calendar.GridRow class="flex justify-between mb-2">
                                    {#each weekdays as day}
                                        <Calendar.HeadCell class="w-10 text-[10px] uppercase font-bold text-center">{day.slice(0, 2)}</Calendar.HeadCell>
                                    {/each}
                                </Calendar.GridRow>
                            </Calendar.GridHead>
                            <Calendar.GridBody>
                                {#each month.weeks as week}
                                    <Calendar.GridRow class="flex justify-between mt-1">
                                        {#each week as date}
                                            <Calendar.Cell {date} month={month.value}>
                                                <Calendar.Day {date} month={month.value} class="w-10 h-10 flex items-center justify-center rounded-lg text-sm transition-all data-[selected]:bg-primary data-[selected]:text-white" />
                                            </Calendar.Cell>
                                        {/each}
                                    </Calendar.GridRow>
                                {/each}
                            </Calendar.GridBody>
                        </Calendar.Grid>
                    {/each}
                {/snippet}
            </Calendar.Root>
        </div>
    </div>

    <div class="space-y-6">
        <h3 class="text-xl font-bold">{value ? df.format(value.toDate(getLocalTimeZone())) : 'Sélectionnez une date'}</h3>

        <div class="relative min-h-[200px]">
            {#if !value}
                <div class="absolute inset-0 flex items-center justify-center border-2 border-dashed rounded-3xl opacity-50">
                    <span>← Choisissez une date</span>
                </div>
            {:else if loadingSlots}
                <div class="animate-pulse space-y-3">
                    <div class="h-16 bg-limestone-100 rounded-2xl w-full"></div>
                </div>
            {:else if slots.length === 0}
                <p class="text-center p-8 bg-limestone-50 rounded-3xl">Aucun créneau disponible.</p>
            {:else}
                <div class="grid grid-cols-1 gap-3">
                    {#each slots as slot, i (slot.id)}
                        <button
                                onclick={() => booking.tourSelection.creneau_visite = slot.id}
                                class="p-4 rounded-2xl border-2 flex justify-between items-center transition-all
                            {booking.tourSelection.creneau_visite === slot.id ? 'border-primary bg-primary text-white' : 'border-limestone-100 bg-white'}"
                        >
                            <span class="font-bold">{formatTime(slot.date_heure_debut)}</span>
                            <span class="text-xs font-bold">{slot.capacite_max - (slot.place_reservee || 0)} places</span>
                        </button>
                    {/each}
                </div>

                {#if booking.tourSelection.creneau_visite}
                    <div transition:slide class="mt-8 p-6 bg-white dark:bg-[#252426] rounded-3xl border-2 border-primary/10">
                        <div class="flex items-center justify-center gap-6">
                            <button onclick={() => booking.tourSelection.quantite_billets = Math.max(1, booking.tourSelection.quantite_billets - 1)} class="w-12 h-12 rounded-xl bg-limestone-50 border text-2xl">−</button>
                            <span class="text-4xl font-black w-16 text-center tabular-nums">{booking.tourSelection.quantite_billets}</span>
                            <button onclick={() => booking.tourSelection.quantite_billets = Math.min(maxPlaces, booking.tourSelection.quantite_billets + 1)} class="w-12 h-12 rounded-xl bg-limestone-50 border text-2xl">+</button>
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</div>