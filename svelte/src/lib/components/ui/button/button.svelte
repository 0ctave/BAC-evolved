<script lang="ts" module>
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { type VariantProps, tv } from 'tailwind-variants';
	import { cva } from 'class-variance-authority';

	export const buttonVariants = cva(
			'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-2 active:translate-y-0.5',
			{
				variants: {
					variant: {
						default: 'bg-primary text-white border-primary shadow-retro-sm hover:shadow-retro hover:-translate-y-0.5 hover:bg-primary/90',
						destructive: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300 shadow-retro-sm',
						outline: 'bg-transparent border-iron/10 dark:border-limestone-100/20 text-iron dark:text-limestone-100 hover:border-primary hover:text-primary hover:shadow-retro-sm',
						secondary: 'bg-white dark:bg-[#252426] text-iron dark:text-limestone-100 border-iron/10 dark:border-limestone-100/10 shadow-retro-sm hover:shadow-retro hover:-translate-y-0.5',
						ghost: 'border-transparent hover:bg-limestone-50 dark:hover:bg-iron-light text-iron-muted hover:text-primary',
						link: 'text-primary underline-offset-4 hover:underline border-none p-0 h-auto'
					},
					size: {
						default: 'h-11 px-6 py-2',
						sm: 'h-9 rounded-md px-4 text-xs',
						lg: 'h-14 rounded-xl px-10 text-base',
						icon: 'size-10'
					},
					block: {
						true: 'w-full'
					}
				},
				defaultVariants: {
					variant: 'default',
					size: 'default'
				}
			}
	);

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
			WithElementRef<HTMLAnchorAttributes> & {
		variant?: ButtonVariant;
		size?: ButtonSize;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';

	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a bind:this={ref} class={cn(buttonVariants({ variant, size }), className)} {href} {...restProps}>
		{@render children?.()}
	</a>
{:else}
	<button
			bind:this={ref}
			class={cn(buttonVariants({ variant, size }), className)}
			{type}
			{...restProps}
	>
		{@render children?.()}
	</button>
{/if}