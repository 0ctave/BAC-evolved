import { json } from '@sveltejs/kit';
import { TURNSTILE_SECRET_KEY, DIRECTUS_FORM_TOKEN } from '$env/static/private';
import { createDirectus, rest, readItems, createItem, withToken } from '@directus/sdk';
import { PUBLIC_DIRECTUS_URL } from '$env/static/public';

const directus = createDirectus(PUBLIC_DIRECTUS_URL).with(rest());

export async function POST({ request, fetch }) {
	try {
		const body = await request.json();
		const { captchaToken, type, customer, roomSelection, tourSelection } = body;

		if (!captchaToken) {
			return json({ error: 'Vérification anti-robot manquante.' }, { status: 400 });
		}

		// 1. Vérification du Captcha Turnstile côté serveur
		let verifyRes;
		try {
			verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					secret: TURNSTILE_SECRET_KEY,
					response: captchaToken
				})
			});
		} catch (networkError) {
			console.error("Erreur de connexion à l'API Cloudflare:", networkError);
			return json(
				{
					error: 'Le service de vérification est temporairement indisponible. Veuillez réessayer.'
				},
				{ status: 503 }
			);
		}

		const outcome = await verifyRes.json();
		if (!outcome.success) {
			console.warn('Échec Turnstile:', outcome['error-codes']);
			// On renvoie un 403. Notre frontend va l'intercepter et déclencher le turnstileInstance.reset()
			return json(
				{ error: 'La validation de sécurité a expiré ou échoué. Veuillez confirmer à nouveau.' },
				{ status: 403 }
			);
		}

		// 2. Gestion du Client dans Directus
		const clients = await directus.request(
			withToken(
				DIRECTUS_FORM_TOKEN,
				readItems('clients', {
					filter: { email: { _eq: customer.email } }
				})
			)
		);

		let clientId;
		if (clients && clients.length > 0) {
			clientId = clients[0].id;
		} else {
			const newClient = await directus.request(
				withToken(
					DIRECTUS_FORM_TOKEN,
					createItem('clients', {
						prenom: customer.prenom,
						nom: customer.nom,
						email: customer.email,
						telephone: customer.telephone,
						langue: customer.langue
					})
				)
			);
			clientId = newClient.id;
		}

		// 3. Création de la réservation
		const isChambre = type === 'CHAMBRE';
		const collection = isChambre ? 'reservations_chambre' : 'reservations_visite';

		const payload = isChambre
			? {
					chambre: roomSelection.chambre,
					client: clientId,
					date_arrivee: roomSelection.date_arrivee,
					date_depart: roomSelection.date_depart,
					statut: 'en_attente',
					parking: roomSelection.parking,
					adulte: roomSelection.adults,
					enfant: roomSelection.children
				}
			: {
					creneau_visite: tourSelection.creneau_visite,
					client: clientId,
					quantite_billets: tourSelection.quantite_billets,
					statut: 'en_attente'
				};

		const reservation = await directus.request(
			withToken(DIRECTUS_FORM_TOKEN, createItem(collection, payload))
		);

		return json({ success: true, data: reservation });
	} catch (err: any) {
		console.error('Erreur API Réservation:', err);
		return json({ error: err.message || 'Erreur interne lors de la réservation' }, { status: 500 });
	}
}
