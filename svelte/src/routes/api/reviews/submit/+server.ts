import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { useDirectus } from '$lib/directus/directus';
import { readItems, updateItem, createItem, withToken } from '@directus/sdk';
import { TURNSTILE_SECRET_KEY } from '$env/static/private';
import { PUBLIC_DIRECTUS_TOKEN } from '$env/static/public';

// Server-side verification and submission
export const POST: RequestHandler = async ({ request, fetch }) => {
	const { content, pseudonyme, uuid, captchaToken } = await request.json();

	if (!uuid || !content || !pseudonyme) {
		return json({ success: false, message: "Données manquantes." }, { status: 400 });
	}

	if (!captchaToken) {
		return json({ success: false, message: "Vérification anti-robot manquante." }, { status: 400 });
	}

	// 1. Turnstile Verification
	try {
		const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: captchaToken })
		});
		const outcome = await verifyRes.json();
		if (!outcome.success) {
			return json({ success: false, message: "La validation de sécurité a échoué." }, { status: 403 });
		}
	} catch (err) {
		return json({ success: false, message: "Service de vérification indisponible." }, { status: 503 });
	}

	const { getDirectus } = useDirectus();
	const directus = getDirectus(fetch);
	// Reverting to PUBLIC_DIRECTUS_TOKEN which was working before
	const ADMIN_TOKEN = PUBLIC_DIRECTUS_TOKEN;

	try {
		// 2. Find the reservation (Chambre or Visite)
		let reservation: { type: 'chambre' | 'visite', id: number, client_id: number | null } | null = null;

		const resChambre = await directus.request(
			withToken(ADMIN_TOKEN, readItems('reservations_chambre', {
				filter: { avis_uuid: { _eq: uuid }, avis: { _neq: true } },
				fields: ['id', { client: ['id'] }]
			}))
		);

		if (resChambre.length > 0) {
			reservation = { 
				type: 'chambre', 
				id: resChambre[0].id, 
				client_id: (resChambre[0].client as any)?.id || null 
			};
		} else {
			const resVisite = await directus.request(
				withToken(ADMIN_TOKEN, readItems('reservations_visite', {
					filter: { avis_uuid: { _eq: uuid }, avis: { _neq: true } },
					fields: ['id', { client: ['id'] }]
				}))
			);
			if (resVisite.length > 0) {
				reservation = { 
					type: 'visite', 
					id: resVisite[0].id, 
					client_id: (resVisite[0].client as any)?.id || null 
				};
			}
		}

		if (!reservation) {
			return json({ success: false, message: "Lien d'avis invalide ou déjà utilisé." }, { status: 403 });
		}

		// 3. Create the comment
		await directus.request(
			withToken(ADMIN_TOKEN, createItem('commentaires', {
				status: 'en_attente',
				contenu: content,
				pseudonyme: pseudonyme,
				client: reservation.client_id
			}))
		);

		// 4. Update the reservation to mark it as reviewed
		const collection = reservation.type === 'chambre' ? 'reservations_chambre' : 'reservations_visite';
		await directus.request(
			withToken(ADMIN_TOKEN, updateItem(collection, reservation.id, {
				avis: true
			}))
		);

		return json({ success: true });
	} catch (err: any) {
		console.error('Error in review submission API:', err);
		if (err.response) {
			try {
				const errorData = await err.response.json();
				console.error('Directus error details:', JSON.stringify(errorData, null, 2));
			} catch (e) {
				console.error('Could not parse Directus error response');
			}
		}
		return json({ success: false, message: "Erreur serveur." }, { status: 500 });
	}
};

// GET to verify UUID status (optional but helpful for UI)
export const GET: RequestHandler = async ({ url, fetch }) => {
	const uuid = url.searchParams.get('uuid');
	if (!uuid) return json({ valid: false });

	const { getDirectus } = useDirectus();
	const directus = getDirectus(fetch);
	const ADMIN_TOKEN = PUBLIC_DIRECTUS_TOKEN;

	try {
		const [resChambre, resVisite] = await Promise.all([
			directus.request(withToken(ADMIN_TOKEN, readItems('reservations_chambre', {
				filter: { avis_uuid: { _eq: uuid } },
				fields: ['id', 'avis', { client: ['prenom'] }]
			}))),
			directus.request(withToken(ADMIN_TOKEN, readItems('reservations_visite', {
				filter: { avis_uuid: { _eq: uuid } },
				fields: ['id', 'avis', { client: ['prenom'] }]
			})))
		]);

		const reservation = resChambre[0] || resVisite[0];

		if (!reservation) return json({ valid: false });

		return json({ 
			valid: true, 
			alreadySubmitted: !!reservation.avis,
			clientName: (reservation.client as any)?.prenom || 'Cher client'
		});
	} catch (err) {
		return json({ valid: false }, { status: 500 });
	}
};

