import { PUBLIC_DIRECTUS_TOKEN } from '$env/static/public';
import { useDirectus } from './directus';
import type { Chambre, Visite, TarifsSpeciaux } from '../types/directus-schema';

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
						// @ts-ignore
						'image.*' // Fetch full image metadata
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
		const reservations = await directus.request(
			withToken(
				PUBLIC_DIRECTUS_TOKEN,
				readItems('reservations_chambre', {
					filter: {
						_and: [
							{ chambre: { _eq: roomId } },
							{ statut: { _in: ['confirmee', 'en_attente', 'indisponible'] } },
							// @ts-ignore
							{ date_depart: { _gte: todayStr } }
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
 * Récupère tous les créneaux de visite à venir pour le calendrier global
 */
export const fetchAllUpcomingSlots = async (fetch: any) => {
	const { getDirectus, readItems, withToken } = useDirectus();
	const directus = getDirectus(fetch);
	const todayStr = new Date().toISOString().split('T')[0];

	try {
		const slots = await directus.request(
			withToken(
				PUBLIC_DIRECTUS_TOKEN,
				readItems('creneaux_visites', {
					filter: {
						// @ts-ignore
						date_heure_debut: { _gte: `${todayStr}T00:00:00` }
					},
					fields: [
						'id',
						'date_heure_debut',
						'capacite_max',
						// @ts-ignore
						'visite_id.id',
						// @ts-ignore
						'visite_id.nom',
						// @ts-ignore
						'visite_id.prix_unitaire',
						// @ts-ignore
						'visite_id.duree_minutes'
					],
					limit: -1
				})
			)
		);

		// Manual fetch of reservations to avoid nested field permission or alias issues
		const slotIds = slots.map((s: any) => s.id);
		let reservations: any[] = [];

		if (slotIds.length > 0) {
			reservations = await directus.request(
				withToken(
					PUBLIC_DIRECTUS_TOKEN,
					readItems('reservations_visite', {
						filter: {
							creneau_visite: { _in: slotIds },
							statut: { _in: ['confirmee', 'en_attente'] }
						},
						fields: ['creneau_visite', 'quantite_billets', 'statut'],
						limit: -1
					})
				)
			);
		}

		// Merge reservations into slots
		return slots.map((slot: any) => {
			const slotReservations = reservations.filter((r: any) => {
				const rSlotId =
					typeof r.creneau_visite === 'object' ? r.creneau_visite?.id : r.creneau_visite;
				return String(rSlotId) === String(slot.id);
			});
			return {
				...slot,
				reservations_visite: slotReservations
			};
		});
	} catch (error) {
		console.error('Error fetching all slots:', error);
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
 * Récupère les détails d'un créneau pour le récapitulatif
 */
export const fetchSlotDetails = async (slotId: number | string, fetch: any) => {
	const { getDirectus, readItem, readItems, withToken } = useDirectus();
	const directus = getDirectus(fetch);

	const slot = await directus.request(
		withToken(
			PUBLIC_DIRECTUS_TOKEN,
			readItem('creneaux_visites', String(slotId), {
				fields: [
					'date_heure_debut',
					'capacite_max',
					// @ts-ignore
					'visite_id.nom',
					// @ts-ignore
					'visite_id.prix_unitaire',
					// @ts-ignore
					'visite_id.duree_minutes'
				]
			})
		)
	);

	const reservations = await directus.request(
		withToken(
			PUBLIC_DIRECTUS_TOKEN,
			readItems('reservations_visite', {
				filter: {
					creneau_visite: { _eq: slotId },
					statut: { _in: ['confirmee', 'en_attente'] }
				},
				fields: ['quantite_billets', 'statut']
			})
		)
	);

	return {
		...slot,
		reservations_visite: reservations
	} as any;
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
				fields: [
					'nom',
					'prix_nuit',
					'description',
					// @ts-ignore
					'images.*'
				]
			})
		)
	);
	return room as Chambre;
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
						// @ts-ignore
						'chambres_concernees.*',
						// @ts-ignore
						'visites_concernees.*'
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
