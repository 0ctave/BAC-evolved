<script lang="ts">
	import { booking } from '$lib/logic/booking.svelte';
	import { fetchVisites, fetchAllUpcomingSlots } from '$lib/directus/booking-fetchers';
	import { today, getLocalTimeZone, CalendarDate } from '@internationalized/date';
	import type { DateValue } from '@internationalized/date';
	import { onMount, untrack } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import type { ReservationsVisite } from '$lib/types/directus-schema';

	import TourCalendarView from '$lib/components/wizard/steps/tour/TourCalendarView.svelte';
	import TourList from '$lib/components/wizard/steps/tour/TourList.svelte';
	import SlotSelector from '$lib/components/wizard/steps/tour/SlotSelector.svelte';
	import TicketSelector from '$lib/components/wizard/steps/tour/TicketSelector.svelte';
	import { SvelteSet } from 'svelte/reactivity';

	let visites = $state<any[]>([]);
	let allSlots = $state<any[]>([]);
	let loadingData = $state(true);

	let value = $state<DateValue | undefined>(
		booking.tourSelection.selectedDate
			? (booking.tourSelection.selectedDate as unknown as DateValue)
			: undefined
	);
	let placeholder = $derived<DateValue>(value ?? today(getLocalTimeZone()));
	let selectedVisiteId = $state<number | 'all'>('all');

	const l = $derived(booking.labels);

	onMount(async () => {
		try {
			const [vData, sData] = await Promise.all([fetchVisites(fetch), fetchAllUpcomingSlots(fetch)]);
			visites = vData || [];
			allSlots = sData || [];
		} finally {
			loadingData = false;
		}
	});

	const availableDates = $derived.by(() => {
		const set = new SvelteSet<string>();
		allSlots.forEach((slot) => {
			if (slot.date_heure_debut) {
				const sId = typeof slot.visite_id === 'object' ? slot.visite_id?.id : slot.visite_id;
				const matches = selectedVisiteId === 'all' || String(sId) === String(selectedVisiteId);
				if (matches) set.add(slot.date_heure_debut.split('T')[0]);
			}
		});
		return set;
	});

	let filteredSlots = $derived.by(() => {
		let base = allSlots.filter((slot) => {
			const sId = typeof slot.visite_id === 'object' ? slot.visite_id?.id : slot.visite_id;
			return selectedVisiteId === 'all' || String(sId) === String(selectedVisiteId);
		});

		if (value) {
			const dateStr = value.toString();
			return base.filter((slot) => slot.date_heure_debut.startsWith(dateStr));
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

	const currentSlot = $derived(
		allSlots.find((s) => String(s.id) === String(booking.tourSelection.creneau_visite))
	);
	const currentVisite = $derived.by(() => {
		if (!currentSlot) return null;
		const sId =
			typeof currentSlot.visite_id === 'object' ? currentSlot.visite_id?.id : currentSlot.visite_id;
		return visites.find((v) => String(v.id) === String(sId));
	});

	/**
	 * Capacity Calculation
	 */
	const maxPlacesAvailable = $derived.by(() => {
		if (!currentSlot) return 0;

		const total = Number(currentSlot.capacite_max) || 0;
		let reserved = 0;

		const reservations = currentSlot.reservations_visite;

		if (Array.isArray(reservations)) {
			reserved = reservations.reduce((acc, r: ReservationsVisite) => {
				if (r && (r.statut === 'confirmee' || r.statut === 'en_attente')) {
					return acc + (Number(r.quantite_billets) || 0);
				}
				return acc;
			}, 0);
		}

		return Math.max(0, total - reserved);
	});

	$effect(() => {
		const max = maxPlacesAvailable;
		untrack(() => {
			if (booking.tourSelection.quantite_billets > max && max > 0) {
				booking.tourSelection.quantite_billets = max;
			} else if (max <= 0 && booking.tourSelection.creneau_visite) {
				booking.tourSelection.quantite_billets = 0;
			}
		});
	});

	function handleVisiteSelect(id: number | 'all') {
		selectedVisiteId = id;
		booking.tourSelection.creneau_visite = null;
	}

	function handleSlotSelect(id: string | number) {
		const slot = allSlots.find((s) => String(s.id) === String(id));
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
		if (!isoString) return '';
		const start = new Date(isoString);
		const end = new Date(start.getTime() + (duration || 0) * 60000);
		const opt: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
		return `${start.toLocaleTimeString('fr-FR', opt)} — ${end.toLocaleTimeString('fr-FR', opt)}`;
	}
</script>

<div class="grid grid-cols-1 gap-12 lg:grid-cols-2">
	<div class="space-y-8">
		<TourList
			{visites}
			selectedId={selectedVisiteId}
			onSelect={handleVisiteSelect}
			loading={loadingData}
		/>

		<TourCalendarView bind:value bind:placeholder {availableDates} onReset={handleClearSelection} />
	</div>

	<div class="flex h-full flex-col space-y-8">
		<div>
			<span class="text-primary text-xs font-bold tracking-widest uppercase"
				>{l.step_tour_step_label || 'Étape 2'}</span
			>
			<h3 class="font-heading text-iron dark:text-limestone-50 mt-1 text-2xl font-bold">
				{l.step_tour_title || 'Choisissez votre créneau'}
			</h3>
		</div>

		<SlotSelector
			slots={filteredSlots}
			{visites}
			loading={loadingData}
			selectedSlotId={booking.tourSelection.creneau_visite}
			onSelect={handleSlotSelect}
			hasDate={!!value}
		/>

		{#if booking.tourSelection.creneau_visite && currentSlot && currentVisite}
			<div transition:slide={{ duration: 400 }} class="border-iron/5 space-y-6 border-t-2 pt-6">
				<TicketSelector
					bind:quantity={booking.tourSelection.quantite_billets}
					max={maxPlacesAvailable}
					selectedDate={new Date(currentSlot.date_heure_debut).toLocaleDateString('fr-FR', {
						weekday: 'long',
						day: 'numeric',
						month: 'long'
					})}
					timeRange={formatTimeRange(currentSlot.date_heure_debut, currentVisite.duree_minutes)}
					visiteName={currentVisite.nom}
				/>
			</div>
		{/if}

		<div class="border-iron/5 mt-auto border-t-2 pt-6">
			{#if currentSlot && currentVisite}
				{#if maxPlacesAvailable > 0}
					<div
						class="bg-primary/5 border-primary/20 relative flex flex-col items-center justify-center space-y-2 overflow-hidden rounded-2xl border p-8 text-center"
						in:fade
					>
						<div
							class="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent mix-blend-overlay"
						></div>
						<p
							class="text-iron-muted dark:text-limestone-400 text-sm font-bold tracking-widest uppercase"
						>
							{l.price_est_total_label || 'Total estimé'}
						</p>
						<div class="relative z-10 flex flex-col items-center">
							<span
								class="text-primary text-6xl leading-none font-bold tracking-tighter italic tabular-nums"
							>
								{(
									Number(currentVisite.prix_unitaire || 0) * booking.tourSelection.quantite_billets
								).toFixed(0)}€
							</span>
						</div>
					</div>
				{:else}
					<div
						class="flex min-h-[128px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-red-200 bg-red-50 p-10 text-center text-base text-red-600 italic dark:bg-red-900/10"
					>
						<p>Désolé, ce créneau est désormais complet.</p>
					</div>
				{/if}
			{:else}
				<div
					class="bg-limestone-50 dark:bg-iron/5 border-iron/10 text-iron-muted/60 flex min-h-[128px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center text-base italic"
				>
					<p>
						{value
							? 'Veuillez choisir un créneau horaire'
							: 'Veuillez choisir une date sur le calendrier'}
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
