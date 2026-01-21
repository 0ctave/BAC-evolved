<script lang="ts">
    import { booking } from '$lib/logic/booking.svelte';
    import { fetchVisites, fetchSlots } from '$lib/directus/booking-fetchers';
    import { Calendar } from "bits-ui";
    import { today, getLocalTimeZone, DateFormatter, type DateValue, CalendarDate } from "@internationalized/date";
    import { onMount } from 'svelte';
    import { fly, fade, slide } from 'svelte/transition';
    import { cubicOut, quintOut } from 'svelte/easing';
    import { flip } from 'svelte/animate';

    const df = new DateFormatter('fr-FR', { dateStyle: 'full' });

    let visites = $state<any[]>([]);
    let slots = $state<any[]>([]);
    let loadingVisites = $state(true);
    let loadingSlots = $state(false);

    let value = $state<DateValue | undefined>(
        booking.tourSelection.selectedDate ? (booking.tourSelection.selectedDate as unknown as DateValue) : undefined
    );

    let placeholder = $state<DateValue>(
        value ?? today(getLocalTimeZone())
    );

    let selectedVisiteId = $state<number | null>(null);
    let hoveredDate = $state<DateValue | null>(null);

    $effect(() => {
        booking.tourSelection.selectedDate = value ? (value as unknown as CalendarDate) : null;

        if (value) {
            placeholder = value;
            loadSlots(value.toString());
        }
    });

    onMount(async () => {
        try {
            const data = await fetchVisites(fetch);
            visites = data || [];
            if(visites.length > 0) selectedVisiteId = visites[0].id;
        } catch (e) {
            console.error("Erreur chargement visites", e);
        } finally {
            loadingVisites = false;
        }
    });

    async function loadSlots(dateStr: string) {
        if (!selectedVisiteId) return;

        loadingSlots = true;
        booking.tourSelection.creneau_visite = null;

        try {
            slots = await fetchSlots(selectedVisiteId, dateStr, fetch);
        } catch (e) {
            console.error(e);
        } finally {
            loadingSlots = false;
        }
    }

    const start = today(getLocalTimeZone());

    function formatTime(isoString: string) {
        return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
    <div class="space-y-8">
        <!-- Tabs Visites -->
        <div class="space-y-4">
            <span class="text-xs font-bold text-primary tracking-widest uppercase">Activité</span>

            {#if loadingVisites}
                <div class="h-12 bg-limestone-100 dark:bg-iron-light rounded-full animate-pulse"></div>
            {:else}
                <div class="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                    {#each visites as visite, i}
                        <div in:fly={{ x: 20, duration: 400, delay: i * 50 }}>
                            <button
                                    onclick={() => { selectedVisiteId = visite.id; if(value) loadSlots(value.toString()); }}
                                    class="px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm border active:scale-95
                                {selectedVisiteId === visite.id
                                    ? 'bg-primary text-white border-primary shadow-primary/30'
                                    : 'bg-white dark:bg-[#252426] border-limestone-200 dark:border-iron-light text-iron-muted dark:text-limestone-300 hover:border-primary hover:text-primary'}"
                            >
                                {visite.nom}
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Calendrier -->
        <div class="p-6 bg-white dark:bg-[#252426] rounded-3xl border border-limestone-200 dark:border-iron-light shadow-paper dark:shadow-none transition-colors">
            <Calendar.Root
                    bind:value
                    bind:placeholder
                    minValue={start}
                    class="w-full select-none"
                    locale="fr-FR"
                    type="single"
                    fixedWeeks={true}
            >
                {#snippet children({ months, weekdays })}
                    <Calendar.Header class="flex items-center justify-between pb-6">
                        <Calendar.PrevButton class="w-10 h-10 flex items-center justify-center hover:bg-limestone-50 dark:hover:bg-iron rounded-full transition-all text-iron-muted dark:text-limestone-300 hover:scale-110 active:scale-90">
                            <span class="mb-0.5 transform -translate-x-[1px]">←</span>
                        </Calendar.PrevButton>
                        <Calendar.Heading class="text-lg font-bold text-iron dark:text-limestone-50 capitalize tabular-nums" />
                        <Calendar.NextButton class="w-10 h-10 flex items-center justify-center hover:bg-limestone-50 dark:hover:bg-iron rounded-full transition-all text-iron-muted dark:text-limestone-300 hover:scale-110 active:scale-90">
                            <span class="mb-0.5 transform translate-x-[1px]">→</span>
                        </Calendar.NextButton>
                    </Calendar.Header>

                    <div class="flex flex-col space-y-4">
                        {#each months as month}
                            <Calendar.Grid class="w-full border-collapse">
                                <Calendar.GridHead>
                                    <Calendar.GridRow class="flex w-full justify-between mb-2">
                                        {#each weekdays as day}
                                            <Calendar.HeadCell class="w-10 text-[10px] uppercase tracking-wider text-iron-muted dark:text-limestone-400 font-bold text-center">
                                                {day.slice(0, 2)}
                                            </Calendar.HeadCell>
                                        {/each}
                                    </Calendar.GridRow>
                                </Calendar.GridHead>
                                <Calendar.GridBody>
                                    {#each month.weeks as week}
                                        <Calendar.GridRow class="flex w-full justify-between mt-1">
                                            {#each week as date}
                                                <Calendar.Cell {date} month={month.value} class="relative p-0 m-0">
                                                    <Calendar.Day
                                                            {date}
                                                            month={month.value}
                                                            onmouseenter={() => hoveredDate = date}
                                                            onmouseleave={() => hoveredDate = null}
                                                            class="day-cell-animated w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300
                                                        data-[selected]:bg-primary data-[selected]:text-white data-[selected]:shadow-lg data-[selected]:shadow-primary/30
                                                        data-[unavailable]:text-iron-muted/30 dark:data-[unavailable]:text-limestone-400/30 data-[unavailable]:line-through
                                                        text-iron dark:text-limestone-100
                                                        focus:outline-none relative z-10"
                                                    />
                                                </Calendar.Cell>
                                            {/each}
                                        </Calendar.GridRow>
                                    {/each}
                                </Calendar.GridBody>
                            </Calendar.Grid>
                        {/each}
                    </div>
                {/snippet}
            </Calendar.Root>
        </div>
    </div>

    <!-- Créneaux -->
    <div class="space-y-6">
        <div>
            <span class="text-xs font-bold text-primary tracking-widest uppercase">Disponibilités</span>
            <h3 class="text-xl font-bold text-iron dark:text-limestone-50 mt-1 first-letter:capitalize tabular-nums">
                {value ? df.format(value.toDate(getLocalTimeZone())) : 'Sélectionnez une date'}
            </h3>
        </div>

        <div class="relative min-h-[200px]">
            {#if !value}
                <div in:fade={{ duration: 300 }} class="absolute inset-0 h-40 flex items-center justify-center rounded-3xl border-2 border-dashed border-limestone-200 dark:border-iron-light text-iron-muted dark:text-limestone-400 bg-limestone-50/50 dark:bg-iron/30">
                    <span class="animate-pulse">← Choisissez une date sur le calendrier</span>
                </div>
            {:else if loadingSlots}
                <div class="space-y-3 absolute inset-0 z-20 bg-[var(--background-color)]" out:fade={{ duration: 200 }}>
                    <div class="h-16 bg-limestone-100 dark:bg-iron-light rounded-2xl w-full animate-pulse"></div>
                    <div class="h-16 bg-limestone-100 dark:bg-iron-light rounded-2xl w-full animate-pulse" style="animation-delay: 100ms"></div>
                </div>
            {:else if slots.length === 0}
                <div in:fly={{ y: 10, duration: 400 }} class="p-8 bg-limestone-50 dark:bg-iron text-iron-muted dark:text-limestone-400 rounded-3xl border border-limestone-100 dark:border-iron-light text-center">
                    <p>Aucun créneau disponible pour cette date.</p>
                </div>
            {:else}
                <div class="grid grid-cols-1 gap-3">
                    {#each slots as slot, i (slot.id)}
                        <div animate:flip={{ duration: 400, easing: quintOut }} in:fly={{ y: 20, duration: 400, delay: i * 75, easing: cubicOut }}>
                            <button
                                    onclick={() => booking.tourSelection.creneau_visite = slot.id}
                                    class="p-4 rounded-2xl border-2 flex justify-between items-center transition-all duration-300 group w-full text-left active:scale-[0.98]
                                {booking.tourSelection.creneau_visite === slot.id
                                    ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'border-limestone-100 dark:border-iron-light bg-white dark:bg-[#252426] text-iron dark:text-limestone-100 hover:border-primary/30 hover:shadow-md'}"
                            >
                                <span class="font-bold text-lg tracking-tight tabular-nums">{formatTime(slot.date_heure_debut)}</span>
                                <div class="flex items-center gap-3">
                                    <span class="text-xs font-bold opacity-80">
                                        {slot.capacite_max - (slot.place_reservee || 0)} places
                                    </span>
                                    <div class="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center opacity-60 transition-all duration-300 group-hover:opacity-100">
                                        {#if booking.tourSelection.creneau_visite === slot.id}
                                            <div class="w-3 h-3 bg-white rounded-full" in:scale={{ duration: 200 }}></div>
                                        {/if}
                                    </div>
                                </div>
                            </button>
                        </div>
                    {/each}
                </div>

                {#if booking.tourSelection.creneau_visite}
                    <div transition:slide={{ axis: 'y', duration: 400, easing: quintOut }}>
                        <div class="mt-8 p-6 bg-white dark:bg-[#252426] rounded-3xl border-2 border-primary/10 shadow-xl shadow-primary/5 text-center">
                            <label class="block text-xs font-bold text-iron-muted dark:text-limestone-400 uppercase tracking-widest mb-4">Participants</label>
                            <div class="flex items-center justify-center gap-6">
                                <button
                                        onclick={() => booking.tourSelection.quantite_billets = Math.max(1, booking.tourSelection.quantite_billets - 1)}
                                        class="w-12 h-12 rounded-xl bg-limestone-50 dark:bg-iron border border-limestone-200 dark:border-iron-light shadow-sm text-2xl font-bold text-iron-muted dark:text-limestone-300 hover:text-primary dark:hover:text-primary hover:border-primary hover:bg-white dark:hover:bg-[#2a292b] transition-all active:scale-90"
                                >−</button>

                                <span class="text-4xl font-black text-iron dark:text-limestone-50 w-16 h-10 flex items-center justify-center relative overflow-hidden tabular-nums">
                                    {#key booking.tourSelection.quantite_billets}
                                        <span in:fly={{ y: 20, duration: 250 }} class="absolute">
                                            {booking.tourSelection.quantite_billets}
                                        </span>
                                    {/key}
                                </span>

                                <button
                                        onclick={() => booking.tourSelection.quantite_billets += 1}
                                        class="w-12 h-12 rounded-xl bg-limestone-50 dark:bg-iron border border-limestone-200 dark:border-iron-light shadow-sm text-2xl font-bold text-iron-muted dark:text-limestone-300 hover:text-primary dark:hover:text-primary hover:border-primary hover:bg-white dark:hover:bg-[#2a292b] transition-all active:scale-90"
                                >+</button>
                            </div>
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }

    :global(.day-cell-animated:not([data-disabled]):hover) {
        transform: scale(1.15);
        z-index: 20;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        background-color: var(--background-color);
    }

    :global(.day-cell-animated:active) {
        transform: scale(0.9);
    }
</style>