<script lang="ts">
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import { type Props, buttonVariants } from "$lib/components/ui/button/index.js";

	let {
		ref = $bindable(null),
		class: className,
		size = "icon",
		isActive = false,
		page,
		children,
		...restProps
	}: PaginationPrimitive.PageProps &
			Props & {
		isActive: boolean;
	} = $props();
</script>

{#snippet Fallback()}
	{page.value}
{/snippet}

<PaginationPrimitive.Page
		bind:ref
		{page}
		class={cn(
		buttonVariants({
			variant: isActive ? "default" : "ghost",
			size,
		}),
        // Atelier adjustments: Ensure font matches
        "font-heading font-bold text-sm",
        isActive ? "shadow-retro-sm border-primary" : "text-iron-muted dark:text-limestone-400",
		className
	)}
		children={children || Fallback}
		{...restProps}
/>