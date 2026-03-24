import { booking } from './booking.svelte';

export async function submitBooking(captchaToken: string) {
	try {
		const formattedRoomSelection =
			booking.type === 'CHAMBRE'
				? {
						...booking.roomSelection,
						date_arrivee: booking.roomSelection.date_arrivee
							? booking.roomSelection.date_arrivee.toString()
							: null,
						date_depart: booking.roomSelection.date_depart
							? booking.roomSelection.date_depart.toString()
							: null
					}
				: undefined;

		const payload = {
			captchaToken,
			type: booking.type,
			customer: booking.customer,
			roomSelection: formattedRoomSelection, // On utilise la version formatée
			tourSelection: booking.type === 'VISITE' ? booking.tourSelection : undefined
		};

		const res = await fetch('/api/reserver', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		const result = await res.json();

		if (!res.ok) {
			throw new Error(result.errors?.[0]?.message || 'Erreur lors de la réservation');
		}

		return { success: true, data: result.data };
	} catch (e: any) {
		console.error('Erreur de soumission:', e);
		throw e;
	}
}
