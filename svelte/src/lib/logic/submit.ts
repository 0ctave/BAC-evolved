import { booking } from './booking.svelte';
import { PUBLIC_DIRECTUS_URL, PUBLIC_DIRECTUS_FORM_TOKEN } from '$env/static/public';

function formatDate(date: any) {
	if (!date) return null;
	return date.toString();
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
	const url = `${PUBLIC_DIRECTUS_URL}${endpoint}`;

	const headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${PUBLIC_DIRECTUS_FORM_TOKEN}`,
		...options.headers
	};

	const res = await fetch(url, { ...options, headers });
	return res;
}

export async function submitBooking() {
	try {
		// 1. Gérer le Client
		const clientSearchResponse = await fetchWithAuth(
			`/items/clients?filter[email][_eq]=${booking.customer.email}`
		);
		const clientData = await clientSearchResponse.json();

		let clientId;

		if (clientData.data && clientData.data.length > 0) {
			clientId = clientData.data[0].id;
		} else {
			const newClientResponse = await fetchWithAuth(`/items/clients`, {
				method: 'POST',
				body: JSON.stringify({
					prenom: booking.customer.prenom,
					nom: booking.customer.nom,
					email: booking.customer.email,
					telephone: booking.customer.telephone,
					langue: booking.customer.langue
				})
			});
			const createdClient = await newClientResponse.json();
			if (createdClient.errors) throw new Error(createdClient.errors[0].message);
			clientId = createdClient.data.id;
		}

		// 2. Préparation de la réservation
		const isChambre = booking.type === 'CHAMBRE';
		const collection = isChambre ? 'reservations_chambre' : 'reservations_visite';

		const payload = isChambre
			? {
					chambre: booking.roomSelection.chambre,
					client: clientId,
					date_arrivee: formatDate(booking.roomSelection.date_arrivee),
					date_depart: formatDate(booking.roomSelection.date_depart),
					statut: 'en_attente',
					parking: booking.roomSelection.parking // <-- Ajout ici
				}
			: {
					creneau_visite: booking.tourSelection.creneau_visite,
					client: clientId,
					quantite_billets: booking.tourSelection.quantite_billets,
					statut: 'en_attente'
				};

		const res = await fetchWithAuth(`/items/${collection}`, {
			method: 'POST',
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
