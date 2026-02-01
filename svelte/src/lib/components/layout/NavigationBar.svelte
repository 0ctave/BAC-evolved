<script lang="ts">
    import {page} from '$app/state';
    import Container from '$lib/components/ui/Container.svelte';
    import LightSwitch from './LightSwitch.svelte';
    import LanguageSwitch from './LanguageSwitch.svelte';
    import {PUBLIC_DIRECTUS_URL} from '$env/static/public';
    import {ChevronDown, Menu, X} from '@lucide/svelte';
    import setAttr from '$lib/directus/visualEditing';
    import {flatten, flattenTree, getNavUrl, getPageLink} from '$lib/directus/directus-utils';
    import {defaultLocale} from '$lib/i18n';
    import Button from "$lib/components/blocks/Button.svelte";
    import {cn} from '$lib/utils';
    import {slide} from 'svelte/transition';
    import type {NavigationItem} from "$lib/types/directus-schema";
    import {Collapsible} from "bits-ui";

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
    const navigationTree: NavigationItem[] = $derived(
        rawNavigation?.items
            ? flattenTree(rawNavigation.items, currentDbLocale)
            : []
    );

    // Separate the "Button" type item (CTA) from standard links
    const mainNavItems = $derived(navigationTree.filter((item: any) => item.type !== 'button'));
    const ctaItem = $derived(navigationTree.find((item: NavigationItem) => item.type === 'button'));

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

<svelte:window bind:scrollY/>

<header
        class={cn(
		"sticky top-0 z-50 w-full border-b-2 border-transparent transition-all duration-300 bg-limestone-50/95 dark:bg-[#181719]/95 backdrop-blur-md border-iron/5 shadow-sm"
	)}
>
    <Container class="relative">
        <nav class="flex h-20 items-center justify-between">
            <!-- Logo -->
            <a href="/" class="relative z-10 flex shrink-0 items-center gap-2" onclick={closeMenu}>
                <img
                        src={lightLogoUrl}
                        alt="Logo"
                        class="h-10 w-auto transition-all duration-300 dark:hidden"
                />
                {#if darkLogoUrl}
                    <img
                            src={darkLogoUrl}
                            alt="Logo Dark"
                            class="hidden h-10 w-auto transition-all duration-300 dark:block"
                    />
                {/if}
            </a>

            <!-- Desktop Navigation -->
            <div class="hidden items-center gap-8 lg:flex">
                {#each mainNavItems as item (item.id)}
                    {#if item.children && item.children.length > 0}
                        <!-- Desktop Dropdown Logic -->
                        <div class="relative group">
                            <button class="flex items-center gap-1 text-sm font-bold uppercase tracking-widest text-iron hover:text-primary dark:text-limestone-50 dark:hover:text-primary transition-colors">
                                {item.title}
                                <ChevronDown class="size-3 opacity-50"/>
                            </button>
                            <div class="absolute top-full left-0 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform -translate-y-2 group-hover:translate-y-0">
                                <div class="w-48 bg-white dark:bg-[#252426] border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] rounded-lg overflow-hidden py-2">
                                    {#each item.children as child}
                                        <a
                                                href={resolveUrl(child)}
                                                class="block px-4 py-2 text-sm font-medium text-iron dark:text-limestone-50 hover:bg-limestone-50 dark:hover:bg-iron-light hover:text-primary transition-colors"
                                        >
                                            {child.title}
                                        </a>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    {:else}
                        <a
                                use:setAttr={item}
                                href={resolveUrl(item)}
                                class="text-sm font-bold uppercase tracking-widest text-iron hover:text-primary dark:text-limestone-50 dark:hover:text-primary transition-colors"
                        >
                            {item.title}
                        </a>
                    {/if}
                {/each}

                <div class="flex items-center gap-4 border-l-2 border-iron/10 pl-8 dark:border-limestone-100/10">
                    <LightSwitch/>
                    <LanguageSwitch/>

                    <!-- Dynamic CTA Button (Desktop) -->
                    {#if ctaItem}
                        {@const
                            buttonData = typeof ctaItem.button === 'object' ? flatten(ctaItem.button, currentDbLocale) : null}
                        {#if buttonData}
                            <Button {...buttonData}/>
                        {/if}
                    {/if}
                </div>
            </div>

            <!-- Mobile Hamburger Toggle -->
            <div class="flex items-center gap-2 lg:hidden">
                <!-- Dynamic CTA Button (Mobile Header) - Hides completely when menu opens -->
                {#if ctaItem && !isOpen}
                    {@const
                        buttonData = typeof ctaItem.button === 'object' ? flatten(ctaItem.button, currentDbLocale) : null}
                    <div transition:slide={{ axis: 'x', duration: 300 }}>
                        {#if buttonData}
                            <Button {...buttonData}/>
                        {/if}
                    </div>
                {/if}

                <button
                        onclick={toggleMenu}
                        class="relative z-50 p-2 text-iron dark:text-limestone-50 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors"
                        aria-label="Toggle menu"
                >
                    {#if isOpen}
                        <X class="size-7"/>
                    {:else}
                        <Menu class="size-7"/>
                    {/if}
                </button>
            </div>
        </nav>
    </Container>

    <!-- Full Page Mobile Menu Overlay -->
    {#if isOpen}
        <div
                transition:slide={{ axis: 'y', duration: 400 }}
                class="absolute top-full left-0 w-full bg-limestone-50 dark:bg-[#181719] border-t-2 border-black/5 dark:border-white/10 shadow-2xl overflow-y-auto lg:hidden flex flex-col"
                style="height: calc(100vh - 5rem);"
        >
            <div class="container mx-auto px-6 py-8 flex flex-col flex-grow">


                <div class="flex flex-col gap-2">
                    {#each mainNavItems as item (item.id)}
                        {#if !item.children || item.children.length === 0}
                            <a
                                    use:setAttr={item}
                                    href={resolveUrl(item)}
                                    class="block w-full py-4 text-2xl font-heading font-bold text-iron dark:text-limestone-50 border-b border-iron/5 dark:border-limestone-100/5 hover:text-primary transition-colors"
                                    onclick={closeMenu}
                            >
                                {item.title}
                            </a>
                        {:else}
                            <Collapsible.Root class="w-full border-b border-iron/5 dark:border-limestone-100/5 py-4">
                                <Collapsible.Trigger
                                        class="flex w-full items-center justify-between text-2xl font-heading font-bold text-iron dark:text-limestone-50 hover:text-primary transition-colors group">
                                    {item.title}
                                    <ChevronDown
                                            class="size-5 text-iron-muted transition-transform duration-300 group-data-[state=open]:rotate-180"/>
                                </Collapsible.Trigger>
                                <Collapsible.Content transition={slide} class="overflow-hidden">
                                    <div class="flex flex-col gap-3 pt-4 pl-4 border-l-2 border-primary/20 ml-1 mt-2">
                                        {#each item.children as child}
                                            <a
                                                    use:setAttr={child}
                                                    href={resolveUrl(child)}
                                                    class="block text-lg font-medium text-iron/80 dark:text-limestone-300 hover:text-primary transition-colors"
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
                        {@const
                            buttonData = typeof ctaItem.button === 'object' ? flatten(ctaItem.button, currentDbLocale) : null}
                        {#if buttonData}
                            <Button {...buttonData} onClick={closeMenu} />
                        {/if}
                    {/if}
                </div>

                <!-- Mobile Footer Options (Pushed to bottom) -->
                <div class="mt-auto pt-8 border-t-2 border-black/5 dark:border-white/5 flex flex-col gap-6 pb-8">
                    <div class="flex items-center justify-between w-full">
                        <span class="text-sm font-bold uppercase tracking-widest text-iron-muted">Préférences</span>
                        <div class="flex items-center gap-6">
                            <LanguageSwitch/>
                            <LightSwitch/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</header>

<style>
    :global(body[style*="overflow: hidden"]) {
        padding-right: 0 !important;
        margin-right: 0 !important;
    }
</style>