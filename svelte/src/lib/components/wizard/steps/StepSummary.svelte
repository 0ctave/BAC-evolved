<script lang="ts">
    import { booking } from '$lib/logic/booking.svelte';
    import { fetchRoomDetails, fetchSlotDetails, fetchPricingRules } from '$lib/directus/booking-fetchers';
    import { calculateStayPrice, type PricingResult } from '$lib/logic/pricing';
    import { onMount } from 'svelte';
    import { CalendarDate } from '@internationalized/date';
    import { fly, fade, slide } from 'svelte/transition';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';

    let details = $state<any>(null);
    let pricing = $state<PricingResult | null>(null);
    let loading = $state(true);

    // Animated total
    const displayedTotal = tweened(0, { duration: 1000, easing: cubicOut });

    const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    onMount(async () => {
        try {
            if (booking.type === 'CHAMBRE' && booking.roomSelection.chambre) {
                const [roomData, pricingRules] = await Promise.all([
                    fetchRoomDetails(Number(booking.roomSelection.chambre), fetch),
                    fetchPricingRules(fetch)
                ]);

                if (roomData) {
                    const pricePerNight = roomData.prix_nuit;
                    const start = booking.roomSelection.date_arrivee as CalendarDate;
                    const end = booking.roomSelection.date_depart as CalendarDate;

                    const startDateObj = new Date(start.year, start.month - 1, start.day);
                    const endDateObj = new Date(end.year, end.month - 1, end.day);

                    pricing = calculateStayPrice(pricePerNight, start, end, pricingRules, {
                        adults: booking.roomSelection.adults,
                        children: booking.roomSelection.children,
                        parking: booking.roomSelection.parking,
                        roomId: booking.roomSelection.chambre
                    });

                    details = {
                        title: roomData.nom,
                        subtitle: 'Hébergement',
                        basePrice: pricePerNight,
                        quantityLabel: `${pricing.details.length} nuit(s)`,
                        dateRange: `Du ${dateFormatter.format(startDateObj)} au ${dateFormatter.format(endDateObj)}`
                    };
                }
            } else if (booking.type === 'VISITE' && booking.tourSelection.creneau_visite) {
                const slotData = await fetchSlotDetails(booking.tourSelection.creneau_visite, fetch);
                if (slotData) {
                    const unitPrice = slotData.visite_id.prix_unitaire ?? 0;
                    const total = booking.tourSelection.quantite_billets * unitPrice;
                    const dateObj = new Date(slotData.date_heure_debut);

                    details = {
                        title: slotData.visite_id.nom,
                        subtitle: 'Activité',
                        dateRange: dateObj.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }),
                        basePrice: unitPrice,
                        quantityLabel: `${booking.tourSelection.quantite_billets} billet(s)`
                    };

                    pricing = { total, baseTotal: total, details: [], appliedRules: [] };
                }
            }

            if (pricing) {
                displayedTotal.set(pricing.total);
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    });
</script>

<div class="max-w-xl mx-auto">
    <div class="text-center mb-10" in:fly={{ y: -20, duration: 600 }}>
        <h2 class="text-3xl font-heading italic text-iron dark:text-limestone-50">Récapitulatif</h2>
        <div class="w-12 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
    </div>

    {#if loading}
        <div class="h-64 bg-limestone-100 dark:bg-iron-light rounded-sm animate-pulse"></div>
    {:else if details && pricing}
        <!-- Manifest Style Card -->
        <div in:fly={{ y: 50, duration: 800, easing: cubicOut }}
             class="bg-white dark:bg-[#252426] border-2 border-iron/10 dark:border-limestone-100/10 shadow-retro dark:shadow-none p-8 relative transform hover:-translate-y-1 transition-transform duration-500">

            <!-- Holes decoration (Punch card effect) -->
            <div class="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[var(--background-color)] rounded-full border-r-2 border-iron/10 dark:border-limestone-100/10"></div>
            <div class="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[var(--background-color)] rounded-full border-l-2 border-iron/10 dark:border-limestone-100/10"></div>

            <div class="border-b-2 border-dashed border-iron/10 dark:border-limestone-100/10 pb-6 mb-6">
                <span class="text-xs font-bold uppercase tracking-[0.2em] text-primary block mb-2">{details.subtitle}</span>
                <h3 class="text-3xl font-heading font-bold text-iron dark:text-limestone-50 leading-tight">{details.title}</h3>
                {#if details.dateRange}
                    <p class="text-iron-muted dark:text-limestone-300 font-serif italic mt-3 text-lg border-l-2 border-primary/30 pl-3">{details.dateRange}</p>
                {/if}
            </div>

            <!-- Itemized List -->
            <div class="space-y-3 font-sans text-sm">
                <div class="flex justify-between items-center text-iron dark:text-limestone-100">
                    <span>Prix de base ({details.quantityLabel})</span>
                    <span class="font-bold">{pricing.baseTotal}€</span>
                </div>

                {#if pricing.appliedRules && pricing.appliedRules.length > 0}
                    {#each pricing.appliedRules as rule, i}
                        <div class="flex justify-between items-center" in:slide={{ axis: 'y', duration: 300, delay: i * 100 }}>
                            <span class="text-iron-muted dark:text-limestone-400 italic">{rule.name}</span>
                            <span class="{rule.amount < 0 ? 'text-green-600 dark:text-green-400' : 'text-iron dark:text-limestone-200'} font-medium">
                                {rule.amount > 0 ? '+' : ''}{rule.amount}€
                            </span>
                        </div>
                    {/each}
                {/if}
            </div>

            <!-- Total -->
            <div class="mt-8 pt-6 border-t-2 border-iron dark:border-limestone-100 flex justify-between items-end">
                <span class="font-heading font-bold text-xl text-iron dark:text-limestone-50">Total</span>
                <span class="font-bold text-4xl text-primary tabular-nums tracking-tighter">
                    {$displayedTotal.toFixed(2)}€
                </span>
            </div>
        </div>

        <!-- Guest Info Mini-Card -->
        <div in:fly={{ y: 20, duration: 600, delay: 200 }}>
            <button
                    onclick={() => booking.step = 2}
                    class="w-full mt-8 p-4 border-2 border-iron/10 dark:border-limestone-100/10 bg-white dark:bg-[#252426] flex items-center gap-4 hover:border-primary transition-colors group shadow-retro-sm hover:shadow-retro active:translate-y-1 active:shadow-none duration-200"
            >
                <div class="w-10 h-10 border border-iron/20 flex items-center justify-center text-iron-muted dark:text-limestone-300 font-heading font-bold rounded-full group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                    {booking.customer.prenom.charAt(0)}
                </div>
                <div class="flex-1 text-left">
                    <p class="font-bold text-iron dark:text-limestone-50 group-hover:text-primary transition-colors">{booking.customer.prenom} {booking.customer.nom}</p>
                    <p class="text-xs text-iron-muted dark:text-limestone-400">{booking.customer.email}</p>
                </div>
                <span class="text-xs font-bold uppercase text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">Modifier</span>
            </button>
        </div>
    {/if}
</div>