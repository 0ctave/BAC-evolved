import { defineHook } from '@directus/extensions-sdk';

export default defineHook(({ filter }, { services }) => {
	const { ItemsService } = services;

	// Fonction utilitaire pour lever une erreur formatée Directus
	const throwError = (message: string, code: string = 'INVALID_PAYLOAD') => {
		const error: any = new Error(message);
		error.code = code;
		error.status = 400;
		throw error;
	};

	// Validation CHAMBRES
	filter('reservations_chambre.items.create', async (payload, meta, { database }) => {
		if (!payload.chambre || !payload.date_arrivee || !payload.date_depart) {
			throwError('Données de chambre ou dates manquantes.');
		}

		const conflict = await database('reservations_chambre')
			.where('chambre', payload.chambre)
			.andWhere('statut', 'confirmee')
			.andWhere(function() {
				this.where('date_arrivee', '<', payload.date_depart)
					.andWhere('date_depart', '>', payload.date_arrivee);
			})
			.first();

		if (conflict) throwError('Cette chambre est déjà réservée aux dates choisies.');
	});

	// Validation VISITES
	filter('reservations_visite.items.create', async (payload, meta, { schema, accountability, database }) => {
		if (!payload.creneau_visite || !payload.quantite_billets) {
			throwError('Créneau ou quantité manquante.');
		}

		const creneauService = new ItemsService('creneaux_visite', { schema, accountability });
		const creneau = await creneauService.readOne(payload.creneau_visite);

		const sumResult = await database('reservations_visite')
			.where('creneau_visite', payload.creneau_visite)
			.andWhere('statut', 'confirmee')
			.sum('quantite_billets as total');

		const dejaReserve = parseInt(sumResult[0].total || '0');
		if (dejaReserve + payload.quantite_billets > creneau.capacite_max) {
			throwError(`Places insuffisantes. Disponibles : ${creneau.capacite_max - dejaReserve}`);
		}
	});
});