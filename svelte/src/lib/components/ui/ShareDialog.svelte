<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Copy, Share, X } from '@lucide/svelte';
	import Button from './button/button.svelte';
	import { Label } from './label';

	let copied = $state(false);

	let { postUrl, postTitle }: { postUrl: string; postTitle: string } = $props();
	const handleCopy = () => {
		navigator.clipboard.writeText(postUrl);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	};

	const socialLinks = $derived([
		{
			service: 'reddit',
			url: `http://www.reddit.com/submit?url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(postTitle)}`,
			icon: '/icons/social/reddit.svg'
		},
		{
			service: 'x',
			url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(postTitle)}`,
			icon: '/icons/social/twitter.svg'
		},
		{
			service: 'linkedin',
			url: `https://www.linkedin.com/shareArticle/?mini=true&url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(postTitle)}`,
			icon: '/icons/social/linkedin.svg'
		}
	]);
</script>

<Dialog.Root>
	<Dialog.Trigger>
		<Button
			variant="outline"
			class="border-iron/10 hover:border-primary hover:text-primary text-iron-muted flex items-center gap-2 border-2 text-xs font-bold tracking-widest uppercase transition-colors"
		>
			<Share class="size-4" />
			<span>Partager</span>
		</Button>
	</Dialog.Trigger>

	<Dialog.Content
		class="border-iron/10 dark:border-limestone-100/10 shadow-retro overflow-hidden rounded-xl border-2 bg-white p-0 sm:max-w-md dark:bg-[#252426] dark:shadow-black/60"
	>
		<div
			class="border-iron/5 dark:border-limestone-100/5 bg-limestone-50/50 dark:bg-iron-light/10 flex items-center justify-between border-b-2 p-6"
		>
			<Dialog.Title class="font-heading text-iron dark:text-limestone-50 text-xl font-bold"
				>Partager cet article</Dialog.Title
			>
			<Dialog.Close class="hover:bg-iron/10 cursor-pointer rounded-full p-1 transition-colors">
				<X class="text-iron-muted size-5" />
			</Dialog.Close>
		</div>

		<div class="space-y-6 p-6">
			<!-- Social Icons -->
			<div class="flex justify-center gap-6">
				{#each socialLinks as social (social.service)}
					<a
						href={social.url}
						target="_blank"
						rel="noopener noreferrer"
						class="group flex flex-col items-center gap-2"
					>
						<div
							class="border-iron/10 group-hover:border-primary group-hover:shadow-retro-sm dark:bg-iron-light/20 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white transition-all duration-300 group-hover:-translate-y-1"
						>
							<img
								src={social.icon}
								alt={`${social.service} icon`}
								width={24}
								height={24}
								class="size-6 opacity-70 group-hover:opacity-100 dark:invert"
							/>
						</div>
						<span
							class="text-iron-muted group-hover:text-primary text-[10px] font-bold tracking-wider uppercase transition-colors"
							>{social.service}</span
						>
					</a>
				{/each}
			</div>

			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<span class="border-iron/10 dark:border-limestone-100/10 w-full border-t"></span>
				</div>
				<div class="relative flex justify-center text-xs uppercase">
					<span
						class="text-iron-muted dark:text-limestone-400 bg-white px-2 font-bold tracking-widest dark:bg-[#252426]"
						>Ou copier le lien</span
					>
				</div>
			</div>

			<div class="flex items-end gap-3">
				<div class="grid flex-1 gap-2">
					<Label for="link" class="sr-only">Link</Label>
					<!-- Atelier Input Style -->
					<input
						id="link"
						value={postUrl}
						readonly
						class="bg-limestone-50 dark:bg-iron-light/10 border-iron/20 text-iron dark:text-limestone-100 focus:border-primary w-full rounded-t-md border-b-2 px-3 py-3 font-mono text-sm transition-colors outline-none"
					/>
				</div>
				<Button
					type="button"
					size="icon"
					class="border-iron/10 hover:border-primary hover:text-primary hover:shadow-retro-sm mb-[2px] rounded-lg border-2 transition-all active:translate-y-0.5"
					onclick={handleCopy}
				>
					<span class="sr-only">Copy</span>
					{#if copied}
						<span class="text-xs font-bold text-green-500">OK</span>
					{:else}
						<Copy class="size-4" />
					{/if}
				</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
