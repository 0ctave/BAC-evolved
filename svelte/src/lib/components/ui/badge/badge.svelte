<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';
	import { cva } from 'class-variance-authority';

	const badgeVariants = cva(
			'inline-flex items-center rounded-md border-2 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
			{
				variants: {
					variant: {
						default: 'border-primary bg-primary/10 text-primary',
						secondary: 'border-iron/10 bg-white dark:bg-[#252426] text-iron dark:text-limestone-100 hover:border-primary/50',
						destructive:
								'border-red-200 bg-red-50 text-red-600',
						outline: 'text-iron dark:text-limestone-100 border-iron/20'
					}
				},
				defaultVariants: {
					variant: 'default'
				}
			}
	);

	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
</script>

<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = 'default',
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
		this={href ? 'a' : 'span'}
		bind:this={ref}
		{href}
		class={cn(badgeVariants({ variant }), className)}
		{...restProps}
>
	{@render children?.()}
</svelte:element>