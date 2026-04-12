<script lang="ts">
	import { page } from '$app/state';
	import Container from '$lib/components/ui/Container.svelte';
	import LightSwitch from './LightSwitch.svelte';
	import LanguageSwitch from './LanguageSwitch.svelte';
	import { PUBLIC_DIRECTUS_URL } from '$env/static/public';
	import { ChevronDown, Menu, X } from '@lucide/svelte';
	import setAttr from '$lib/directus/visualEditing';
	import { flatten, flattenTree, getNavUrl, getPageLink } from '$lib/directus/directus-utils';
	import { defaultLocale } from '$lib/i18n';
	import Button from '$lib/components/blocks/Button.svelte';
	import { cn } from '$lib/utils';
	import { slide } from 'svelte/transition';
	import { Collapsible } from 'bits-ui';
	import { base } from '$app/paths';

	const globals = $derived(page.data.globals);
	const rawNavigation = $derived(page.data.headerNavigation);

	const directusURL = PUBLIC_DIRECTUS_URL;
	const lightLogoUrl = $derived(
		globals?.logo ? `${directusURL}/assets/${globals.logo}` : '/images/logo.svg'
	);
	const darkLogoUrl = $derived(
		globals?.logo_dark_mode ? `${directusURL}/assets/${globals.logo_dark_mode}` : ''
	);

	const currentDbLocale = $derived(page.data.locale || defaultLocale);

	// Transform flat navigation items into a tree structure
	const navigationTree: any[] = $derived(
		rawNavigation?.items ? flattenTree(rawNavigation.items, currentDbLocale) : []
	);

	// Separate the "Button" type item (CTA) from standard links
	const mainNavItems = $derived(navigationTree.filter((item: any) => item.type !== 'button'));
	const ctaItem = $derived(navigationTree.find((item: any) => item.type === 'button'));

	// Helper to resolve URL for any item
	const resolveUrl = (item: any) => {
		return item.page
			? getPageLink(item.page, currentDbLocale)
			: getNavUrl(item.url, currentDbLocale);
	};

	let scrollY = $state(0);
	let isOpen = $state(false);

	function toggleMenu() {
		isOpen = !isOpen;
	}

	function closeMenu() {
		isOpen = false;
	}
</script>

<svelte:window bind:scrollY />

<header
	class={cn(
		'bg-limestone-50/95 border-iron/5 sticky top-0 z-50 w-full border-b-2 border-transparent shadow-sm backdrop-blur-md transition-all duration-300 dark:bg-[#181719]/95'
	)}
>
	<Container class="relative">
		<nav class="flex h-30 items-center justify-between">
			<!-- Logo -->
			<a
				href={`${base}${getNavUrl('/', currentDbLocale)}`}
				class="relative z-10 flex shrink-0 items-center gap-2"
				onclick={closeMenu}
			>
				<img
					src={lightLogoUrl}
					alt="Logo"
					class="h-20 w-auto transition-all duration-300 dark:hidden"
				/>
				{#if darkLogoUrl}
					<img
						src={darkLogoUrl}
						alt="Logo Dark"
						class="hidden h-20 w-auto transition-all duration-300 dark:block"
					/>
				{/if}
			</a>

			<!-- Desktop Navigation -->
			<div class="hidden items-center gap-8 lg:flex">
				{#each mainNavItems as item (item.id)}
					{#if item.children && item.children.length > 0}
						<!-- Desktop Dropdown Logic -->
						<div class="group relative">
							<button
								class="text-iron hover:text-primary dark:text-limestone-50 dark:hover:text-primary flex items-center gap-1 text-sm font-bold tracking-widest uppercase transition-colors"
							>
								{item.title}
								<ChevronDown class="size-3 opacity-50" />
							</button>
							<div
								class="invisible absolute top-full left-0 -translate-y-2 transform pt-4 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
							>
								<div
									class="w-48 overflow-hidden rounded-lg border-2 border-black bg-white py-2 shadow-[4px_4px_0px_0px_#000] dark:border-white dark:bg-[#252426] dark:shadow-[4px_4px_0px_0px_#fff]"
								>
									{#each item.children as child (child.id)}
										<a
											href={`${base}${resolveUrl(child)}`}
											class="text-iron dark:text-limestone-50 hover:bg-limestone-50 dark:hover:bg-iron-light hover:text-primary block px-4 py-2 text-sm font-medium transition-colors"
										>
											{child.title}
										</a>
									{/each}
								</div>
							</div>
						</div>
					{:else}
						<a
							data-directus={setAttr({ collection: 'navigation_items', item: item.id })}
							href={`${base}${resolveUrl(item)}`}
							class="text-iron hover:text-primary dark:text-limestone-50 dark:hover:text-primary after:bg-primary relative text-sm font-bold tracking-widest uppercase transition-colors after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:transition-all after:duration-300 hover:after:w-full"
						>
							{item.title}
						</a>
					{/if}
				{/each}

				<div
					class="border-iron/10 dark:border-limestone-100/10 flex items-center gap-6 border-l-2 pl-8"
				>
					<LanguageSwitch />

					<!-- Dynamic CTA Button (Desktop) -->
					{#if ctaItem}
						{@const buttonData =
							typeof ctaItem.button === 'object' ? flatten(ctaItem.button, currentDbLocale) : null}
						{#if buttonData}
							<Button {...buttonData as any} />
						{/if}
					{/if}

					<LightSwitch />
				</div>
			</div>

			<!-- Mobile Hamburger Toggle -->
			<div class="flex items-center gap-2 lg:hidden">
				<!-- Dynamic CTA Button (Mobile Header) - Hides completely when menu opens -->

				<button
					onclick={toggleMenu}
					class="text-iron dark:text-limestone-50 relative z-50 rounded-md p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
					aria-label="Toggle menu"
				>
					{#if isOpen}
						<X class="size-7" />
					{:else}
						<Menu class="size-7" />
					{/if}
				</button>
			</div>
		</nav>
	</Container>

	<!-- Full Page Mobile Menu Overlay -->
	{#if isOpen}
		<div
			transition:slide={{ axis: 'y', duration: 400 }}
			class="bg-limestone-50 absolute top-full left-0 flex w-full flex-col overflow-y-auto border-t-2 border-black/5 shadow-2xl lg:hidden dark:border-white/10 dark:bg-[#181719]"
			style="height: calc(100vh - 5rem);"
		>
			<div class="container mx-auto flex flex-grow flex-col px-6 py-8">
				<div class="flex flex-col gap-2">
					{#each mainNavItems as item (item.id)}
						{#if !item.children || item.children.length === 0}
							<a
								data-directus={setAttr({ collection: 'navigation_items', item: item.id })}
								href={`${base}${resolveUrl(item)}`}
								class="font-heading text-iron dark:text-limestone-50 border-iron/5 dark:border-limestone-100/5 hover:text-primary block w-full border-b py-4 text-2xl font-bold transition-colors"
								onclick={closeMenu}
							>
								{item.title}
							</a>
						{:else}
							<Collapsible.Root
								class="border-iron/5 dark:border-limestone-100/5 w-full border-b py-4"
							>
								<Collapsible.Trigger
									class="font-heading text-iron dark:text-limestone-50 hover:text-primary group flex w-full items-center justify-between text-2xl font-bold transition-colors"
								>
									{item.title}
									<ChevronDown
										class="text-iron-muted size-5 transition-transform duration-300 group-data-[state=open]:rotate-180"
									/>
								</Collapsible.Trigger>
								<!-- @ts-ignore -->
								<Collapsible.Content {...{ transition: slide }} class="overflow-hidden">
									<div class="border-primary/20 mt-2 ml-1 flex flex-col gap-3 border-l-2 pt-4 pl-4">
										{#each item.children as child (child.id)}
											<a
												data-directus={setAttr({ collection: 'navigation_items', item: child.id })}
												href={`${base}${resolveUrl(child)}`}
												class="text-iron/80 dark:text-limestone-300 hover:text-primary block text-lg font-medium transition-colors"
												onclick={closeMenu}
											>
												{child.title}
											</a>
										{/each}
									</div>
								</Collapsible.Content>
							</Collapsible.Root>
						{/if}
					{/each}

					<!-- Dynamic CTA Link inside Menu -->
					{#if ctaItem}
						{@const buttonData =
							typeof ctaItem.button === 'object' ? flatten(ctaItem.button, currentDbLocale) : null}
						{#if buttonData}
							<Button {...buttonData as any} onClick={closeMenu} />
						{/if}
					{/if}
				</div>

				<!-- Mobile Footer Options (Pushed to bottom) -->
				<div
					class="mt-auto flex flex-col gap-6 border-t-2 border-black/5 pt-8 pb-8 dark:border-white/5"
				>
					<div class="flex w-full items-center justify-between">
						<span class="text-iron-muted text-sm font-bold tracking-widest uppercase"
							>Préférences</span
						>
						<div class="flex items-center gap-6">
							<LanguageSwitch />
							<LightSwitch />
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</header>

<style>
	:global(body[style*='overflow: hidden']) {
		padding-right: 0 !important;
		margin-right: 0 !important;
	}
</style>
