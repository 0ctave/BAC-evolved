<script lang="ts">
	import { PUBLIC_DIRECTUS_URL } from '$env/static/public';

	import { page } from '$app/state';
	import Container from '../ui/Container.svelte';
	import LightSwitch from './LightSwitch.svelte';
	import { getPageLink } from '$lib/directus/directus-utils';
	import { base } from '$app/paths';

	const directusURL = PUBLIC_DIRECTUS_URL;

	const globals = $derived(page.data?.globals);
	const navPrimary = $derived(page.data?.footerNavigation);
	const currentLocale = $derived(page.params.lang || 'fr');

	const lightLogoUrl = $derived(
		globals?.logo ? `${directusURL}/assets/${globals.logo}` : '/images/logo.svg'
	);
	const darkLogoUrl = $derived(
		globals?.logo_dark_mode ? `${directusURL}/assets/${globals.logo_dark_mode}` : ''
	);
</script>

<footer
	class="bg-limestone-50 border-iron/5 dark:border-limestone-100/5 border-t-2 py-16 transition-colors duration-300 dark:bg-[#181719]"
>
	<Container class="text-iron dark:text-limestone-100">
		<div class="flex flex-col items-start justify-between gap-12 pt-8 md:flex-row">
			<div class="flex-1 space-y-4">
				<a href="{base}/" class="block transition-transform duration-300 hover:-translate-y-1">
					{#if lightLogoUrl}
						<img
							src={lightLogoUrl}
							alt="Logo"
							class={darkLogoUrl ? 'h-auto w-[120px] dark:hidden' : 'h-auto w-[120px]'}
						/>
					{/if}
					{#if darkLogoUrl}
						<img
							src={darkLogoUrl}
							alt="Logo (Dark Mode)"
							class="hidden h-auto w-[120px] dark:block"
						/>
					{/if}
				</a>
				{#if globals?.description}
					<p class="text-iron-muted dark:text-limestone-400 max-w-sm font-serif italic">
						{globals.description}
					</p>
				{/if}

				<!-- {/* Social Links */} -->
				{#if globals?.social_links}
					<div class="flex space-x-4 pt-2">
						{#each globals.social_links as social (social.service)}
							<a
								href={social.url}
								target="_blank"
								rel="noopener noreferrer"
								class="hover:text-primary transition-all duration-200 hover:-translate-y-1"
							>
								<img
									src={`/icons/social/${social.service === 'x' ? 'twitter' : social.service}.svg`}
									alt={`${social.service} icon`}
									width={24}
									height={24}
									class="size-6 opacity-80 hover:opacity-100 dark:invert"
								/>
							</a>
						{/each}
					</div>
				{/if}
			</div>

			<div class="flex flex-1 flex-col items-start md:items-end">
				<nav class="w-full text-left md:w-auto">
					<ul class="space-y-3">
						{#if navPrimary?.items}
							{#each navPrimary.items as group (group.id)}
								<li>
									{#if group.children && group.children.length > 0}
										<!-- Handle Group Headers if they are links -->
										<span class="font-heading text-lg font-bold">{group.title}</span>
									{:else if group.page}
										<a
											href={`${base}${getPageLink(group.page, currentLocale)}`}
											class="font-heading hover:text-primary text-lg font-bold decoration-2 underline-offset-4 transition-colors hover:underline"
										>
											{group.title}
										</a>
									{:else}
										<a
											href={group?.url?.startsWith('/') ? `${base}${group.url}` : group?.url || '#'}
											class="font-heading hover:text-primary text-lg font-bold decoration-2 underline-offset-4 transition-colors hover:underline"
										>
											{group.title}
										</a>
									{/if}
								</li>
							{/each}
						{/if}
						<li class="pt-4">
							<LightSwitch />
						</li>
					</ul>
				</nav>
			</div>
		</div>

		<div
			class="border-iron/10 dark:border-limestone-100/10 text-iron-muted/60 dark:text-limestone-400/50 mt-12 flex items-center justify-center border-t pt-8 text-xs font-bold tracking-widest uppercase md:justify-between"
		>
			<span>© {new Date().getFullYear()} Octets Computing.</span>
			<span class="hidden md:block">Fait avec passion.</span>
		</div>
	</Container>
</footer>
