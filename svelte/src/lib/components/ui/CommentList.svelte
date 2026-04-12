<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';
	import { fetchPaginatedReviews } from '$lib/directus/review-fetchers';
	import { fade, fly, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		limit?: number;
	}

	let { limit = 5 }: Props = $props();

	let topLevelComments = $state<any[]>([]);
	let allReplies = $state<any[]>([]);
	let currentPage = $state(1);
	let totalCount = $state(0);

	let isLoading = $state(true);
	let isFetchingMore = $state(false);

	let expandedComments = $state<number[]>([]);

	const toggleReplies = (id: number) => {
		if (expandedComments.includes(id)) {
			expandedComments = expandedComments.filter((i) => i !== id);
		} else {
			expandedComments = [...expandedComments, id];
		}
	};

	const hasMore = $derived(topLevelComments.length < totalCount);

	const loadReviews = async (pageToFetch: number) => {
		try {
			// window.fetch est utilisé pour forcer la requête côté client
			const {
				comments,
				replies,
				totalCount: count
			} = await fetchPaginatedReviews(pageToFetch, limit, window.fetch);

			if (pageToFetch === 1) {
				totalCount = count;
				topLevelComments = comments;
				allReplies = replies;
			} else {
				topLevelComments = [...topLevelComments, ...comments];
				allReplies = [...allReplies, ...replies];
			}
		} catch (error) {
			console.error('Échec du chargement des avis :', error);
		}
	};

	onMount(async () => {
		isLoading = true;
		await loadReviews(1);
		isLoading = false;
	});

	const loadMore = async () => {
		if (isFetchingMore || !hasMore) return;
		isFetchingMore = true;
		currentPage++;
		await loadReviews(currentPage);
		isFetchingMore = false;
	};

	const getAuthorName = (c: any) =>
		c.is_admin_reply ? 'Cathy' : c.pseudonyme || c.client?.prenom || 'Anonyme';
	const formatDate = (d: string) =>
		new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
			new Date(d)
		);
</script>

<div class="relative z-10 w-full">
	{#if isLoading}
		<div class="flex justify-center py-16" out:fade>
			<div class="border-primary h-12 w-12 animate-spin rounded-full border-b-4"></div>
		</div>
	{:else if topLevelComments.length === 0}
		<div
			class="panel-backdrop border-iron/20 dark:border-limestone-50/20 rounded-xl border-2 border-dashed p-12 text-center"
			in:fly={{ y: 20, duration: 600 }}
		>
			<p class="text-body text-xl italic">
				Aucun avis pour le moment. Soyez le premier à partager votre expérience !
			</p>
		</div>
	{:else}
		<div class="space-y-10">
			{#each topLevelComments as comment, i (comment.id)}
				<div
					class="group relative"
					in:fly={{ y: 30, duration: 600, delay: i * 100, easing: cubicOut }}
				>
					<!-- Parent Review -->
					<div
						class="surface-atelier relative z-10 flex flex-col p-6 transition-transform duration-300 hover:-translate-y-1 md:p-8"
					>
						<p
							class="text-body text-iron dark:text-limestone-100 mb-6 text-lg leading-relaxed font-medium italic md:text-xl"
						>
							"{comment.contenu}"
						</p>

						<div
							class="border-iron/10 dark:border-limestone-50/10 mt-auto flex flex-wrap items-center justify-between border-t-2 pt-4"
						>
							<div class="flex flex-col gap-1">
								<span
									class="font-heading text-iron dark:text-limestone-50 text-lg font-bold tracking-wide"
								>
									{getAuthorName(comment)}
								</span>
								{#if allReplies.some((r) => r.parent === comment.id)}
									<button
										type="button"
										onclick={() => toggleReplies(comment.id)}
										class="text-primary hover:text-primary-dark flex cursor-pointer items-center gap-1 text-sm font-bold tracking-wider uppercase transition-colors"
									>
										{expandedComments.includes(comment.id) ? 'Masquer' : 'Voir'}
										{allReplies.filter((r) => r.parent === comment.id).length}
										{allReplies.filter((r) => r.parent === comment.id).length > 1
											? 'réponses'
											: 'réponse'}
										<svg
											class={cn(
												'h-4 w-4 transition-transform duration-300',
												expandedComments.includes(comment.id) ? 'rotate-180' : ''
											)}
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
												clip-rule="evenodd"
											/>
										</svg>
									</button>
								{/if}
							</div>
							<span
								class="text-iron-muted dark:text-limestone-400 font-sans text-sm font-medium md:text-base"
							>
								{formatDate(comment.date_created)}
							</span>
						</div>
					</div>

					<!-- Replies -->
					{#if expandedComments.includes(comment.id)}
						<div class="mt-4 ml-6 space-y-4 md:ml-12" transition:slide={{ duration: 400 }}>
							{#each allReplies.filter((r) => r.parent === comment.id) as reply, k (reply.id)}
								<div
									class={cn(
										'surface-atelier relative flex flex-col p-6 transition-all md:p-8',
										reply.is_admin_reply ? 'border-primary shadow-retro-primary' : ''
									)}
									in:fly={{ y: 10, duration: 400, delay: k * 100 }}
								>
									{#if reply.is_admin_reply}
										<div class="mb-4 flex items-center gap-2">
											<span
												class="bg-primary rounded-full px-3 py-0.5 text-[10px] font-black tracking-widest text-white uppercase"
											>
												Bordeaux à Cœur
											</span>
										</div>
									{/if}

									<p
										class="text-body text-iron dark:text-limestone-100 mb-6 text-base leading-relaxed italic md:text-lg"
									>
										"{reply.contenu}"
									</p>

									<div
										class="border-iron/10 dark:border-limestone-50/10 mt-auto flex flex-wrap items-center justify-between border-t-2 pt-4"
									>
										<span class="font-heading text-iron dark:text-limestone-50 text-base font-bold">
											{getAuthorName(reply)}
										</span>
										<span class="text-iron-muted dark:text-limestone-400 text-xs font-medium">
											{formatDate(reply.date_created)}
										</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Pagination Load More -->
		{#if hasMore}
			<div class="mt-16 flex justify-center" in:fade>
				<button onclick={loadMore} disabled={isFetchingMore} class="btn-atelier-outline group">
					{#if isFetchingMore}
						<span
							class="border-iron dark:border-limestone-50 mr-3 inline-block h-5 w-5 animate-spin rounded-full border-b-2"
						></span>
						Chargement...
					{:else}
						Voir plus d'avis
					{/if}
				</button>
			</div>
		{/if}
	{/if}
</div>
