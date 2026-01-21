import type { RequestEvent } from '@sveltejs/kit';
import {
	type BlockPost,
	type DirectusUser,
	type Langue,
	type Page,
	type Post,
	type Schema
} from '../types/directus-schema';
import { useDirectus } from './directus';
import {
	aggregate,
	type QueryFilter,
	readItem,
	readItems,
	readSingleton,
	withToken
} from '@directus/sdk';

// --- TYPES ---
export interface SiteConfig {
	globals: any;
	headerNavigation: any;
	footerNavigation: any;
	languages: Langue[];
}

const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

/**
 * Page fields configuration.
 */
const pageFields = [
	'seo',
	'id',
	{
		traductions: ['langues_code', 'title', 'permalink']
	},
	{
		blocks: [
			'id',
			'background',
			'collection',
			'sort',
			'hide_block',
			{
				item: {
					block_booking: [
						'id',
						{
							traductions: [
								'langues_code',
								'step_1_label',
								'step_2_label',
								'step_3_label',
								'step_4_label'
							]
						}
					],
					block_richtext: [
						'id',
						'alignment',
						{ traductions: ['langues_code', 'tagline', 'headline', 'content'] }
					],
					block_gallery: [
						'id',
						{ items: ['id', 'directus_file', 'sort'] },
						{ traductions: ['langues_code', 'tagline', 'headline'] }
					],
					block_pricing: [
						'id',
						{ traductions: ['langues_code', 'tagline', 'headline'] },
						{
							pricing_cards: [
								'id',
								'price',
								'badge',
								'features',
								'is_highlighted',
								{ traductions: ['langues_code', 'title', 'description'] },
								{
									button: [
										'id',
										'variant',
										'url',
										'type',
										{ traductions: ['langues_code', 'label'] },
										{ page: ['id', { traductions: ['permalink', 'langues_code'] }] },
										{ post: ['slug'] }
									]
								}
							]
						}
					],
					block_hero: [
						'id',
						'layout',
						'image',
						{
							traductions: ['langues_code', 'tagline', 'headline', 'description']
						},
						{
							button_group: [
								'id',
								{
									buttons: [
										'id',
										'variant',
										'url',
										'type',
										{ traductions: ['langues_code', 'label'] },
										{ page: ['id', { traductions: ['permalink', 'langues_code'] }] },
										{ post: ['slug'] }
									]
								}
							]
						}
					],
					block_split: [
						'id',
						'layout',
						'image',
						{
							traductions: ['langues_code', 'tagline', 'headline', 'content']
						}
					],
					block_posts: [
						'id',
						'collection',
						'limit',
						{ traductions: ['langues_code', 'tagline', 'headline'] }
					],
					block_form: [
						'id',
						{ traductions: ['langues_code', 'tagline', 'headline'] },
						{
							form: [
								'id',
								'on_success',
								'success_redirect_url',
								'is_active',
								{ traductions: ['langues_code', 'title', 'submit_label', 'success_message'] },
								{
									fields: [
										'id',
										'name',
										'type',
										'validation',
										'width',
										'choices',
										'required',
										'sort',
										{ traductions: ['langues_code', 'label', 'placeholder', 'help'] }
									]
								}
							]
						}
					]
				}
			}
		]
	}
] as const;

const postFields = [
	'id',
	'title',
	'content',
	'status',
	'published_at',
	'image',
	'description',
	'slug',
	'seo',
	{
		author: ['id', 'first_name', 'last_name', 'avatar']
	}
] as const;

// --- CACHE STATE ---
let globalSitePromise: Promise<SiteConfig> | null = null;
let lastFetchTimestamp = 0;

// --- SITE DATA ---
export const fetchSiteData = (fetch: RequestEvent['fetch']): Promise<SiteConfig> => {
	const now = Date.now();

	if (globalSitePromise && now - lastFetchTimestamp < CACHE_TTL_MS) {
		return globalSitePromise;
	}

	const { getDirectus } = useDirectus();
	const directus = getDirectus(fetch);

	globalSitePromise = Promise.all([
		directus.request(
			readSingleton('globals', {
				fields: [
					'id',
					'title',
					'description',
					'logo',
					'logo_dark_mode',
					'social_links',
					'accent_color',
					'favicon'
				]
			})
		),
		directus.request(
			readItem('navigation', 'main', {
				fields: [
					'id',
					{ traductions: ['title', 'langues_code'] },
					{
						items: [
							'*',
							{ traductions: ['title', 'langues_code'] },
							{
								page: ['id', { traductions: ['permalink', 'langues_code'] }]
							},
							{
								button: [
									'id',
									'variant',
									'url',
									'type',
									{ traductions: ['langues_code', 'label'] },
									{ page: ['id', { traductions: ['permalink', 'langues_code'] }] },
									{ post: ['slug'] }
								]
							},
							{
								children: [
									'*',
									{ traductions: ['title', 'langues_code'] },
									{
										page: ['id', { traductions: ['permalink', 'langues_code'] }]
									}
								]
							}
						]
					}
				],
				deep: { items: { _sort: ['sort'] } }
			})
		),
		directus.request(
			readItem('navigation', 'footer', {
				fields: [
					'id',
					{ traductions: ['title', 'langues_code'] },
					{
						items: [
							'*',
							{
								page: ['id', { traductions: ['permalink', 'langues_code'] }]
							}
						]
					}
				]
			})
		),
		// FIX: Added 'slug' and 'is_default' to fields
		directus.request(
			readItems('langues', {
				fields: ['code', 'nom', 'direction', 'flag_code', 'slug', 'is_default']
			})
		)
	])
		.then(([globals, headerNavigation, footerNavigation, languages]) => {
			lastFetchTimestamp = Date.now();
			return {
				globals,
				headerNavigation,
				footerNavigation,
				languages: languages as Langue[]
			};
		})
		.catch((err) => {
			globalSitePromise = null;
			throw err;
		});

	return globalSitePromise;
};

// --- PAGE FETCHING ---
export const fetchPageData = async (
	permalink: string,
	dbLocaleCode: string,
	fetch: RequestEvent['fetch'],
	preview?: boolean,
	token?: string
) => {
	if (permalink.startsWith('/api/') || permalink.includes('.')) {
		throw new Error(`Ignored path: ${permalink}`);
	}

	const { getDirectus } = useDirectus();
	const directus = getDirectus(fetch);
	const shortLocale = dbLocaleCode.split('-')[0];

	try {
		const filter = {
			_and: [
				preview && token ? {} : { status: { _eq: 'published' } },
				{
					traductions: {
						_and: [
							{ permalink: { _eq: permalink } },
							{ langues_code: { _starts_with: shortLocale } }
						]
					}
				}
			]
		};

		const pageData = (await directus.request(
			withToken(
				token as string,
				readItems('pages', {
					filter,
					limit: 1,
					fields: pageFields,
					deep: { blocks: { _sort: ['sort'], _filter: { hide_block: { _neq: true } } } }
				})
			)
		)) as Page[];

		if (!pageData.length) throw new Error('Page not found');

		const page = pageData[0];

		// Parallelize Block Enhancements
		if (Array.isArray(page.blocks)) {
			const postBlocks = page.blocks.filter(
				(b) => b.collection === 'block_posts' && b.item && typeof b.item === 'object'
			);

			if (postBlocks.length > 0) {
				await Promise.all(
					postBlocks.map(async (block) => {
						const blockPost = block.item as BlockPost;
						const limit = blockPost.limit ?? 6;

						const posts = await directus.request(
							readItems('posts', {
								fields: ['id', 'title', 'description', 'slug', 'image', 'published_at'],
								filter: { status: { _eq: 'published' } },
								sort: ['-published_at'],
								limit
							})
						);

						(block.item as BlockPost & { posts: Post[] }).posts = posts as Post[];
					})
				);
			}
		}

		return page;
	} catch (error) {
		throw error;
	}
};

export const fetchPageDataById = async (
	id: string,
	version: string,
	token: string | undefined,
	fetch: RequestEvent['fetch']
) => {
	const { getDirectus } = useDirectus();
	const directus = getDirectus(fetch);
	return (await directus.request(
		withToken(
			token as string,
			readItem('pages', id, {
				version,
				fields: pageFields,
				deep: { blocks: { _sort: ['sort'], _filter: { hide_block: { _neq: true } } } }
			})
		)
	)) as Page;
};

export const getPageIdByPermalink = async (
	permalink: string,
	locale: string,
	token: string | undefined,
	fetch: RequestEvent['fetch']
) => {
	const { getDirectus } = useDirectus();
	const directus = getDirectus(fetch);
	try {
		const shortLocale = locale.split('-')[0];
		const pageData = (await directus.request(
			withToken(
				token as string,
				readItems('pages', {
					filter: {
						traductions: {
							_and: [
								{ permalink: { _eq: permalink } },
								{ langues_code: { _starts_with: shortLocale } }
							]
						}
					},
					limit: 1,
					fields: ['id']
				})
			)
		)) as Pick<Page, 'id'>[];
		return pageData.length > 0 ? pageData[0].id : null;
	} catch (e) {
		return null;
	}
};

// --- BLOG & POSTS ---
export const fetchPaginatedPosts = async (limit: number, page: number): Promise<Post[]> => {
	const { getDirectus } = useDirectus();
	const directus = getDirectus(fetch);
	try {
		return (await directus.request(
			readItems('posts', {
				limit,
				page,
				sort: ['-published_at'],
				fields: ['id', 'title', 'description', 'slug', 'image'],
				filter: { status: { _eq: 'published' } }
			})
		)) as Post[];
	} catch (error) {
		throw new Error('Failed to fetch paginated posts');
	}
};

export const fetchTotalPostCount = async (): Promise<number> => {
	const { getDirectus } = useDirectus();
	const directus = getDirectus(fetch);
	try {
		const response = await directus.request(
			aggregate('posts', {
				aggregate: { count: '*' },
				filter: { status: { _eq: 'published' } }
			})
		);
		return Number(response[0]?.count) || 0;
	} catch (error) {
		return 0;
	}
};

export const fetchPostBySlug = async (
	slug: string,
	options: { draft?: boolean; token?: string },
	fetch: RequestEvent['fetch']
): Promise<{ post: Post | null; relatedPosts: Post[] }> => {
	const { getDirectus } = useDirectus();
	const directus = getDirectus(fetch);
	const { draft, token } = options || {};
	try {
		const filter: QueryFilter<Schema, Post> =
			token || draft
				? { slug: { _eq: slug } }
				: { slug: { _eq: slug }, status: { _eq: 'published' } };
		const [posts, relatedPosts] = await Promise.all([
			directus.request<Post[]>(
				withToken(
					token as string,
					readItems<Schema, 'posts', any>('posts', { filter, limit: 1, fields: postFields })
				)
			),
			directus.request<Post[]>(
				withToken(
					token as string,
					readItems<Schema, 'posts', any>('posts', {
						filter: { slug: { _neq: slug }, status: { _eq: 'published' } },
						limit: 2,
						fields: ['id', 'title', 'slug', 'image']
					})
				)
			)
		]);
		return { post: posts.length > 0 ? (posts[0] as Post) : null, relatedPosts };
	} catch (error) {
		throw new Error('Failed to fetch blog post and related posts');
	}
};

export const getPostIdBySlug = async (
	slug: string,
	token: string | undefined,
	fetch: RequestEvent['fetch']
) => {
	const { getDirectus } = useDirectus();
	const directus = getDirectus(fetch);
	try {
		const postData = (await directus.request(
			withToken(
				token as string,
				readItems('posts', {
					filter: { slug: { _eq: slug } },
					limit: 1,
					fields: ['id']
				})
			)
		)) as Pick<Post, 'id'>[];
		return postData.length > 0 ? postData[0].id : null;
	} catch (error) {
		return null;
	}
};

export const fetchPostByIdAndVersion = async (
	id: string,
	version: string,
	slug: string,
	token: string | undefined,
	fetch: RequestEvent['fetch']
): Promise<{ post: Post; relatedPosts: Post[] }> => {
	const { getDirectus } = useDirectus();
	const directus = getDirectus(fetch);
	try {
		const [postData, relatedPosts] = await Promise.all([
			directus.request(
				withToken(token as string, readItem('posts', id, { version, fields: postFields }))
			),
			directus.request(
				readItems('posts', {
					filter: { slug: { _neq: slug }, status: { _eq: 'published' } },
					limit: 2,
					fields: ['id', 'title', 'slug', 'image']
				})
			)
		]);
		return { post: postData as Post, relatedPosts: relatedPosts as Post[] };
	} catch (error) {
		throw new Error('Failed to fetch versioned post');
	}
};

export const fetchRelatedPosts = async (excludeId: string, fetch: RequestEvent['fetch']) => {
	const { getDirectus } = useDirectus();
	const directus = getDirectus(fetch);
	try {
		return (await directus.request(
			readItems('posts', {
				filter: { status: { _eq: 'published' }, id: { _neq: excludeId } },
				fields: ['id', 'title', 'image', 'slug'],
				limit: 2
			})
		)) as Post[];
	} catch (error) {
		throw new Error('Failed to fetch related posts');
	}
};

export const fetchAuthorById = async (authorId: string, fetch: RequestEvent['fetch']) => {
	const { getDirectus, readUser } = useDirectus();
	const directus = getDirectus(fetch);
	try {
		return (await directus.request(
			readUser(authorId, { fields: ['first_name', 'last_name', 'avatar'] })
		)) as DirectusUser;
	} catch (error) {
		throw new Error(`Failed to fetch author with ID "${authorId}"`);
	}
};
