<script lang="ts" module>
	import type { FormPath as _FormPath } from 'sveltekit-superforms';
	type T = Record<string, unknown>;
	type U = _FormPath<T>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>, U extends _FormPath<T>">
	import * as FormPrimitive from 'formsnap';
	import type { WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		form,
		name,
		...restProps
	}: WithoutChild<FormPrimitive.FieldsetProps<T, U>> = $props();
</script>

<FormPrimitive.Fieldset
	bind:ref
	{form}
	{name}
	class={cn('border-iron/5 dark:border-limestone-100/5 ml-1 space-y-4 border-l-2 pl-4', className)}
	{...restProps}
/>
