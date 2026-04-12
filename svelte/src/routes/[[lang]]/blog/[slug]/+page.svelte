<script lang="ts">
	import { page } from '$app/state';
	import { PUBLIC_SITE_URL } from '$env/static/public';
	import DirectusImage from '$lib/components/shared/DirectusImage.svelte';
	import Container from '$lib/components/ui/Container.svelte';
	import Headline from '$lib/components/ui/Headline.svelte';
	import type { PageData } from './$types';
	import BaseText from '$lib/components/ui/Text.svelte';
	import ShareDialog from '$lib/components/ui/ShareDialog.svelte';
	import setAttr from '$lib/directus/visualEditing';
	import { base } from '$app/paths';

	let { data }: { data: PageData } = $props();

	let post = $derived(data.post);
	const author = $derived(data.author);
	const authorName = $derived([author?.first_name, author?.last_name].filter(Boolean).join(' '));
	const postUrl = `${PUBLIC_SITE_URL}/blog/${page.params.slug}`;
</script>

<div
	class="bg-limestone-50 text-iron dark:text-limestone-100 min-h-screen font-sans transition-colors duration-500 dark:bg-[#181719]"
>
	<Container class="relative z-10 py-16">
		<!-- Main Image -->
		{#if post?.image}
			<div class="group mb-12">
				<div
					class="border-iron/10 dark:border-limestone-100/10 shadow-retro relative h-[400px] w-full overflow-hidden rounded-xl border-2 transition-transform duration-500 group-hover:-translate-y-1 md:h-[500px] dark:shadow-black/60"
					data-directus={setAttr({
						collection: 'posts',
						item: post.id,
						fields: ['image', 'meta_header_image'],
						mode: 'modal'
					})}
				>
					<DirectusImage
						uuid={post.image as string}
						alt={post.title || 'post header image'}
						class="h-full w-full object-cover"
						fill
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
					/>
				</div>
			</div>
		{/if}

		<div class="max-w-4xl">
			<span
				class="border-primary text-primary mb-6 inline-block border-2 px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase"
			>
				Editorial
			</span>
			<Headline
				as="h2"
				headline={post.title}
				class="!font-heading !text-iron dark:!text-limestone-50 mb-6 !text-5xl leading-tight !font-bold md:!text-6xl"
				data-directus={setAttr({
					collection: 'posts',
					item: post.id,
					fields: ['title', 'slug'],
					mode: 'popover'
				})}
			/>
		</div>

		<div class="bg-primary mb-12 h-1.5 w-24"></div>

		<div class="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,_2fr)_400px]">
			<!-- Content -->
			<main
				class="text-iron-muted dark:text-limestone-300 text-left font-sans text-lg leading-relaxed"
			>
				<BaseText
					content={post.content || ''}
					data-directus={setAttr({
						collection: 'posts',
						item: post.id,
						fields: ['content', 'meta_header_content'],
						mode: 'drawer'
					})}
				/>
			</main>

			<!-- Sidebar Card -->
			<aside
				class="border-iron/10 dark:border-limestone-100/10 shadow-retro h-fit max-w-[496px] space-y-8 rounded-xl border-2 bg-white p-8 dark:bg-[#252426] dark:shadow-black/50"
			>
				{#if author}
					<div
						class="border-iron/5 dark:border-limestone-100/5 flex items-center space-x-5 border-b-2 pb-6"
						data-directus={setAttr({
							collection: 'posts',
							item: post.id,
							fields: ['author'],
							mode: 'popover'
						})}
					>
						{#if author.avatar}
							<div class="border-iron/10 rounded-full border-2 p-1">
								<DirectusImage
									uuid={author.avatar as string}
									alt={authorName || 'author avatar'}
									class="size-[56px] rounded-full object-cover"
									width={56}
									height={56}
								/>
							</div>
						{/if}
						<div>
							<span
								class="text-iron-muted/60 mb-1 block text-xs font-bold tracking-widest uppercase"
								>Auteur</span
							>
							{#if authorName}
								<p class="font-heading text-iron dark:text-limestone-50 text-xl font-bold">
									{authorName}
								</p>
							{/if}
						</div>
					</div>
				{/if}

				{#if post.description}
					<div
						class="text-iron-muted dark:text-limestone-400 border-primary/30 border-l-4 py-2 pl-4 font-serif italic"
					>
						<p
							data-directus={setAttr({
								collection: 'posts',
								item: post.id,
								fields: 'description',
								mode: 'popover'
							})}
						>
							{post.description}
						</p>
					</div>
				{/if}

				<div class="flex justify-start pt-2">
					<ShareDialog {postUrl} postTitle={post.title} />
				</div>

				<div class="border-iron/5 dark:border-limestone-100/5 border-t-2 pt-6">
					<h3 class="font-heading text-iron dark:text-limestone-50 mb-6 text-xl font-bold">
						Articles liés
					</h3>
					<div class="space-y-6">
						{#each data.relatedPosts as relatedPost (relatedPost.id)}
							<a href={`${base}/blog/${relatedPost.slug}`} class="group flex items-start space-x-4">
								{#if relatedPost.image}
									<div
										class="border-iron/10 relative h-[80px] w-[100px] shrink-0 overflow-hidden rounded-lg border"
									>
										<DirectusImage
											uuid={relatedPost.image as string}
											alt={relatedPost.title || 'related posts'}
											class="object-cover grayscale transition-transform duration-500 group-hover:scale-110 group-hover:grayscale-0"
											fill
											sizes="(max-width: 768px) 100px, (max-width: 1024px) 150px, 150px"
										/>
									</div>
								{/if}
								<div>
									<span
										class="font-heading text-iron dark:text-limestone-100 group-hover:text-primary text-lg leading-tight font-bold transition-colors"
									>
										{relatedPost.title}
									</span>
								</div>
							</a>
						{/each}
					</div>
				</div>
			</aside>
		</div>
	</Container>
</div>
