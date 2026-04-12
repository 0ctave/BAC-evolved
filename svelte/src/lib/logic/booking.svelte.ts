import { CalendarDate, parseDate } from '@internationalized/date';

export type BookingType = 'CHAMBRE' | 'VISITE' | null;

class BookingMachine {
	// Constantes de validation
	readonly EMAIL_REGEX =
		/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

	// États réactifs
	step = $state(0);
	type = $state<BookingType>(null);

	// Store translations here so all components can access them
	labels = $state<Record<string, string>>({});

	// Signal to UI components to force show validation errors
	validationTrigger = $state(0);
	// Signal to UI components to clear/hide validation errors
	resetTrigger = $state(0);

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
		langue: 'fr-FR',
		// État interne de validation du téléphone
		isPhoneValid: false
	});

	// Method to inject labels from the CMS block data
	setLabels(newLabels: Record<string, string>) {
		this.labels = newLabels || {};
	}

	initFromUrl(url: URL) {
		const params = url.searchParams;

		// 1. Type
		const t = params.get('type') as BookingType;
		if (t === 'CHAMBRE' || t === 'VISITE') {
			this.type = t;
			this.step = 1; // Auto-advance past the initial selection step
		}

		// 2. Room pre-selection
		const roomId = params.get('room');
		if (roomId) this.roomSelection.chambre = roomId;

		const checkin = params.get('checkin');
		if (checkin) {
			try {
				this.roomSelection.date_arrivee = parseDate(checkin);
			} catch {
				console.warn('Invalid checkin URL format (use YYYY-MM-DD)');
			}
		}

		const checkout = params.get('checkout');
		if (checkout) {
			try {
				this.roomSelection.date_depart = parseDate(checkout);
			} catch {
				console.warn('Invalid checkout URL format (use YYYY-MM-DD)');
			}
		}

		const adults = params.get('adults');
		if (adults) this.roomSelection.adults = parseInt(adults, 10) || 1;

		const children = params.get('children');
		if (children) this.roomSelection.children = parseInt(children, 10) || 0;

		// 3. Tour pre-selection
		const tourId = params.get('tour');
		if (tourId) this.tourSelection.creneau_visite = tourId;

		const tickets = params.get('tickets');
		if (tickets) this.tourSelection.quantite_billets = parseInt(tickets, 10) || 1;

		// 4. Override step if explicitly provided (e.g., skip to summary if you passed EVERYTHING)
		const stepParam = params.get('step');
		if (stepParam) {
			const parsedStep = parseInt(stepParam, 10);
			if (!isNaN(parsedStep) && parsedStep >= 0 && parsedStep <= 3) {
				this.step = parsedStep;
			}
		}
	}

	// Validation Granulaire (utilisée pour afficher les erreurs dans l'UI)
	errors = $derived.by(() => {
		return {
			room: {
				dates:
					!this.roomSelection.date_arrivee || !this.roomSelection.date_depart
						? this.labels.error_room_dates_missing
						: null,
				chambre: !this.roomSelection.chambre ? this.labels.error_room_missing : null
			},
			customer: {
				prenom: this.customer.prenom.trim().length < 2 ? this.labels.error_firstname_short : null,
				nom: this.customer.nom.trim().length < 2 ? this.labels.error_lastname_short : null,
				email: !this.EMAIL_REGEX.test(this.customer.email.toLowerCase())
					? this.labels.error_email_invalid
					: null,
				telephone: !this.customer.isPhoneValid ? this.labels.error_phone_invalid : null,
				langue: !this.customer.langue ? this.labels.error_lang_required : null
			}
		};
	});

	// Validation Globale (pour la navigation)
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
					this.customer.prenom.trim().length >= 2 &&
					this.customer.nom.trim().length >= 2 &&
					this.EMAIL_REGEX.test(this.customer.email.toLowerCase()) &&
					this.customer.isPhoneValid &&
					!!this.customer.langue
				);
			default:
				return false;
		}
	});

	nextStep() {
		if (this.canGoNext) {
			this.step += 1;
			this.validationTrigger = 0;
			this.resetTrigger = 0;
		}
	}

	prevStep() {
		if (this.step > 0) {
			this.step -= 1;
			this.validationTrigger = 0;
			this.resetTrigger = 0;
		}
	}

	triggerValidation() {
		this.validationTrigger += 1;
	}

	clearValidation() {
		this.resetTrigger += 1;
	}

	reset() {
		this.step = 0;
		this.type = null;
		this.validationTrigger = 0;
		this.resetTrigger = 0;
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
		this.customer = {
			prenom: '',
			nom: '',
			email: '',
			telephone: '',
			langue: 'fr-FR',
			isPhoneValid: false
		};
	}
}

export const booking = new BookingMachine();
