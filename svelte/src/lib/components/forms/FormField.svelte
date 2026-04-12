<script lang="ts">
	import type { FormField as FormFieldType } from '$lib/types/directus-schema';
	import { Checkbox } from '../ui/checkbox';
	import CheckBoxGroup from './fields/CheckBoxGroupField.svelte';
	import RadioGroup from './fields/RadioGroup.svelte';
	import SelectField from './fields/SelectField.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import type { SuperForm } from 'sveltekit-superforms';
	import FileUploadField from './fields/FileUploadField.svelte';
	import { cn } from '$lib/utils';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Info } from '@lucide/svelte';
	import { Label } from '$lib/components/ui/label/index.js';

	interface FieldProps {
		field: FormFieldType & Record<string, any>;
		form: SuperForm<any>;
	}

	const { field, form }: FieldProps = $props();
	const { errors } = $derived(form);
	const fieldName = $derived(field.name as string);
	const formData = $derived(form.form);

	const widthClass = $derived(
		field.width
			? {
					100: 'flex-[100%]',
					50: 'flex-[calc(50%-1.5rem)]',
					67: 'flex-[calc(67%-1.5rem)]',
					33: 'flex-[calc(33%-1.5rem)]'
				}[field.width] || 'flex-[100%]'
			: 'flex-[100%]'
	);

	// ATELIER INPUT STYLE
	const inputClass =
		'w-full bg-transparent border-b-2 border-iron/20 dark:border-limestone-100/20 px-0 py-3 text-lg font-medium text-iron dark:text-limestone-50 outline-none transition-all duration-300 placeholder:text-iron-muted/40 dark:placeholder:text-limestone-400/40 focus:border-primary focus:bg-limestone-50/30 dark:focus:bg-iron-light/10';
</script>

{#if field.type !== 'hidden'}
	<div class={`flex flex-shrink-0 flex-col justify-end ${widthClass} mb-4`}>
		<Form.Field {form} name={field.name!}>
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label
						for={field.name}
						class={cn(
							'text-iron-muted dark:text-limestone-400 mb-1 flex items-center justify-between text-xs font-bold tracking-widest uppercase',
							field.type === 'checkbox' || field.type === 'radio' ? 'mb-2' : ''
						)}
					>
						<div class="flex items-center space-x-1">
							{#if field.type !== 'checkbox'}
								{field.label}
							{/if}
							{#if field.help}
								<Tooltip.Provider>
									<Tooltip.Root>
										<Tooltip.Trigger>
											<Info class="text-primary ml-1 size-3 cursor-pointer" />
										</Tooltip.Trigger>
										<Tooltip.Content class="bg-iron rounded p-2 text-xs text-white">
											{field.help}
										</Tooltip.Content>
									</Tooltip.Root>
								</Tooltip.Provider>
							{/if}
						</div>
						{#if field.required}
							<span class="text-primary text-[10px]">*</span>
						{/if}
					</Form.Label>

					{#if field.type === 'text'}
						<!-- Native input with Atelier styling -->
						<input
							{...props}
							placeholder={field.placeholder || '...'}
							name={field.name || ''}
							bind:value={$formData[field.name!]}
							type={field.validation?.includes('email') ? 'email' : 'text'}
							class={inputClass}
						/>
					{:else if field.type === 'textarea'}
						<textarea
							{...props}
							placeholder={field.placeholder || '...'}
							name={field.name || ''}
							bind:value={$formData[field.name!]}
							required={field.required}
							class={cn(inputClass, 'min-h-[100px] resize-y')}
						></textarea>
					{:else if field.type === 'checkbox'}
						<div class="flex items-center space-x-3 py-2">
							<Checkbox
								{...props}
								name={field.name}
								bind:checked={$formData[field.name!]}
								required={!!field.required}
								class="border-iron/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary border-2"
							/>
							<Label
								for={field.name}
								class="text-iron dark:text-limestone-100 cursor-pointer font-medium"
								>{field.label}</Label
							>
						</div>
					{:else if field.type === 'checkbox_group'}
						<CheckBoxGroup name={field.name || ''} options={(field.choices as any) || []} {form} />
					{:else if field.type === 'select'}
						<SelectField name={field.name || ''} options={(field.choices as any) || []} {form} />
					{:else if field.type === 'radio'}
						<RadioGroup name={field.name || ''} options={(field.choices as any) || []} {form} />
					{:else if field.type === 'file'}
						<FileUploadField name={field.name || ''} {form} />
					{:else}
						<p class="text-xs text-red-500">Unknown field type: {field.type}</p>
					{/if}
				{/snippet}
			</Form.Control>

			{#if $errors[fieldName]}
				<Form.FieldErrors class="mt-1">
					{#each $errors[fieldName] as any as error (error)}
						<p class="text-xs font-bold tracking-wide text-red-500 uppercase">{error}</p>
					{/each}
				</Form.FieldErrors>
			{/if}
		</Form.Field>
	</div>
{/if}
