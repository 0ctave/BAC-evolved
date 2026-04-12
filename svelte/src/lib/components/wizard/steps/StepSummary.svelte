<script lang="ts">
	import { booking } from '$lib/logic/booking.svelte';
	import {
		fetchRoomDetails,
		fetchSlotDetails,
		fetchPricingRules
	} from '$lib/directus/booking-fetchers';
	import { calculateStayPrice, type PricingResult } from '$lib/logic/pricing';
	import { onMount } from 'svelte';
	import { CalendarDate } from '@internationalized/date';
	import { fly, slide } from 'svelte/transition';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	let details = $state<any>(null);
	let pricing = $state<PricingResult | null>(null);
	let loading = $state(true);

	const displayedTotal = tweened(0, { duration: 1000, easing: cubicOut });
	const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});

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
						dateRange: new Date(slot.date_heure_debut).toLocaleString('fr-FR', {
							dateStyle: 'long',
							timeStyle: 'short'
						}),
						quantityLabel: `${booking.tourSelection.quantite_billets} ${l.summary_unit_ticket}`
					};
				}
			}
			if (pricing) displayedTotal.set(pricing.total);
		} catch (e) {
			console.error('Summary error:', e);
		} finally {
			loading = false;
		}
	});
</script>

<div class="mx-auto max-w-xl space-y-8">
	<!-- Header -->
	<div class="text-center" in:fly={{ y: -20, duration: 600 }}>
		<h2 class="heading-page">{l.summary_title}</h2>
		<div class="bg-primary mx-auto h-1 w-16 rounded-full"></div>
	</div>

	{#if loading}
		<!-- Loading Skeleton -->
		<div
			class="surface-atelier bg-limestone-50/50 dark:bg-iron-light/10 h-96 w-full animate-pulse"
		></div>
	{:else if details && pricing}
		<!-- Main Summary Card -->
		<div class="surface-atelier relative p-8 md:p-10" in:fly={{ y: 30, duration: 600, delay: 100 }}>
			<!-- Top Section: Title & Dates -->
			<div class="mb-6 border-b-2 border-black/10 pb-6 dark:border-white/10">
				<div class="flex items-start justify-between gap-4">
					<div>
						<span class="text-primary mb-2 block text-xs font-bold tracking-widest uppercase"
							>{details.subtitle}</span
						>
						<h3
							class="font-heading text-iron dark:text-limestone-50 text-3xl leading-tight font-bold md:text-4xl"
						>
							{details.title}
						</h3>
					</div>
				</div>

				<div class="text-iron/80 dark:text-limestone-200 mt-6 flex items-start gap-3">
					<div
						class="bg-limestone-100 dark:bg-iron-light mt-1 rounded border border-black/5 p-1.5 dark:border-white/10"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z"
							/>
						</svg>
					</div>
					<div>
						<p class="font-heading text-xl font-medium">{details.dateRange}</p>
						{#if booking.type === 'CHAMBRE'}
							<p class="text-iron-muted dark:text-limestone-400 mt-0.5 text-sm">
								{booking.roomSelection.adults}
								{booking.roomSelection.adults > 1
									? l.price_est_unit_adults
									: l.price_est_unit_adult}
								{#if booking.roomSelection.children > 0}
									, {booking.roomSelection.children}
									{booking.roomSelection.children > 1
										? l.price_est_unit_children
										: l.price_est_unit_child}
								{/if}
							</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Pricing Breakdown -->
			<div class="space-y-4">
				<div
					class="text-iron dark:text-limestone-100 flex items-center justify-between text-lg font-medium"
				>
					<span
						>{l.summary_base_price}
						<span class="text-iron-muted dark:text-limestone-400 text-sm font-normal"
							>({details.quantityLabel})</span
						></span
					>
					<span class="tabular-nums">{pricing.baseTotal}€</span>
				</div>

				{#if pricing.appliedRules.length > 0}
					<div class="space-y-2 py-2">
						{#each pricing.appliedRules as rule (rule.name)}
							<div class="flex items-center justify-between text-sm" transition:slide>
								<span
									class="text-iron-muted dark:text-limestone-400 flex items-center gap-2 italic"
								>
									<span class="bg-primary/40 h-1.5 w-1.5 rounded-full"></span>
									{rule.name}
								</span>
								<span
									class="font-medium tabular-nums {rule.amount < 0
										? 'text-primary'
										: 'text-iron dark:text-limestone-200'}"
								>
									{rule.amount > 0 ? '+' : ''}{rule.amount}€
								</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Total Section -->
			<div
				class="mt-8 flex flex-col items-end justify-between gap-4 border-t-2 border-black pt-6 sm:flex-row sm:items-center dark:border-white"
			>
				<span class="font-heading text-iron dark:text-limestone-50 text-2xl font-bold"
					>{l.summary_total}</span
				>
				<div class="text-right">
					<span
						class="font-heading text-primary block text-5xl leading-none font-bold tracking-tighter tabular-nums"
					>
						{$displayedTotal.toFixed(2)}€
					</span>
					<span
						class="text-iron-muted/60 dark:text-limestone-400/60 mt-1 block text-[10px] font-bold tracking-widest uppercase"
					>
						{l.price_est_tax_included}
					</span>
				</div>
			</div>
		</div>

		<!-- Customer Edit Card -->
		<button
			onclick={() => (booking.step = 2)}
			class="surface-interactive group flex w-full items-center gap-5 !p-5"
			in:fly={{ y: 30, duration: 600, delay: 200 }}
		>
			<div
				class="bg-limestone-100 dark:bg-iron-light font-heading text-iron dark:text-limestone-50 group-hover:bg-primary flex h-14 w-14 items-center justify-center rounded-full border-2 border-black text-2xl font-bold shadow-sm transition-colors duration-300 group-hover:text-white dark:border-white"
			>
				{booking.customer.prenom.charAt(0).toUpperCase()}
			</div>

			<div class="min-w-0 flex-1 text-left">
				<div class="flex items-center gap-2">
					<p
						class="text-iron dark:text-limestone-50 group-hover:text-primary truncate text-lg font-bold transition-colors"
					>
						{booking.customer.prenom}
						{booking.customer.nom}
					</p>
				</div>
				<p class="text-iron-muted dark:text-limestone-400 truncate text-sm">
					{booking.customer.email}
				</p>
				<p class="text-iron-muted dark:text-limestone-400 truncate text-sm">
					{booking.customer.telephone}
				</p>
			</div>

			<div
				class="group-hover:border-primary/30 group-hover:bg-primary/5 flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 transition-all dark:border-white/10"
			>
				<span
					class="text-iron-muted dark:text-limestone-400 group-hover:text-primary text-xs font-bold tracking-widest uppercase transition-colors"
					>{l.summary_edit_button}</span
				>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="text-iron-muted dark:text-limestone-400 group-hover:text-primary h-3 w-3 transition-colors"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
					/>
				</svg>
			</div>
		</button>
	{/if}
</div>
