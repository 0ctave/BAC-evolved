<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';
	import { booking } from '$lib/logic/booking.svelte';
	import type { CreneauxVisite, Visite, ReservationsVisite } from '$lib/types/directus-schema';

	interface Props {
		slots: CreneauxVisite[];
		visites: Visite[];
		loading: boolean;
		selectedSlotId: string | number | null;
		onSelect: (id: string | number) => void;
		hasDate: boolean;
	}

	let { slots, visites, loading, selectedSlotId, onSelect, hasDate }: Props = $props();
	const l = $derived(booking.labels);

	function getVisite(slot: CreneauxVisite) {
		const sId = typeof slot.visite_id === 'object' ? slot.visite_id?.id : slot.visite_id;
		return visites.find((v) => String(v.id) === String(sId));
	}

	function formatTimeRange(isoString: string, duration: number) {
		if (!isoString) return '';
		const start = new Date(isoString);
		const end = new Date(start.getTime() + (duration || 0) * 60000);
		const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
		return `${start.toLocaleTimeString('fr-FR', options)} — ${end.toLocaleTimeString('fr-FR', options)}`;
	}

	function formatDateShort(isoString: string) {
		if (!isoString) return '';
		return new Date(isoString).toLocaleDateString('fr-FR', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		});
	}

	/**
	 * Capacity Calculation
	 */
	function getRemaining(slot: any) {
		const total = Number(slot.capacite_max) || 0;
		let reserved = 0;

		const reservations = slot.reservations_visite;

		if (Array.isArray(reservations)) {
			reserved = reservations.reduce((acc: number, r: ReservationsVisite) => {
				if (r && (r.statut === 'confirmee' || r.statut === 'en_attente')) {
					return acc + (Number(r.quantite_billets) || 0);
				}
				return acc;
			}, 0);
		}

		return Math.max(0, total - reserved);
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h4
			class="text-iron/60 dark:text-limestone-400 text-xs font-bold tracking-widest uppercase italic"
		>
			{#if hasDate}
				{l.tour_slots_title || 'Créneaux disponibles'}
			{:else}
				Sessions à venir
			{/if}
		</h4>
	</div>

	<div class="custom-scrollbar relative max-h-[400px] min-h-[160px] overflow-y-auto pr-2">
		{#if loading}
			<div class="space-y-3" in:fade>
				{#each Array(3) as _unused, i (i)}
					<div
						class="bg-limestone-100 dark:bg-iron-light/20 h-20 w-full animate-pulse rounded-2xl border border-black/5"
					></div>
				{/each}
			</div>
		{:else if slots.length === 0}
			<div
				class="bg-limestone-50 dark:bg-iron-light/10 border-iron/10 rounded-2xl border-2 border-dashed p-10 text-center italic"
				in:fly={{ y: 10 }}
			>
				<p class="text-iron-muted text-sm">Aucun créneau disponible pour cette sélection.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-3">
				{#each slots as slot, i (slot.id)}
					{@const v = getVisite(slot)}
					{@const remaining = getRemaining(slot)}
					{@const isSelected = String(selectedSlotId) === String(slot.id)}

					<button
						onclick={() => onSelect(slot.id)}
						disabled={remaining <= 0}
						in:fly={{ y: 20, duration: 400, delay: i * 50 }}
						class="group relative flex items-center justify-between overflow-hidden rounded-2xl border-2 p-5 transition-all duration-300
                        {isSelected
							? 'border-primary bg-primary translate-y-[-2px] text-white shadow-sm'
							: 'border-iron/10 text-iron hover:border-primary/50 bg-white dark:bg-[#252426]'}
                        {remaining <= 0 ? 'cursor-not-allowed opacity-50 grayscale' : ''}"
					>
						<div class="relative z-10 flex min-w-0 flex-1 items-center gap-6 text-left">
							<div class="w-32 flex-shrink-0">
								<span class="text-xl leading-none font-bold tracking-tight tabular-nums">
									{formatTimeRange(slot.date_heure_debut, v?.duree_minutes || 0)}
								</span>
							</div>

							<div class="flex min-w-0 flex-col items-start">
								<span
									class="text-[10px] font-bold tracking-widest uppercase {isSelected
										? 'text-white/80'
										: 'text-primary'} mb-0.5 italic"
								>
									{formatDateShort(slot.date_heure_debut)}
								</span>
								<h5
									class="w-full truncate text-base leading-tight font-bold tracking-tight uppercase"
								>
									{v?.nom || 'Visite'}
								</h5>
							</div>
						</div>

						<div class="relative z-10 ml-4 flex flex-col items-end text-right">
							<span
								class="mb-1 block text-[10px] leading-none font-bold tracking-widest uppercase opacity-70"
							>
								{remaining <= 0 ? 'Complet' : 'Places'}
							</span>
							<div class="flex items-center gap-2">
								<span class="text-lg font-bold tabular-nums">{remaining}</span>
								{#if remaining > 0 && remaining < 5}
									<div
										class="h-2 w-2 animate-pulse rounded-full border border-white bg-amber-400 shadow-sm"
									></div>
								{/if}
							</div>
						</div>

						{#if isSelected}
							<div class="absolute -top-2 -right-2 text-white opacity-10" in:scale>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-20 w-20"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: rgba(0, 0, 0, 0.1);
		border-radius: 10px;
	}
</style>
