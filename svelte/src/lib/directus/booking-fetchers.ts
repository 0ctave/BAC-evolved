import { PUBLIC_DIRECTUS_TOKEN } from '$env/static/public';
import { useDirectus } from './directus';
import type { Chambre, Visite, CreneauxVisite, TarifsSpeciaux } from '../types/directus-schema';

/**
 * Récupère les chambres disponibles (statut 'disponible')
 */
export const fetchRooms = async (fetch: any) => {
	const { getDirectus, readItems, withToken } = useDirectus();
	const directus = getDirectus(fetch);

	try {
		const rooms = await directus.request(
			withToken(
				PUBLIC_DIRECTUS_TOKEN,
				readItems('chambres', {
					filter: { statut: { _eq: 'disponible' } },
					fields: [
						'id',
						'nom',
						'description',
						'statut',
						'prix_nuit',
						'capacite_adultes',
						'capacite_enfants',
						'capacite_max',
						'image', // <--- UPDATED: Fetch all fields within the image object
					]
				})
			)
		);
		return rooms as Chambre[];
	} catch (error) {
		console.error('Error fetching rooms:', error);
		throw new Error('Impossible de charger les chambres (Vérifiez les permissions Directus)');
	}
};

/**
 * Récupère les réservations futures pour une chambre donnée
 * Afin de griser les dates indisponibles dans le calendrier
 */
export const fetchRoomReservations = async (roomId: number | string, fetch: any) => {
	const { getDirectus, readItems, withToken } = useDirectus();
	const directus = getDirectus(fetch);
	const todayStr = new Date().toISOString().split('T')[0];

	try {
		// @ts-ignore : La collection reservations_chambre n'est pas dans votre schema TS partiel
		const reservations = await directus.request(
			withToken(
				PUBLIC_DIRECTUS_TOKEN,
				readItems('reservations_chambre', {
					filter: {
						_and: [
							{ chambre: { _eq: roomId } },
							{ statut: { _in: ['confirmee', 'en_attente'] } }, // On bloque aussi les "en attente" par sécurité
							{ date_depart: { _gte: todayStr } } // Inutile de charger les vieilles réservations
						]
					},
					fields: ['date_arrivee', 'date_depart']
				})
			)
		);
		return reservations as { date_arrivee: string; date_depart: string }[];
	} catch (error) {
		console.error('Error fetching room reservations:', error);
		return [];
	}
};

/**
 * Récupère les types de visites
 */
export const fetchVisites = async (fetch: any) => {
	const { getDirectus, readItems, withToken } = useDirectus();
	const directus = getDirectus(fetch);

	try {
		const visites = await directus.request(
			withToken(
				PUBLIC_DIRECTUS_TOKEN,
				readItems('visites', {
					fields: ['id', 'nom', 'description', 'duree_minutes', 'prix_unitaire']
				})
			)
		);
		return visites as Visite[];
	} catch (error) {
		console.error('Error fetching visites:', error);
		return [];
	}
};

/**
 * Récupère les créneaux disponibles pour une visite et une date données
 */
export const fetchSlots = async (visiteId: number | string, dateStr: string, fetch: any) => {
	const { getDirectus, readItems, withToken } = useDirectus();
	const directus = getDirectus(fetch);

	try {
		const slots = await directus.request(
			withToken(
				PUBLIC_DIRECTUS_TOKEN,
				readItems('creneaux_visites', {
					filter: {
						_and: [
							{ visite_id: { _eq: visiteId } },
							{ date_heure_debut: { _between: [`${dateStr}T00:00:00`, `${dateStr}T23:59:59`] } }
						]
					},
					fields: ['id', 'date_heure_debut', 'capacite_max', 'place_reservee']
				})
			)
		);
		return slots as CreneauxVisite[];
	} catch (error) {
		console.error('Error fetching slots:', error);
		return [];
	}
};

/**
 * Récupère les détails d'une chambre pour le récapitulatif
 */
export const fetchRoomDetails = async (roomId: number | string, fetch: any) => {
	const { getDirectus, readItem, withToken } = useDirectus();
	const directus = getDirectus(fetch);

	const safeId = String(roomId);

	const room = await directus.request(
		withToken(
			PUBLIC_DIRECTUS_TOKEN,
			readItem('chambres', safeId, {
				fields: ['nom', 'prix_nuit', 'description', 'images']
			})
		)
	);
	return room as Chambre;
};

/**
 * Récupère les détails d'un créneau pour le récapitulatif
 */
export const fetchSlotDetails = async (slotId: number | string, fetch: any) => {
	const { getDirectus, readItem, withToken } = useDirectus();
	const directus = getDirectus(fetch);

	const safeId = String(slotId);

	const slot = await directus.request(
		withToken(
			PUBLIC_DIRECTUS_TOKEN,
			readItem('creneaux_visites', safeId, {
				fields: [
					'date_heure_debut',
					// @ts-ignore
					'visite_id.nom',
					'visite_id.prix_unitaire'
				]
			})
		)
	);

	return slot as unknown as CreneauxVisite & { visite_id: Visite };
};

/**
 * Récupère les règles de tarification actives
 */
export const fetchPricingRules = async (fetch: any) => {
	const { getDirectus, readItems, withToken } = useDirectus();
	const directus = getDirectus(fetch);

	try {
		const rules = await directus.request(
			withToken(
				PUBLIC_DIRECTUS_TOKEN,
				readItems('tarifs_speciaux', {
					filter: { statut: { _eq: 'actif' } },
					fields: [
						'*',
						// @ts-ignore - Fetching the junction table data for related rooms
						'chambres_concernees.*'
					]
				})
			)
		);
		return rules as TarifsSpeciaux[];
	} catch (error) {
		console.error('Error fetching pricing rules:', error);
		return [];
	}
};