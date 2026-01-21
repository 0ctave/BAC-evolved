<script lang="ts">
	import { submitForm } from '$lib/directus/forms';
	import type { FormField } from '$lib/types/directus-schema';
	import { cn } from '$lib/utils';
	import { CheckCircle, AlertCircle, Mail } from '@lucide/svelte';
	import DynamicForm from './DynamicForm.svelte';
	import { goto } from '$app/navigation';

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
					goto(form.success_redirect_url);
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
		<div class="flex flex-col items-center justify-center space-y-8 py-12 px-4 text-center animate-in fade-in zoom-in-95 duration-500">
			<!-- Stamp Effect Circle -->
			<div class="relative w-24 h-24 flex items-center justify-center">
				<div class="absolute inset-0 border-4 border-primary rounded-full opacity-20 animate-pulse"></div>
				<div class="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center shadow-retro-primary border-2 border-iron">
					<Mail class="size-10" />
				</div>
				<!-- Checkmark Badge -->
				<div class="absolute -bottom-2 -right-2 bg-white dark:bg-[#252426] text-green-600 rounded-full p-1 border-2 border-green-600 shadow-sm">
					<CheckCircle class="size-6 fill-current" />
				</div>
			</div>

			<div class="space-y-4 max-w-md">
				<h3 class="font-heading font-bold text-3xl text-iron dark:text-limestone-50 uppercase tracking-wide">Bien reçu !</h3>
				<p class="text-iron-muted dark:text-limestone-300 font-serif italic text-xl leading-relaxed">
					"{form.success_message || 'Votre message a bien été envoyé. Nous vous répondrons très vite.'}"
				</p>
			</div>

			<button onclick={() => isSubmitted = false} class="text-xs font-bold uppercase tracking-widest text-iron-muted hover:text-primary transition-colors border-b border-transparent hover:border-primary">
				Envoyer un autre message
			</button>
		</div>
	{:else}
		<div class={cn('w-full', className)}>
			{#if error}
				<div class="mb-8 rounded-lg bg-red-50 border-l-4 border-red-500 p-4 text-red-700 flex items-center gap-3 shadow-sm">
					<AlertCircle class="size-5 shrink-0" />
					<p class="text-sm font-medium">{error}</p>
				</div>
			{/if}

			<!-- Intro text for the form -->
			<div class="mb-8 text-center md:text-left">
				<p class="font-serif italic text-iron-muted dark:text-limestone-400 text-lg">
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