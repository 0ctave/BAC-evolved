<script lang="ts">
    import type { Separator as SeparatorPrimitive } from 'bits-ui';
    import { Separator } from '$lib/components/ui/separator/index.js';
    import { cn } from '$lib/utils.js';

    let {
        ref = $bindable(null),
        class: className,
        ...restProps
    }: SeparatorPrimitive.RootProps = $props();
</script>

<Separator bind:ref class={cn('bg-iron/10 dark:bg-limestone-100/10 -mx-1 my-1 h-[2px]', className)} {...restProps} />