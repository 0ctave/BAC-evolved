<script lang="ts">
	import { submitForm } from '$lib/directus/forms';
	import type { FormField } from '$lib/types/directus-schema';
	import { cn } from '$lib/utils';
	import { CheckCircle, AlertCircle, Mail } from '@lucide/svelte';
	import DynamicForm from './DynamicForm.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	interface FormBuilderProps {
		class?: string;
		form: {
			id: string;
			on_success?: 'redirect' | 'message' | null;
			sort?: number | null;
			submit_label?: string;
			success_message?: string | null;
			title?: string | null;
			success_redirect_url?: string | null;
			is_active?: boolean | null;
			fields: FormField[];
		};
	}

	const { form, class: className }: FormBuilderProps = $props();

	let isSubmitted = $state(false);
	let error = $state<string | null>(null);

	const handleSubmit = async (data: Record<string, any>) => {
		try {
			const fieldsWithNames = form.fields.map((field) => ({
				id: field.id,
				name: field.name || '',
				type: field.type || ''
			}));
			await submitForm(form.id, fieldsWithNames, data);

			if (form.on_success === 'redirect' && form.success_redirect_url) {
				if (form.success_redirect_url.startsWith('/')) {
					goto(`${base}${form.success_redirect_url}`);
				} else {
					window.location.href = form.success_redirect_url;
				}
			} else {
				isSubmitted = true;
			}
		} catch (err) {
			console.error('Error submitting form:', err);
			error = 'Une erreur est survenue. Veuillez réessayer.';
		}
	};
</script>

{#if form.is_active}
	{#if isSubmitted}
		<div
			class="animate-in fade-in zoom-in-95 flex flex-col items-center justify-center space-y-8 px-4 py-12 text-center duration-500"
		>
			<!-- Stamp Effect Circle -->
			<div class="relative flex h-24 w-24 items-center justify-center">
				<div
					class="border-primary absolute inset-0 animate-pulse rounded-full border-4 opacity-20"
				></div>
				<div
					class="bg-primary shadow-retro-primary border-iron flex h-20 w-20 items-center justify-center rounded-full border-2 text-white"
				>
					<Mail class="size-10" />
				</div>
				<!-- Checkmark Badge -->
				<div
					class="absolute -right-2 -bottom-2 rounded-full border-2 border-green-600 bg-white p-1 text-green-600 shadow-sm dark:bg-[#252426]"
				>
					<CheckCircle class="size-6 fill-current" />
				</div>
			</div>

			<div class="max-w-md space-y-4">
				<h3
					class="font-heading text-iron dark:text-limestone-50 text-3xl font-bold tracking-wide uppercase"
				>
					Bien reçu !
				</h3>
				<p
					class="text-iron-muted dark:text-limestone-300 font-serif text-xl leading-relaxed italic"
				>
					"{form.success_message ||
						'Votre message a bien été envoyé. Nous vous répondrons très vite.'}"
				</p>
			</div>

			<button
				onclick={() => (isSubmitted = false)}
				class="text-iron-muted hover:text-primary hover:border-primary border-b border-transparent text-xs font-bold tracking-widest uppercase transition-colors"
			>
				Envoyer un autre message
			</button>
		</div>
	{:else}
		<div class={cn('w-full', className)}>
			{#if error}
				<div
					class="mb-8 flex items-center gap-3 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-red-700 shadow-sm"
				>
					<AlertCircle class="size-5 shrink-0" />
					<p class="text-sm font-medium">{error}</p>
				</div>
			{/if}

			<!-- Intro text for the form -->
			<div class="mb-8 text-center md:text-left">
				<p class="text-iron-muted dark:text-limestone-400 font-serif text-lg italic">
					Remplissez ce formulaire comme un livre d'or.
				</p>
			</div>

			<DynamicForm
				fields={form.fields}
				onSubmit={handleSubmit}
				submitLabel={form.submit_label || 'Envoyer'}
				id={form.id}
			/>
		</div>
	{/if}
{/if}
