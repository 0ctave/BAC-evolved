<script lang="ts">
	import { untrack } from 'svelte';
	import setAttr from '$lib/directus/visualEditing';
	import type { FormField as FormFieldType } from '$lib/types/directus-schema';
	import { buildZodSchema } from '$lib/zodSchemaBuilder';
	import Button from '../blocks/Button.svelte';
	import Field from './FormField.svelte';
	import { superForm } from 'sveltekit-superforms';	// import SuperDebug from 'sveltekit-superforms';

	import { zodClient } from 'sveltekit-superforms/adapters';

	interface DynamicFormProps {
		fields: FormFieldType[];
		onSubmit: (data: Record<string, any>) => void;
		submitLabel: string;
		id: string;
	}

	const { fields, onSubmit, submitLabel, id }: DynamicFormProps = $props();

	const sortedFields = $derived([...fields].sort((a, b) => (a.sort || 0) - (b.sort || 0)));

	const { formSchema, defaultValues } = untrack(() => {
		const schema = buildZodSchema(fields);
		const defaults = fields.reduce<Record<string, any>>((defaults, field) => {
			if (!field.name) return defaults;
			switch (field.type) {
				case 'checkbox':
					defaults[field.name] = false;
					break;
				case 'checkbox_group':
					defaults[field.name] = [];
					break;
				case 'radio':
					defaults[field.name] = '';
					break;
				default:
					defaults[field.name] = '';
					break;
			}
			return defaults;
		}, {});
		return { formSchema: schema, defaultValues: defaults };
	});

	const form = superForm(defaultValues, {
		validators: zodClient(formSchema),
		SPA: true
	});

	const { enhance, submit, form: formData, errors, validateForm } = $derived(form);

	const onsubmit = async (e: Event) => {
		e.preventDefault();
		const f = await validateForm();
		$errors = f.errors;
		if (f.valid) {
			onSubmit($formData);
		}
	};
</script>

<form
		class="flex flex-wrap gap-x-8 gap-y-4 w-full"
		{onsubmit}
		data-directus={setAttr({
		collection: 'forms',
		item: id,
		fields: 'fields',
		mode: 'popover'
	})}
>
	{#each sortedFields as field (field.id)}
		<Field {field} {form} />
	{/each}

	<div class="w-full mt-10 flex justify-end border-t-2 border-iron/5 dark:border-limestone-100/5 pt-8">
		<div
				class="w-full md:w-auto"
				data-directus={setAttr({
				collection: 'forms',
				item: id,
				fields: 'submit_label',
				mode: 'popover'
			})}
		>
			<Button
					type="submit"
					icon="arrow"
					label={submitLabel}
					iconPosition="right"
					variant="default"
					size="lg"
					class="w-full md:w-auto shadow-retro-primary hover:shadow-retro-hover transition-all duration-300 transform hover:-translate-y-1"
					id={`submit-${submitLabel.replace(/\s+/g, '-').toLowerCase()}`}
			></Button>
		</div>
	</div>
</form>