<script lang="ts">
    import { booking } from '$lib/logic/booking.svelte';
    import { fetchVisites, fetchAllUpcomingSlots } from '$lib/directus/booking-fetchers';
    import { today, getLocalTimeZone, CalendarDate } from "@internationalized/date";
    import type { DateValue } from "@internationalized/date";
    import { onMount, untrack } from 'svelte';
    import { fade, slide } from 'svelte/transition';

    // Sub-components using absolute paths
    import TourCalendarView from "$lib/components/wizard/steps/tour/TourCalendarView.svelte";
    import TourList from "$lib/components/wizard/steps/tour/TourList.svelte";
    import SlotSelector from "$lib/components/wizard/steps/tour/SlotSelector.svelte";
    import TicketSelector from "$lib/components/wizard/steps/tour/TicketSelector.svelte";

    let visites = $state<any[]>([]);
    let allSlots = $state<any[]>([]);
    let loadingData = $state(true);

    // Filter states
    let value = $state<DateValue | undefined>(
        booking.tourSelection.selectedDate ? (booking.tourSelection.selectedDate as unknown as DateValue) : undefined
    );
    let placeholder = $state<DateValue>(value ?? today(getLocalTimeZone()));
    let selectedVisiteId = $state<number | 'all'>('all');

    const l = $derived(booking.labels);

    onMount(async () => {
        try {
            const [vData, sData] = await Promise.all([
                fetchVisites(fetch),
                fetchAllUpcomingSlots(fetch)
            ]);
            visites = vData || [];
            allSlots = sData || [];
        } finally {
            loadingData = false;
        }
    });

    // Calendar indicators (dots) strictly for the chosen activity
    const availableDates = $derived.by(() => {
        const set = new Set<string>();
        allSlots.forEach(slot => {
            if (slot.date_heure_debut) {
                const sId = typeof slot.visite_id === 'object' ? slot.visite_id?.id : slot.visite_id;
                const matches = selectedVisiteId === 'all' || String(sId) === String(selectedVisiteId);
                if (matches) set.add(slot.date_heure_debut.split('T')[0]);
            }
        });
        return set;
    });

    /**
     * PERSISTENT SLOT LOGIC:
     * - If date is selected: show slots for that day.
     * - If no date selected: show next 3 sessions chronologicaly.
     */
    let filteredSlots = $derived.by(() => {
        let base = allSlots.filter(slot => {
            const sId = typeof slot.visite_id === 'object' ? slot.visite_id?.id : slot.visite_id;
            return selectedVisiteId === 'all' || String(sId) === String(selectedVisiteId);
        });

        if (value) {
            const dateStr = value.toString();
            return base.filter(slot => slot.date_heure_debut.startsWith(dateStr));
        }

        return [...base]
            .sort((a, b) => a.date_heure_debut.localeCompare(b.date_heure_debut))
            .slice(0, 3);
    });

    $effect(() => {
        const d = value;
        untrack(() => {
            booking.tourSelection.selectedDate = d ? (d as unknown as CalendarDate) : null;
        });
    });

    const currentSlot = $derived(allSlots.find(s => String(s.id) === String(booking.tourSelection.creneau_visite)));
    const currentVisite = $derived.by(() => {
        if (!currentSlot) return null;
        const sId = typeof currentSlot.visite_id === 'object' ? currentSlot.visite_id?.id : currentSlot.visite_id;
        return visites.find(v => String(v.id) === String(sId));
    });

    const maxPlacesAvailable = $derived(currentSlot ? (currentSlot.capacite_max - (currentSlot.place_reservee || 0)) : 10);

    function handleVisiteSelect(id: number | 'all') {
        selectedVisiteId = id;
        booking.tourSelection.creneau_visite = null;
    }

    function handleSlotSelect(id: string | number) {
        const slot = allSlots.find(s => String(s.id) === String(id));
        if (slot && !value) {
            const dateStr = slot.date_heure_debut.split('T')[0];
            const [y, m, d] = dateStr.split('-').map(Number);
            value = new CalendarDate(y, m, d);
        }
        booking.tourSelection.creneau_visite = String(id);
    }

    function handleClearSelection() {
        value = undefined;
        booking.tourSelection.creneau_visite = null;
    }

    function formatTimeRange(isoString: string, duration: number) {
        if (!isoString) return "";
        const start = new Date(isoString);
        const end = new Date(start.getTime() + (duration || 0) * 60000);
        const opt: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
        return `${start.toLocaleTimeString('fr-FR', opt)} — ${end.toLocaleTimeString('fr-FR', opt)}`;
    }
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
    <div class="space-y-8">
        <TourList
                visites={visites}
                selectedId={selectedVisiteId}
                onSelect={handleVisiteSelect}
                loading={loadingData}
        />

        <TourCalendarView
                bind:value
                bind:placeholder
                availableDates={availableDates}
                onReset={handleClearSelection}
        />
    </div>

    <div class="flex flex-col h-full space-y-8">
        <div>
            <span class="text-xs font-bold text-primary tracking-widest uppercase">{l.step_tour_step_label || 'Étape 2'}</span>
            <h3 class="text-2xl font-heading font-bold text-iron dark:text-limestone-50 mt-1">
                {l.step_tour_title || 'Choisissez votre créneau'}
            </h3>
        </div>

        <!-- LIST PERSISTENCE: Slot list stays visible -->
        <SlotSelector
                slots={filteredSlots}
                visites={visites}
                loading={loadingData}
                selectedSlotId={booking.tourSelection.creneau_visite}
                onSelect={handleSlotSelect}
                hasDate={!!value}
        />

        {#if booking.tourSelection.creneau_visite && currentSlot && currentVisite}
            <div transition:slide={{ duration: 400 }} class="space-y-6 pt-6 border-t-2 border-iron/5">
                <TicketSelector
                        bind:quantity={booking.tourSelection.quantite_billets}
                        max={maxPlacesAvailable}
                        selectedDate={new Date(currentSlot.date_heure_debut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        timeRange={formatTimeRange(currentSlot.date_heure_debut, currentVisite.duree_minutes)}
                        visiteName={currentVisite.nom}
                />
            </div>
        {/if}

        <div class="mt-auto pt-6 border-t-2 border-iron/5">
            {#if currentSlot && currentVisite}
                <div class="bg-primary/5 border border-primary/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden" in:fade>
                    <div class="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none mix-blend-overlay"></div>
                    <p class="text-sm text-iron-muted dark:text-limestone-400 font-bold uppercase tracking-widest">{l.price_est_total_label || 'Total estimé'}</p>
                    <div class="flex flex-col items-center relative z-10">
                        <span class="text-6xl font-bold text-primary tabular-nums tracking-tighter leading-none italic">
                            {(Number(currentVisite.prix_unitaire || 0) * booking.tourSelection.quantite_billets).toFixed(0)}€
                        </span>
                        <span class="text-[10px] text-iron-muted/60 dark:text-limestone-400/60 font-bold uppercase tracking-widest mt-1">
                            {l.price_est_tax_included || 'Taxes incluses'}
                        </span>
                    </div>
                </div>
            {:else}
                <div class="bg-limestone-50 dark:bg-iron/5 border-2 border-dashed border-iron/10 rounded-2xl p-10 text-center text-iron-muted/60 text-base italic flex flex-col items-center justify-center min-h-[128px]">
                    <p>{value ? 'Veuillez choisir un créneau horaire' : 'Veuillez choisir une date sur le calendrier'}</p>
                </div>
            {/if}
        </div>
    </div>
</div>