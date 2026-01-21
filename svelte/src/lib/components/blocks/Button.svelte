<script lang="ts">
	import { Icon as Icontype, ArrowLeft, ArrowRight, Plus } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import { page as pageStore } from '$app/state';
	import { getPageLink } from '$lib/directus/directus-utils';

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

	const Icon = $state(customIcon || (icon ? icons[icon] : null));

	// Get current locale
	const currentLocale = $derived(pageStore.params.lang || 'fr');

	const href = $derived.by(() => {
		if (type === 'page' && page) {
			return getPageLink(page, currentLocale);
		}
		if (type === 'post' && post?.slug) {
			const blogPrefix = currentLocale === 'fr' ? '/blog' : `/${currentLocale}/blog`;
			return `${blogPrefix}/${post.slug}`;
		}
		return url || undefined;
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
	<a {href} class={buttonClasses} onclick={onClick} target={href.startsWith('/') ? undefined : '_blank'} rel={href.startsWith('/') ? undefined : 'noopener noreferrer'}>
		{@render content()}
	</a>
{:else}
	<button type="submit" class={buttonClasses} {disabled} onclick={onClick}>
		{@render content()}
	</button>
{/if}