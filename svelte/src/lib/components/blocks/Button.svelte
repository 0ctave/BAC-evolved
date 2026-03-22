<script lang="ts">
	import { Icon as Icontype, ArrowLeft, ArrowRight, Plus } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import { page as pageStore } from '$app/state';
	import { getPageLink } from '$lib/directus/directus-utils';
	import {defaultLocale} from "$lib/i18n";

	export interface ButtonProps {
		id: string;
		label?: string | null;
		variant?: 'default' | 'outline' | 'ghost' | 'dark' | null;
		url?: string | null;
		type?: 'page' | 'post' | 'url' | 'submit' | null;
		page?: any; // Relaxed type to accept Directus relation object
		post?: { slug: string | null };
		size?: 'default' | 'sm' | 'lg' | 'icon';
		icon?: 'arrow' | 'plus' | 'arrow_left';
		customIcon?: typeof Icontype;
		iconPosition?: 'left' | 'right';
		class?: string;
		onClick?: () => void;
		disabled?: boolean;
		block?: boolean;
	}

	const {
		label,
		variant = 'default',
		url,
		type,
		page,
		post,
		size = 'default',
		icon,
		customIcon,
		iconPosition = 'left',
		class: className,
		onClick,
		disabled = false,
		block = false
	}: ButtonProps = $props();

	const icons: Record<string, typeof Icontype> = {
		arrow: ArrowRight,
		arrow_left: ArrowLeft,
		plus: Plus
	};

	const Icon = $derived(customIcon || (icon ? icons[icon] : null));

	const currentDbLocale = $derived(pageStore.data.locale || defaultLocale);

	const href = $derived.by(() => {
		let basePath = '';

		// 1. Resolve internal paths
		if (type === 'page' && page) {
			basePath = getPageLink(page, currentDbLocale);
		} else if (type === 'post' && post?.slug) {
			const blogPrefix = currentDbLocale === defaultLocale ? '/blog' : `/${currentDbLocale}/blog`;
			basePath = `${blogPrefix}/${post.slug}`;
		}

		// 2. If it's an internal link, check if the URL field has parameters to append
		if (basePath) {
			if (url) {
				// Automatically prefix with '?' if the user forgot it (unless it's an anchor link starting with '#')
				const prefix = url.startsWith('?') || url.startsWith('#') ? '' : '?';
				return `${basePath}${prefix}${url}`;
			}
			return basePath;
		}

		// 3. Fallback: Standard URL linking logic with locale protection
		if (url) {
			if (url.startsWith('/')) {
				if (currentDbLocale !== defaultLocale && !url.startsWith(`/${currentDbLocale}/`) && url !== `/${currentDbLocale}`) {
					return url === '/' ? `/${currentDbLocale}` : `/${currentDbLocale}${url}`;
				}
			}
			return url;
		}

		return undefined;
	});

	const buttonClasses = $derived(cn(
			variant === 'default' && 'btn-atelier-primary',
			variant === 'outline' && 'btn-atelier-outline',
			variant === 'ghost' && 'btn-atelier-ghost',
			variant === 'dark' && 'btn-atelier-dark',

			size === 'sm' && 'px-6 py-2 text-xs',
			size === 'lg' && 'px-12 py-5 text-base',
			size === 'icon' && 'h-12 w-12 p-0 flex items-center justify-center rounded-none',

			block && 'w-full flex',
			className
	));
</script>

{#snippet content()}
	<span class="flex items-center gap-3 relative z-10">
		{#if icon && iconPosition === 'left' && Icon}
			<Icon class="size-4 shrink-0" />
		{/if}

		{#if label}
			<span>{label}</span>
		{/if}

		{#if icon && iconPosition === 'right' && Icon}
			<Icon class="size-4 shrink-0" />
		{/if}
	</span>
{/snippet}

{#if href}
	<a {href} class={buttonClasses} onclick={onClick} target={href.startsWith('/') || href.startsWith('#') || href.startsWith('?') ? undefined : '_blank'} rel={href.startsWith('/') || href.startsWith('#') || href.startsWith('?') ? undefined : 'noopener noreferrer'}>
		{@render content()}
	</a>
{:else}
	<button type="submit" class={buttonClasses} {disabled} onclick={onClick}>
		{@render content()}
	</button>
{/if}