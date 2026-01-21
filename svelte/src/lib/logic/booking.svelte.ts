import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';

export type BookingType = 'CHAMBRE' | 'VISITE' | null;

class BookingMachine {
	// États réactifs
	step = $state(0);
	type = $state<BookingType>(null);

	// Correspondance Collection 'reservations_chambre'
	roomSelection = $state({
		chambre: null as string | null, // UUID
		date_arrivee: null as CalendarDate | null,
		date_depart: null as CalendarDate | null,
		type_chambre_id: null as string | null, // Pour le filtrage UI
		adults: 1,
		children: 0,
		parking: false
	});

	// Correspondance Collection 'reservations_visite'
	tourSelection = $state({
		creneau_visite: null as string | null, // UUID
		quantite_billets: 1,
		selectedDate: null as CalendarDate | null
	});

	// Correspondance Collection 'clients'
	customer = $state({
		prenom: '',
		nom: '',
		email: '',
		telephone: '',
		langue: 'fr-FR'
	});

	// Validation
	canGoNext = $derived.by(() => {
		switch (this.step) {
			case 0:
				return this.type !== null;
			case 1:
				if (this.type === 'CHAMBRE') {
					return !!(
						this.roomSelection.date_arrivee &&
						this.roomSelection.date_depart &&
						this.roomSelection.chambre
					);
				}
				return !!(this.tourSelection.creneau_visite && this.tourSelection.quantite_billets > 0);
			case 2:
				return (
					this.customer.prenom.length > 1 &&
					this.customer.nom.length > 1 &&
					this.customer.email.includes('@')
				);
			default:
				return false;
		}
	});

	// Actions
	nextStep() {
		if (this.canGoNext) this.step += 1;
	}
	prevStep() {
		if (this.step > 0) this.step -= 1;
	}

	reset() {
		this.step = 0;
		this.type = null;
		this.roomSelection = {
			chambre: null,
			date_arrivee: null,
			date_depart: null,
			type_chambre_id: null,
			adults: 1,
			children: 0,
			parking: false
		};
		this.tourSelection = { creneau_visite: null, quantite_billets: 1, selectedDate: null };
		this.customer = { prenom: '', nom: '', email: '', telephone: '', langue: 'fr-FR' };
	}
}

export const booking = new BookingMachine();
