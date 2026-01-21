<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { page } from '$app/state';
	import Container from '$lib/components/ui/Container.svelte';
	import SearchModal from '../ui/SearchModal.svelte';
	import LightSwitch from './LightSwitch.svelte';
	import LanguageSwitch from './LanguageSwitch.svelte';
	import { PUBLIC_DIRECTUS_URL } from '$env/static/public';
	import { ChevronDown, Menu } from '@lucide/svelte';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import setAttr from '$lib/directus/visualEditing';
	import { getPageLink, getNavUrl, flattenTree, flatten } from '$lib/directus/directus-utils';
	import { defaultLocale } from '$lib/i18n';
	import Button from "$lib/components/blocks/Button.svelte";

	const globals = $derived(page.data.globals);
	const rawNavigation = $derived(page.data.headerNavigation);

	const directusURL = PUBLIC_DIRECTUS_URL;
	const lightLogoUrl = $derived(
			globals?.logo ? `${directusURL}/assets/${globals.logo}` : '/images/logo.svg'
	);
	const darkLogoUrl = $derived(
			globals?.logo_dark_mode ? `${directusURL}/assets/${globals.logo_dark_mode}` : ''
	);

	const currentSlug = $derived(page.data.langSlug || defaultLocale);
	const currentDbLocale = $derived(page.data.locale || defaultLocale);

	const navItems = $derived(
			rawNavigation?.items
					? flattenTree(rawNavigation.items, currentDbLocale)
					: []
	);
</script>

<header
		class="bg-limestone-50/90 dark:bg-[#181719]/90 backdrop-blur-md border-b-2 border-iron/5 dark:border-limestone-100/5 font-heading text-iron dark:text-limestone-100 sticky top-0 z-50 w-full transition-colors duration-300"
>
	<Container class="flex items-center justify-between p-4">
		<a
				href={currentSlug === defaultLocale ? '/' : `/${currentSlug}`}
				class="flex-shrink-0 transition-transform hover:scale-105 duration-300"
		>
			<img
					src={lightLogoUrl}
					alt="Logo"
					width="260"
					height="120"
					class="h-auto w-[180px] sm:w-[260px] dark:hidden"
			/>
			<img
					src={darkLogoUrl || lightLogoUrl}
					alt="Logo"
					width="260"
					height="120"
					class="hidden h-auto w-[180px] sm:w-[260px] dark:block"
			/>
		</a>
		<nav class="flex items-center gap-6">
			<!-- DESKTOP MENU -->
			<div
					class=" hidden gap-6 md:flex"
					data-directus={rawNavigation
					? setAttr({
							collection: 'navigation',
							item: rawNavigation.id,
							fields: ['items'],
							mode: 'modal'
						})
					: undefined}
			>
				{#each navItems as item (item.id)}
					{#if item.children.length === 0}
						{#if item.type === 'button' && item.button}
							<!-- Flatten button data so label and other translated fields are accessible -->
							{@const buttonData = typeof item.button === 'object' ? flatten(item.button, currentDbLocale) : null}
							{#if buttonData}
								<Button {...buttonData} />
							{/if}
						{:else}
							<a
									href={item.page
								? getPageLink(item.page, currentDbLocale)
								: getNavUrl(item.url, currentDbLocale)}
									class="flex items-center
										font-heading font-bold text-sm uppercase tracking-widest
										text-iron dark:text-limestone-100
										hover:text-primary transition-colors
										border-b-2 border-transparent hover:border-primary
										border-t-transparent
										py-1
									"
							>
								{item.title}
							</a>
						{/if}

					{:else}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger
									class="data-[active]:text-primary data-[state=open]:text-primary hover:text-primary focus:text-primary group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-2 py-2 font-heading font-bold text-sm uppercase tracking-widest transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50"
							>{item.title}
								<ChevronDown
										class="relative top-[1px] ml-1 size-3 transition duration-200 group-data-[state=open]:rotate-180"
								/>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content
									class="bg-white dark:bg-[#252426] border-2 border-iron/10 dark:border-limestone-100/10 shadow-retro dark:shadow-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 top-full z-50 w-56 rounded-lg p-2"
							>
								{#each item.children as child}
									<DropdownMenu.Item
											class="focus:bg-limestone-50 dark:focus:bg-iron-light/30 rounded-md cursor-pointer"
									>
										<a
												class="hover:text-primary w-full block font-sans font-medium px-2 py-1"
												href={child.page
												? getPageLink(child.page, currentDbLocale)
												: getNavUrl(child.url, currentDbLocale)}>{child.title}</a
										>
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					{/if}
				{/each}
			</div>

			<!-- DESKTOP UTILITIES (Hidden on mobile) -->
			<div
					class="hidden md:flex items-center gap-4 border-l border-iron/10 dark:border-limestone-100/10 pl-4 ml-2"
			>
				<LanguageSwitch />
				<LightSwitch />
			</div>

			<!-- MOBILE MENU -->
			<div class="flex md:hidden items-center gap-4">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
							aria-label="Navigation Menu"
							class="p-2 border-2 border-iron/10 rounded-lg hover:bg-white dark:hover:bg-iron-light transition-colors"
					>
						<Menu class="size-6" />
					</DropdownMenu.Trigger>

					<!--
                        FIX:
                        1. Used 'w-[280px]' instead of 'w-[90vw]' to be safe on small screens like iPhone SE (320px).
                        2. Added 'mr-2' for spacing from edge.
                    -->
					<DropdownMenu.Content
							forceMount
							align="end"
							sideOffset={8}
							class="bg-white dark:bg-[#252426] border-2 border-iron/10 dark:border-limestone-100/10 shadow-retro dark:shadow-black/50 z-50 w-[280px] overflow-hidden rounded-xl p-5 mr-2"
					>
						{#snippet child({ wrapperProps, props, open })}
							{#if open}
								<div {...wrapperProps}>
									<div {...props}>
										<div class="flex flex-col gap-6">
											{#each navItems as item (item.id)}
												{#if item.children.length === 0}
													<DropdownMenu.Item class="!bg-transparent p-0 "
													>
														{#if item.type === 'button' && item.button}
															{@const buttonData = typeof item.button === 'object' ? flatten(item.button, currentDbLocale) : null}
															{#if buttonData}
																<Button {...buttonData} block />
															{/if}
														{:else}
															<a
																	href={item.page
																? getPageLink(item.page, currentDbLocale)
																: getNavUrl(item.url, currentDbLocale)}
																	class="font-heading font-bold text-xl text-iron dark:text-limestone-50 hover:text-primary transition-colors"
															>
																{item.title}</a
															>
														{/if}
													</DropdownMenu.Item
													>
												{:else}
													<Collapsible.Root>
														<Collapsible.Trigger
																class="font-heading font-bold text-xl text-iron dark:text-limestone-50 hover:text-primary group flex w-full items-center justify-between text-left"
														>
															{item.title}
															<ChevronDown
																	class="ml-1 size-5 transition-transform duration-200 group-data-[state=open]:rotate-180"
															/>
														</Collapsible.Trigger>
														<Collapsible.Content>
															<div
																	class="ml-4 mt-4 flex flex-col gap-3 border-l-2 border-primary/20 pl-4"
															>
																{#each item.children as child (child.id)}
																	<a
																			class="font-sans font-medium text-lg text-iron-muted dark:text-limestone-300 hover:text-primary"
																			href={child.page
																			? getPageLink(child.page, currentDbLocale)
																			: getNavUrl(child.url, currentDbLocale)}>{child.title}</a
																	>
																{/each}
															</div>
														</Collapsible.Content>
													</Collapsible.Root>
												{/if}
											{/each}
											<div
													class="pt-6 mt-6 border-t border-iron/10 dark:border-limestone-100/10 flex flex-col gap-4"
											>
												<span
														class="text-sm font-bold uppercase tracking-widest text-iron-muted"
												>Options</span
												>
												<!-- Grouped options for mobile -->
												<div class="flex items-center justify-between flex-wrap gap-y-4">
													<div class="flex gap-4">
														<SearchModal />
														<LightSwitch />
													</div>
													<LanguageSwitch />
												</div>
											</div>
										</div>
									</div>
								</div>
							{/if}
						{/snippet}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</nav>
	</Container>
</header>

<!--
    FIX: Global override for body padding/margin issues caused by ScrollLock mechanisms
    in component libraries (like radix-ui/bits-ui) on mobile devices.
    This forces the body to stay clean even if the library tries to add scrollbar compensation.
-->
<style>
	:global(body[style*="overflow: hidden"]) {
		padding-right: 0 !important;
		margin-right: 0 !important;
		/* --scrollbar-width: 0px !important; Optional if library uses var */
	}
</style>