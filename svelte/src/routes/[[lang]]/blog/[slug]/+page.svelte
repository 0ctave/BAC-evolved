<script lang="ts">
	import { page } from '$app/state';
	import { PUBLIC_SITE_URL } from '$env/static/public';
	import DirectusImage from '$lib/components/shared/DirectusImage.svelte';
	import Container from '$lib/components/ui/Container.svelte';
	import Headline from '$lib/components/ui/Headline.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import type { PageData } from './$types';
	import BaseText from '$lib/components/ui/Text.svelte';
	import ShareDialog from '$lib/components/ui/ShareDialog.svelte';
	import setAttr from '$lib/directus/visualEditing';

	let { data }: { data: PageData } = $props();

	let post = $derived(data.post);
	const author = $derived(data.author);
	const authorName = $derived([author?.first_name, author?.last_name].filter(Boolean).join(' '));
	const postUrl = `${PUBLIC_SITE_URL}/blog/${page.params.slug}`;
</script>

<div class="min-h-screen bg-limestone-50 dark:bg-[#181719] text-iron dark:text-limestone-100 font-sans transition-colors duration-500">
	<Container class="py-16 relative z-10">
		<!-- Main Image -->
		{#if post?.image}
			<div class="mb-12 group">
				<div
						class="relative h-[400px] md:h-[500px] w-full overflow-hidden rounded-xl border-2 border-iron/10 dark:border-limestone-100/10 shadow-retro dark:shadow-black/60 transition-transform duration-500 group-hover:-translate-y-1"
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
							class="object-cover w-full h-full"
							fill
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
					/>
				</div>
			</div>
		{/if}

		<div class="max-w-4xl">
            <span class="inline-block py-1 px-3 border-2 border-primary text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                Editorial
            </span>
			<Headline
					as="h2"
					headline={post.title}
					class="mb-6 !text-5xl md:!text-6xl !font-heading !font-bold !text-iron dark:!text-limestone-50 leading-tight"
					data-directus={setAttr({
                    collection: 'posts',
                    item: post.id,
                    fields: ['title', 'slug'],
                    mode: 'popover'
                })}
			/>
		</div>

		<div class="w-24 h-1.5 bg-primary mb-12"></div>

		<div class="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,_2fr)_400px]">
			<!-- Content -->
			<main class="text-left font-sans text-lg leading-relaxed text-iron-muted dark:text-limestone-300">
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
			<aside class="h-fit max-w-[496px] space-y-8 rounded-xl bg-white dark:bg-[#252426] p-8 border-2 border-iron/10 dark:border-limestone-100/10 shadow-retro dark:shadow-black/50">
				{#if author}
					<div
							class="flex items-center space-x-5 border-b-2 border-iron/5 dark:border-limestone-100/5 pb-6"
							data-directus={setAttr({
                            collection: 'posts',
                            item: post.id,
                            fields: ['author'],
                            mode: 'popover'
                        })}
					>
						{#if author.avatar}
							<div class="p-1 border-2 border-iron/10 rounded-full">
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
							<span class="block text-xs font-bold uppercase tracking-widest text-iron-muted/60 mb-1">Auteur</span>
							{#if authorName}
								<p class="font-heading font-bold text-xl text-iron dark:text-limestone-50">
									{authorName}
								</p>
							{/if}
						</div>
					</div>
				{/if}

				{#if post.description}
					<div class="italic text-iron-muted dark:text-limestone-400 font-serif border-l-4 border-primary/30 pl-4 py-2">
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

				<div class="pt-6 border-t-2 border-iron/5 dark:border-limestone-100/5">
					<h3 class="mb-6 font-bold font-heading text-xl text-iron dark:text-limestone-50">Articles liés</h3>
					<div class="space-y-6">
						{#each data.relatedPosts as relatedPost (relatedPost.id)}
							<a
									href={`/blog/${relatedPost.slug}`}
									class="group flex items-start space-x-4"
							>
								{#if relatedPost.image}
									<div class="relative h-[80px] w-[100px] shrink-0 overflow-hidden rounded-lg border border-iron/10">
										<DirectusImage
												uuid={relatedPost.image as string}
												alt={relatedPost.title || 'related posts'}
												class="object-cover transition-transform duration-500 group-hover:scale-110 grayscale group-hover:grayscale-0"
												fill
												sizes="(max-width: 768px) 100px, (max-width: 1024px) 150px, 150px"
										/>
									</div>
								{/if}
								<div>
                                    <span class="font-heading font-bold text-lg leading-tight text-iron dark:text-limestone-100 group-hover:text-primary transition-colors">
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