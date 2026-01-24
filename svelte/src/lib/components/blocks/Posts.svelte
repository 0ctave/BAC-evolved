<script lang="ts">
	import { page } from '$app/state';
	import { fetchPaginatedPosts, fetchTotalPostCount } from '$lib/directus/fetchers';
	import * as Pagination from '$lib/components/ui/pagination/index.js';

	import setAttr from '$lib/directus/visualEditing';
	import type { Post } from '$lib/types/directus-schema';
	import DirectusImage from '../shared/DirectusImage.svelte';
	import Headline from '../ui/Headline.svelte';
	import Tagline from '../ui/Tagline.svelte';
	import { scale } from 'svelte/transition';
	import {untrack} from "svelte";

	interface PostsProps {
		data: {
			tagline: string;
			headline?: string;
			posts: Post[];
			limit: number;
			id: string;
		};
	}

	let { data }: PostsProps = $props();
	let { tagline, headline, posts, limit, id } = $derived(data);
	let initialPage = $state(Number(page.url.searchParams.get('page')) || 1);

	let currentPage = $state(initialPage);
	let perPage = $derived(limit || 6);
	let paginatedPosts = $state<Post[]>(untrack(() => currentPage === 1 ? posts || [] : []));
	let totalPages = $state(0);
	let totalCount = $state(0);

	const fetchTotalPages = async () => {
		try {
			totalCount = await fetchTotalPostCount();
			totalPages = Math.ceil(totalCount / perPage);
		} catch (error) {
			console.error('Error fetching total post count:', error);
		}
	};
	$effect(() => {
		fetchTotalPages();
	});

	const fetchPosts = async (currentPage: number) => {
		try {
			if (currentPage === 1) {
				paginatedPosts = posts || [];
				return;
			}
			paginatedPosts = await fetchPaginatedPosts(perPage, currentPage);
		} catch (error) {
			console.error('Error fetching paginated posts:', error);
			paginatedPosts = [];
		}
	};
	$effect(() => {
		fetchPosts(currentPage);
	});

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
			fetchPosts(currentPage);
		}
	};
</script>

<div class="py-12">
	<div class="text-center mb-16">
		<Tagline
				{tagline}
				class="tagline-base"
				data-directus={setAttr({
                collection: 'block_posts',
                item: id,
                fields: 'tagline',
                mode: 'popover'
            })}
		/>
		{#if headline}
			<Headline
					{headline}
					class="heading-page"
					data-directus={setAttr({
                    collection: 'block_posts',
                    item: id,
                    fields: 'headline',
                    mode: 'popover'
                })}
			/>
			<div class="w-16 h-1 bg-primary mx-auto mt-4"></div>
		{/if}
	</div>

	<div
			class="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3"
			data-directus={setAttr({
			collection: 'block_posts',
			item: id,
			fields: ['collection', 'limit'],
			mode: 'popover'
		})}
	>
		{#each paginatedPosts as post (post.id)}
			<a
					in:scale={{ duration: 200 }}
					href={`/blog/${post.slug}`}
					class="surface-interactive group flex flex-col p-0 h-full"
			>
				<div class="relative h-64 w-full overflow-hidden border-b-2 border-iron/10 dark:border-limestone-100/10">
					{#if post.image}
						<DirectusImage
								uuid={post.image}
								alt={post.title}
								fill
								sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
								class="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-110 grayscale group-hover:grayscale-0"
						/>
					{/if}
					{#if post.date_created}
						<div class="absolute top-4 left-4 bg-white dark:bg-iron px-3 py-1 border-2 border-iron/10 text-xs font-bold uppercase tracking-widest text-iron dark:text-limestone-100 shadow-retro-sm">
							Article
						</div>
					{/if}
				</div>

				<div class="p-6 flex-1 flex flex-col">
					<h3 class="font-heading font-bold text-xl text-iron dark:text-limestone-50 mb-3 transition-colors duration-300 group-hover:text-primary">
						{post.title}
					</h3>
					<p class="text-body line-clamp-3 mb-6 flex-1">{post.description}</p>

					<div class="pt-4 border-t border-iron/5 dark:border-limestone-100/5 flex items-center text-xs font-bold uppercase tracking-widest text-primary opacity-50 group-hover:opacity-100 transition-opacity duration-300">
						Lire la suite <span class="ml-2 transition-transform duration-300 group-hover:translate-x-1">⟶</span>
					</div>
				</div>
			</a>
		{/each}
	</div>

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="mt-16 flex justify-center">
			<Pagination.Root count={totalCount} perPage={limit} onPageChange={handlePageChange}>
				{#snippet children({ pages, currentPage })}
					<Pagination.Content>
						{#each pages as page (page.key)}
							{#if page.type === 'ellipsis'}
								<Pagination.Item>
									<Pagination.Ellipsis />
								</Pagination.Item>
							{:else}
								<Pagination.Item>
									<Pagination.Link
											{page}
											isActive={currentPage === page.value}
											class="data-[selected]:btn-atelier-primary w-10 h-10 border-2 border-transparent hover:border-primary transition-colors font-bold rounded-lg flex items-center justify-center"
									>
										{page.value}
									</Pagination.Link>
								</Pagination.Item>
							{/if}
						{/each}
					</Pagination.Content>
				{/snippet}
			</Pagination.Root>
		</div>
	{/if}
</div>