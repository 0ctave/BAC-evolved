<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';
	import { fade, fly } from 'svelte/transition';
	import Headline from '../ui/Headline.svelte';
	import Tagline from '../ui/Tagline.svelte';
	import { Turnstile } from 'svelte-turnstile';
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';

	interface Props {
		data: {
			id: string;
			headline?: string;
			tagline?: string;
			intro_text?: string;
			label_pseudonyme?: string;
			placeholder_pseudonyme?: string;
			help_pseudonyme?: string;
			label_content?: string;
			placeholder_content?: string;
			button_submit?: string;
			button_loading?: string;
			msg_success_title?: string;
			msg_success_desc?: string;
			msg_already_submitted?: string;
			msg_already_submitted_desc?: string;
			msg_error_uuid?: string;
			msg_error_uuid_desc?: string;
			msg_error_min_content?: string;
			msg_error_min_pseudo?: string;
			button_home?: string;
		};
	}

	let { data }: Props = $props();
	const d = $derived(data);

	let uuid = $state<string | null>(null);
	let isValidating = $state(true);
	let isValid = $state(false);
	let alreadySubmitted = $state(false);
	let clientName = $state('');
	
	let content = $state('');
	let pseudonyme = $state('');
	let captchaToken = $state('');
	
	let isSubmitting = $state(false);
	let isSuccess = $state(false);
	let errorMessage = $state<string | null>(null);

	onMount(async () => {
		uuid = new URLSearchParams(window.location.search).get('uuid');
		
		if (!uuid) {
			isValidating = false;
			isValid = false;
			return;
		}

		try {
			const res = await fetch(`/api/reviews/submit?uuid=${uuid}`);
			const info = await res.json();
			
			if (info.valid) {
				isValid = true;
				alreadySubmitted = info.alreadySubmitted;
				clientName = info.clientName;
			} else {
				isValid = false;
			}
		} catch (e) {
			console.error('Failed to validate UUID', e);
			isValid = false;
		} finally {
			isValidating = false;
		}
	});

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		if (isSubmitting) return;

		if (content.length < 10) {
			errorMessage = d.msg_error_min_content || "Votre commentaire doit faire au moins 10 caractères.";
			return;
		}

		if (pseudonyme.length < 2) {
			errorMessage = d.msg_error_min_pseudo || "Votre pseudonyme doit faire au moins 2 caractères.";
			return;
		}

		if (!captchaToken) {
			errorMessage = "Veuillez valider la vérification de sécurité.";
			return;
		}

		isSubmitting = true;
		errorMessage = null;

		try {
			const res = await fetch('/api/reviews/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content, pseudonyme, uuid, captchaToken })
			});
			
			const result = await res.json();
			if (result.success) {
				isSuccess = true;
			} else {
				errorMessage = result.message || "Une erreur est survenue.";
				// Reset captcha on failure
				captchaToken = '';
			}
		} catch (e) {
			errorMessage = "Impossible d'envoyer votre avis pour le moment.";
		} finally {
			isSubmitting = false;
		}
	};
</script>

<div class="mx-auto max-w-2xl px-6 py-12 md:py-20">
	{#if isValidating}
		<div class="flex justify-center py-12">
			<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
		</div>
	{:else if !isValid}
		<div class="surface-atelier p-8 text-center" in:fade>
			<h2 class="heading-section text-2xl">{d.msg_error_uuid || "Lien invalide"}</h2>
			<p class="text-body mt-4">
				{d.msg_error_uuid_desc || "Ce lien d'invitation n'est pas valide ou a expiré."}
			</p>
			<a href="/" class="btn-atelier-outline mt-8 inline-block">{d.button_home || "Retour à l'accueil"}</a>
		</div>
	{:else if alreadySubmitted || isSuccess}
		<div class="surface-atelier p-8 text-center md:p-12" in:fly={{ y: 20, duration: 600 }}>
			<div class="mb-6 flex justify-center">
				<div class="bg-primary/10 rounded-full p-4">
					<svg class="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
			</div>
			<h2 class="heading-section mb-4">
				{isSuccess ? (d.msg_success_title || "Merci !") : (d.msg_already_submitted || "Merci !")} {clientName}
			</h2>
			<p class="text-body mb-8">
				{#if isSuccess}
					{d.msg_success_desc || "Votre avis a été envoyé avec succès."}
				{:else}
					{d.msg_already_submitted_desc || "Votre avis a déjà été enregistré. Merci de votre retour !"}
				{/if}
			</p>
			<a href="/" class="btn-atelier-outline">{d.button_home || "Retour à l'accueil"}</a>
		</div>
	{:else}
		<div class="mb-10 text-center">
			{#if d.tagline}
				<Tagline tagline={d.tagline} />
			{/if}
			{#if d.headline}
				<Headline headline={d.headline} class="heading-section !mb-0 text-4xl md:text-5xl" />
			{/if}
			<p class="text-body mt-4">
				{(d.intro_text || "Bonjour {name}, comment s'est déroulé votre séjour ?").replace('{name}', clientName)}
			</p>
		</div>

		<div class="surface-atelier p-8 md:p-12" in:fly={{ y: 30, duration: 800 }}>
			<form onsubmit={handleSubmit} class="space-y-8">
				<!-- Pseudonyme -->
				<div class="space-y-3">
					<label class="block font-heading text-lg font-bold text-iron dark:text-limestone-50" for="pseudonyme">
						{d.label_pseudonyme || "Comment souhaitez-vous apparaître ?"}
					</label>
					<input
						type="text"
						id="pseudonyme"
						bind:value={pseudonyme}
						placeholder={d.placeholder_pseudonyme || "Ex: Jean D. ou Voyageur Curieux"}
						class="input-atelier w-full"
						required
					/>
					{#if d.help_pseudonyme}
						<p class="text-xs text-iron-muted">{d.help_pseudonyme}</p>
					{/if}
				</div>

				<!-- Content -->
				<div class="space-y-3">
					<label class="block font-heading text-lg font-bold text-iron dark:text-limestone-50" for="content">
						{d.label_content || "Votre commentaire"}
					</label>
					<textarea
						id="content"
						bind:value={content}
						placeholder={d.placeholder_content || "Racontez-nous votre expérience..."}
						class="input-atelier min-h-[150px] w-full resize-none"
						required
					></textarea>
				</div>

				<div class="flex justify-center">
					<Turnstile 
						siteKey={PUBLIC_TURNSTILE_SITE_KEY} 
						on:turnstile-callback={(e) => captchaToken = e.detail.token}
						on:turnstile-error={() => captchaToken = ''}
						on:turnstile-timeout={() => captchaToken = ''}
						on:turnstile-expired={() => captchaToken = ''}
					/>
				</div>

				{#if errorMessage}
					<div class="bg-red-50 p-4 text-red-700" in:fade>
						{errorMessage}
					</div>
				{/if}

				<div class="pt-4">
					<button
						type="submit"
						disabled={isSubmitting || !captchaToken}
						class="btn-atelier w-full md:w-auto"
					>
						{#if isSubmitting}
							<span class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
							{d.button_loading || "Envoi en cours..."}
						{:else}
							{d.button_submit || "Publier mon avis"}
						{/if}
					</button>
				</div>
			</form>
		</div>
	{/if}
</div>

