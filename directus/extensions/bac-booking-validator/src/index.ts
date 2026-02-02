import { defineHook } from '@directus/extensions-sdk';

export default defineHook(({ filter }, { services }) => {

	const throwError = (message: string, code: string = 'INVALID_PAYLOAD') => {
		const error: any = new Error(message);
		error.code = code;
		error.status = 400;
		throw error;
	};

	// --- 1. Validation CREATE (New Booking) ---
	filter('reservations_chambre.items.create', async (payload, meta, { database }) => {
		// If creating, we expect these fields. If missing (e.g. API error), we can optionally error or skip.
		// For robustness, if they are missing, we can't check conflicts, so we proceed carefully.
		if (!payload.chambre || !payload.date_arrivee || !payload.date_depart) {
			return; // Let Directus required-field validation handle missing data
		}

		// Conflict Check
		const conflict = await database('reservations_chambre')
			.where('chambre', payload.chambre)
			.andWhereNot('statut', 'annulee') // <--- Check conflict with ANY status except Cancelled
			.andWhere(function() {
				// Overlap Logic: (StartA < EndB) and (EndA > StartB)
				this.where('date_arrivee', '<', payload.date_depart)
					.andWhere('date_depart', '>', payload.date_arrivee);
			})
			.first();

		if (conflict) {
			throwError(`Cette chambre est indisponible pour ces dates (Statut: ${conflict.statut}).`);
		}
	});

	// --- 2. Validation UPDATE (Modifying existing booking) ---
	filter('reservations_chambre.items.update', async (payload, meta, { database }) => {
		// Optimization: If no dates/room/status change, skip logic to save DB calls
		if (!payload.date_arrivee && !payload.date_depart && !payload.chambre && !payload.statut) return;

		// If we are cancelling the booking, allow it immediately (no conflict possible)
		if (payload.statut === 'annulee') return;

		// 1. Get the current state of the booking from DB to fill in blanks
		// (e.g. if payload only has new dates, we need the existing room ID)
		const currentId = meta.keys[0];
		const currentItem = await database('reservations_chambre')
			.where('id', currentId)
			.first();

		if (!currentItem) return;

		// 2. Merge current data with new payload to get the "Final" intended state
		const finalRoom = payload.chambre || currentItem.chambre;
		const finalStart = payload.date_arrivee || currentItem.date_arrivee;
		const finalEnd = payload.date_depart || currentItem.date_depart;

		// 3. Check for conflicts
		const conflict = await database('reservations_chambre')
			.where('chambre', finalRoom)
			.andWhereNot('statut', 'annulee') // Conflict with anything not cancelled
			.andWhereNot('id', currentId) // <--- CRITICAL: Exclude itself from the check
			.andWhere(function() {
				this.where('date_arrivee', '<', finalEnd)
					.andWhere('date_depart', '>', finalStart);
			})
			.first();

		if (conflict) {
			throwError(`Modification impossible : Conflit avec la réservation #${conflict.id} (${conflict.statut}).`);
		}
	});

	// --- 3. Validation VISITES (Kept as is from your snippet) ---
	filter('reservations_visite.items.create', async (payload, meta, { schema, accountability, database }) => {
		if (!payload.creneau_visite || !payload.quantite_billets) {
			throwError('Créneau ou quantité manquante.');
		}

		// Example logic for Visits capacity check would go here
		// const sumResult = await database('reservations_visite')...
	});
});