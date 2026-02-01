import { defineHook } from '@directus/extensions-sdk';

export default defineHook(({ filter }, { services }) => {
	const { ItemsService } = services;

	// Helper to throw Directus-formatted errors
	const throwError = (message: string, code: string = 'INVALID_PAYLOAD') => {
		const error: any = new Error(message);
		error.code = code;
		error.status = 400;
		throw error;
	};

	// --- 1. Validation CHAMBRES (Create) ---
	filter('reservations_chambre.items.create', async (payload, meta, { database }) => {
		// Ensure required fields exist
		if (!payload.chambre || !payload.date_arrivee || !payload.date_depart) {
			// Note: If fields are optional in DB but required for logic, this catches it.
			// If they are missing because relying on defaults, this might trigger.
			// Ideally, only check if they are missing AND strict validation is needed.
			// For 'create', they should be there.
			throwError('Données de chambre ou dates manquantes.');
		}

		// Conflict Check Logic
		const conflict = await database('reservations_chambre')
			.where('chambre', payload.chambre)
			.andWhereNot('statut', 'annulee') // <--- CHANGED: Checks strictly against 'annulee'
			.andWhere(function() {
				// Overlap Logic: (StartA < EndB) and (EndA > StartB)
				this.where('date_arrivee', '<', payload.date_depart)
					.andWhere('date_depart', '>', payload.date_arrivee);
			})
			.first();

		if (conflict) {
			throwError(`Cette chambre est déjà occupée (Statut: ${conflict.statut}) pour ces dates.`);
		}
	});

	// --- 2. Validation CHAMBRES (Update - Robustness Addition) ---
	// Ensures moving a booking doesn't cause a conflict
	filter('reservations_chambre.items.update', async (payload, meta, { database, schema }) => {
		// Only check if dates or room are changing
		if (!payload.date_arrivee && !payload.date_depart && !payload.chambre && !payload.statut) return;

		// We need the full current state of the item to compare
		// Since we can't easily use ItemsService inside a filter without triggering infinite loops
		// if not careful, we use direct DB access or specific service usage.
		const currentItem = await database('reservations_chambre')
			.where('id', meta.keys[0])
			.first();

		if (!currentItem) return;

		// Merge current data with payload updates
		const checkRoom = payload.chambre || currentItem.chambre;
		const checkStart = payload.date_arrivee || currentItem.date_arrivee;
		const checkEnd = payload.date_depart || currentItem.date_depart;
		const checkStatus = payload.statut || currentItem.statut;

		// Skip check if the booking itself is cancelled
		if (checkStatus === 'annulee') return;

		const conflict = await database('reservations_chambre')
			.where('chambre', checkRoom)
			.andWhereNot('statut', 'annulee')
			.andWhereNot('id', meta.keys[0]) // Exclude itself!
			.andWhere(function() {
				this.where('date_arrivee', '<', checkEnd)
					.andWhere('date_depart', '>', checkStart);
			})
			.first();

		if (conflict) {
			throwError(`Modification impossible: Conflit avec une autre réservation (${conflict.statut}).`);
		}
	});

	// --- 3. Validation VISITES (Original) ---
	filter('reservations_visite.items.create', async (payload, meta, { schema, accountability, database }) => {
		if (!payload.creneau_visite || !payload.quantite_billets) {
			throwError('Créneau ou quantité manquante.');
		}

		const creneauService = new ItemsService('creneaux_visite', { schema, accountability });
		const creneau = await creneauService.readOne(payload.creneau_visite);

		const sumResult = await database('reservations_visite')
			.where('creneau_visite', payload.creneau_visite)
			.andWhere('statut', 'en_attente')
			.sum('quantite_billets as total');

		// (Logic continues as per your original file...)
	});
});