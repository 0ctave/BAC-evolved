<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Copy, Share, X } from '@lucide/svelte';
	import Button from './button/button.svelte';
	import { Label } from './label';
	import { Input } from './input';

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
				class="flex items-center gap-2 border-2 border-iron/10 hover:border-primary hover:text-primary transition-colors text-iron-muted font-bold text-xs uppercase tracking-widest"
		>
			<Share class="size-4" />
			<span>Partager</span>
		</Button>
	</Dialog.Trigger>

	<Dialog.Content class="sm:max-w-md bg-white dark:bg-[#252426] border-2 border-iron/10 dark:border-limestone-100/10 shadow-retro dark:shadow-black/60 rounded-xl p-0 overflow-hidden">
		<div class="p-6 border-b-2 border-iron/5 dark:border-limestone-100/5 flex justify-between items-center bg-limestone-50/50 dark:bg-iron-light/10">
			<Dialog.Title class="font-heading font-bold text-xl text-iron dark:text-limestone-50">Partager cet article</Dialog.Title>
			<Dialog.Close class="p-1 hover:bg-iron/10 rounded-full transition-colors cursor-pointer">
				<X class="size-5 text-iron-muted" />
			</Dialog.Close>
		</div>

		<div class="p-6 space-y-6">
			<!-- Social Icons -->
			<div class="flex justify-center gap-6">
				{#each socialLinks as social (social.service)}
					<a
							href={social.url}
							target="_blank"
							rel="noopener noreferrer"
							class="group flex flex-col items-center gap-2"
					>
						<div class="w-12 h-12 rounded-full border-2 border-iron/10 flex items-center justify-center transition-all duration-300 group-hover:border-primary group-hover:shadow-retro-sm group-hover:-translate-y-1 bg-white dark:bg-iron-light/20">
							<img
									src={social.icon}
									alt={`${social.service} icon`}
									width={24}
									height={24}
									class="size-6 dark:invert opacity-70 group-hover:opacity-100"
							/>
						</div>
						<span class="text-[10px] font-bold uppercase tracking-wider text-iron-muted group-hover:text-primary transition-colors">{social.service}</span>
					</a>
				{/each}
			</div>

			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<span class="w-full border-t border-iron/10 dark:border-limestone-100/10"></span>
				</div>
				<div class="relative flex justify-center text-xs uppercase">
					<span class="bg-white dark:bg-[#252426] px-2 text-iron-muted dark:text-limestone-400 font-bold tracking-widest">Ou copier le lien</span>
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
							class="w-full bg-limestone-50 dark:bg-iron-light/10 border-b-2 border-iron/20 px-3 py-3 text-sm font-mono text-iron dark:text-limestone-100 outline-none focus:border-primary transition-colors rounded-t-md"
					/>
				</div>
				<Button
						type="button"
						size="icon"
						class="mb-[2px] rounded-lg border-2 border-iron/10 hover:border-primary hover:text-primary hover:shadow-retro-sm transition-all active:translate-y-0.5"
						onclick={handleCopy}
				>
					<span class="sr-only">Copy</span>
					{#if copied}
						<span class="text-green-500 font-bold text-xs">OK</span>
					{:else}
						<Copy class="size-4" />
					{/if}
				</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>