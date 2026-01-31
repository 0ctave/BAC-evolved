<script lang="ts">
    import { booking } from '$lib/logic/booking.svelte';
    import { fetchRoomDetails, fetchSlotDetails, fetchPricingRules } from '$lib/directus/booking-fetchers';
    import { calculateStayPrice, type PricingResult } from '$lib/logic/pricing';
    import { onMount } from 'svelte';
    import { CalendarDate } from '@internationalized/date';
    import { fly, slide } from 'svelte/transition';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';
    import { page } from "$app/state";

    let details = $state<any>(null);
    let pricing = $state<PricingResult | null>(null);
    let loading = $state(true);

    const displayedTotal = tweened(0, { duration: 1000, easing: cubicOut });
    const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    // Translations
    const l = $derived(booking.labels);

    onMount(async () => {
        try {
            if (booking.type === 'CHAMBRE' && booking.roomSelection.chambre) {
                const [roomData, rules] = await Promise.all([
                    fetchRoomDetails(Number(booking.roomSelection.chambre), fetch),
                    fetchPricingRules(fetch)
                ]);

                if (roomData && booking.roomSelection.date_arrivee && booking.roomSelection.date_depart) {
                    pricing = calculateStayPrice(
                        roomData.prix_nuit,
                        booking.roomSelection.date_arrivee as CalendarDate,
                        booking.roomSelection.date_depart as CalendarDate,
                        rules,
                        {
                            adults: booking.roomSelection.adults,
                            children: booking.roomSelection.children,
                            parking: booking.roomSelection.parking,
                            roomId: booking.roomSelection.chambre
                        }
                    );

                    details = {
                        title: roomData.nom,
                        subtitle: l.summary_subtitle_room,
                        dateRange: `Du ${dateFormatter.format(booking.roomSelection.date_arrivee.toDate('UTC'))} au ${dateFormatter.format(booking.roomSelection.date_depart.toDate('UTC'))}`,
                        quantityLabel: `${pricing.details.length} ${l.summary_unit_night}`
                    };
                }
            } else if (booking.type === 'VISITE' && booking.tourSelection.creneau_visite) {
                const slot = await fetchSlotDetails(booking.tourSelection.creneau_visite, fetch);
                if (slot) {
                    const unitPrice = slot.visite_id.prix_unitaire ?? 0;
                    const total = booking.tourSelection.quantite_billets * unitPrice;
                    pricing = { total, baseTotal: total, details: [], appliedRules: [] };
                    details = {
                        title: slot.visite_id.nom,
                        subtitle: l.summary_subtitle_visit,
                        dateRange: new Date(slot.date_heure_debut).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }),
                        quantityLabel: `${booking.tourSelection.quantite_billets} ${l.summary_unit_ticket}`
                    };
                }
            }
            if (pricing) displayedTotal.set(pricing.total);
        } catch (e) {
            console.error("Summary error:", e);
        } finally {
            loading = false;
        }
    });
</script>

<div class="max-w-xl mx-auto space-y-8">
    <!-- Header -->
    <div class="text-center" in:fly={{ y: -20, duration: 600 }}>
        <h2 class="heading-page">{l.summary_title}</h2>
        <div class="w-16 h-1 bg-primary mx-auto rounded-full"></div>
    </div>

    {#if loading}
        <!-- Loading Skeleton -->
        <div class="surface-atelier h-96 w-full animate-pulse bg-limestone-50/50 dark:bg-iron-light/10"></div>
    {:else if details && pricing}
        <!-- Main Summary Card -->
        <div class="surface-atelier p-8 md:p-10 relative" in:fly={{ y: 30, duration: 600, delay: 100 }}>

            <!-- Top Section: Title & Dates -->
            <div class="border-b-2 border-black/10 dark:border-white/10 pb-6 mb-6">
                <div class="flex justify-between items-start gap-4">
                    <div>
                        <span class="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">{details.subtitle}</span>
                        <h3 class="text-3xl md:text-4xl font-heading font-bold text-iron dark:text-limestone-50 leading-tight">
                            {details.title}
                        </h3>
                    </div>
                </div>

                <div class="mt-6 flex items-start gap-3 text-iron/80 dark:text-limestone-200">
                    <div class="mt-1 p-1.5 rounded bg-limestone-100 dark:bg-iron-light border border-black/5 dark:border-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <p class="font-heading font-medium text-xl">{details.dateRange}</p>
                        {#if booking.type === 'CHAMBRE'}
                            <p class="text-sm text-iron-muted dark:text-limestone-400 mt-0.5">
                                {booking.roomSelection.adults} {booking.roomSelection.adults > 1 ? l.price_est_unit_adults : l.price_est_unit_adult}
                                {#if booking.roomSelection.children > 0}
                                    , {booking.roomSelection.children} {booking.roomSelection.children > 1 ? l.price_est_unit_children : l.price_est_unit_child}
                                {/if}
                            </p>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Pricing Breakdown -->
            <div class="space-y-4">
                <div class="flex justify-between items-center text-lg font-medium text-iron dark:text-limestone-100">
                    <span>{l.summary_base_price} <span class="text-sm text-iron-muted dark:text-limestone-400 font-normal">({details.quantityLabel})</span></span>
                    <span class="tabular-nums">{pricing.baseTotal}€</span>
                </div>

                {#if pricing.appliedRules.length > 0}
                    <div class="space-y-2 py-2">
                        {#each pricing.appliedRules as rule}
                            <div class="flex justify-between items-center text-sm" transition:slide>
                                <span class="text-iron-muted dark:text-limestone-400 italic flex items-center gap-2">
                                    <span class="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                                    {rule.name}
                                </span>
                                <span class="font-medium tabular-nums {rule.amount < 0 ? 'text-primary' : 'text-iron dark:text-limestone-200'}">
                                    {rule.amount > 0 ? '+' : ''}{rule.amount}€
                                </span>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Total Section -->
            <div class="mt-8 pt-6 border-t-2 border-black dark:border-white flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
                <span class="font-heading font-bold text-2xl text-iron dark:text-limestone-50">{l.summary_total}</span>
                <div class="text-right">
                    <span class="block text-5xl font-heading font-bold text-primary tabular-nums tracking-tighter leading-none">
                        {$displayedTotal.toFixed(2)}€
                    </span>
                    <span class="text-[10px] font-bold uppercase tracking-widest text-iron-muted/60 dark:text-limestone-400/60 mt-1 block">
                        {l.price_est_tax_included}
                    </span>
                </div>
            </div>
        </div>

        <!-- Customer Edit Card -->
        <button
                onclick={() => booking.step = 2}
                class="surface-interactive w-full flex items-center gap-5 !p-5 group"
                in:fly={{ y: 30, duration: 600, delay: 200 }}
        >
            <div class="w-14 h-14 rounded-full border-2 border-black dark:border-white bg-limestone-100 dark:bg-iron-light flex items-center justify-center font-heading font-bold text-2xl text-iron dark:text-limestone-50 group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-sm">
                {booking.customer.prenom.charAt(0).toUpperCase()}
            </div>

            <div class="flex-1 text-left min-w-0">
                <div class="flex items-center gap-2">
                    <p class="font-bold text-lg text-iron dark:text-limestone-50 group-hover:text-primary transition-colors truncate">
                        {booking.customer.prenom} {booking.customer.nom}
                    </p>
                </div>
                <p class="text-sm text-iron-muted dark:text-limestone-400 truncate">{booking.customer.email}</p>
                <p class="text-sm text-iron-muted dark:text-limestone-400 truncate">{booking.customer.telephone}</p>
            </div>

            <div class="flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                <span class="text-xs font-bold uppercase tracking-widest text-iron-muted dark:text-limestone-400 group-hover:text-primary transition-colors">{l.summary_edit_button}</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-iron-muted dark:text-limestone-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            </div>
        </button>
    {/if}
</div>