import { PUBLIC_DIRECTUS_TOKEN } from '$env/static/public';
import { useDirectus } from './directus';
import { aggregate, readItems, withToken } from '@directus/sdk';

/**
 * Récupère les commentaires parents publiés de manière paginée,
 * ainsi que les réponses associées et le nombre total de commentaires.
 */
export const fetchPaginatedReviews = async (page: number, limit: number, fetch: any) => {
	const { getDirectus } = useDirectus();
	const directus = getDirectus(fetch);

	const filter = {
		status: { _eq: 'published' as const },
		parent: { _null: true }
	};

	try {
		let totalCount = 0;

		// 1. On ne compte le total que lors du chargement initial
		if (page === 1) {
			const aggr = await directus.request(
				withToken(
					PUBLIC_DIRECTUS_TOKEN,
					aggregate('commentaires', {
						aggregate: { count: '*' },
						query: { filter: filter as any }
					})
				)
			);
			totalCount = Number(aggr[0]?.count) || 0;
		}

		// 2. Récupération des commentaires parents
		const comments = await directus.request(
			withToken(
				PUBLIC_DIRECTUS_TOKEN,
				readItems('commentaires', {
					filter: filter as any,
					sort: ['-date_created'],
					limit: limit,
					page: page,
					fields: [
						'id',
						'contenu',
						'date_created',
						'is_admin_reply',
						'pseudonyme',
						{ client: ['prenom', 'nom'] }
					]
				})
			)
		);

		let replies: any[] = [];

		// 3. Récupération des réponses associées
		if (comments.length > 0) {
			const parentIds = comments.map((c: any) => c.id);
			replies = await directus.request(
				withToken(
					PUBLIC_DIRECTUS_TOKEN,
					readItems('commentaires', {
						filter: {
							status: { _eq: 'published' as const },
							parent: { _in: parentIds }
						} as any,
						sort: ['date_created'],
						fields: [
							'id',
							'contenu',
							'date_created',
							'parent',
							'is_admin_reply',
							'pseudonyme',
							{ client: ['prenom', 'nom'] }
						]
					})
				)
			);
		}

		return { comments, replies, totalCount };
	} catch (error) {
		console.error('Error fetching reviews:', error);
		throw new Error('Impossible de charger les avis.');
	}
};
