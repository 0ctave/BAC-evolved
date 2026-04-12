<script lang="ts">
	import { page } from '$app/state';
	import { fetchPaginatedPosts, fetchTotalPostCount } from '$lib/directus/fetchers';
	import * as Pagination from '$lib/components/ui/pagination/index.js';

	import setAttr from '$lib/directus/visualEditing';
	import type { Post } from '$lib/types/directus-schema';
	import DirectusImage from '../shared/DirectusImage.svelte';
	import Headline from '../ui/Headline.svelte';
	import Tagline from '../ui/Tagline.svelte';
	import { scale, fly } from 'svelte/transition';
	import { untrack } from 'svelte';
	import { base } from '$app/paths';
	import { reveal } from '$lib/actions';
	import { cubicOut } from 'svelte/easing';

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
	let paginatedPosts = $state<Post[]>(untrack(() => (currentPage === 1 ? posts || [] : [])));
	let totalPages = $state(0);
	let totalCount = $state(0);

	let visible = $state(false);

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

<div class="py-12" use:reveal onreveal={() => (visible = true)}>
	{#if visible}
		<div class="mb-16 text-center" in:fly={{ y: -20, duration: 800 }}>
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
				<div
					class="bg-primary mx-auto mt-4 h-1 w-16"
					in:scale={{ duration: 600, delay: 400 }}
				></div>
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
			{#each paginatedPosts as post, i (post.id)}
				<div in:fly={{ y: 30, duration: 600, delay: i * 100, easing: cubicOut }}>
					<a
						href={`${base}/blog/${post.slug}`}
						class="surface-interactive group flex h-full flex-col p-0"
					>
						<div
							class="border-iron/10 dark:border-limestone-100/10 relative h-64 w-full overflow-hidden border-b-2"
						>
							{#if post.image}
								<DirectusImage
									uuid={post.image}
									alt={post.title}
									fill
									height={512}
									sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
									class="h-auto w-full object-cover grayscale transition-transform duration-500 group-hover:scale-110 group-hover:grayscale-0"
								/>
							{/if}
							{#if post.date_created}
								<div
									class="dark:bg-iron border-iron/10 text-iron dark:text-limestone-100 shadow-retro-sm absolute top-4 left-4 border-2 bg-white px-3 py-1 text-xs font-bold tracking-widest uppercase"
								>
									Article
								</div>
							{/if}
						</div>

						<div class="flex flex-1 flex-col p-6">
							<h3
								class="font-heading text-iron dark:text-limestone-50 group-hover:text-primary mb-3 text-xl font-bold transition-colors duration-300"
							>
								{post.title}
							</h3>
							<p class="text-body mb-6 line-clamp-3 flex-1">{post.description}</p>

							<div
								class="border-iron/5 dark:border-limestone-100/5 text-primary flex items-center border-t pt-4 text-xs font-bold tracking-widest uppercase opacity-50 transition-opacity duration-300 group-hover:opacity-100"
							>
								Lire la suite <span
									class="ml-2 transition-transform duration-300 group-hover:translate-x-1">⟶</span
								>
							</div>
						</div>
					</a>
				</div>
			{/each}
		</div>
	{/if}

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
										class="data-[selected]:btn-atelier-primary hover:border-primary flex h-10 w-10 items-center justify-center rounded-lg border-2 border-transparent font-bold transition-colors"
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
