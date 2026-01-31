<script lang="ts">
	import { booking } from '$lib/logic/booking.svelte';
	import { fly, slide } from 'svelte/transition';
	import { TelInput, normalizedCountries } from 'svelte-tel-input';
	import type { DetailedValue, CountryCode, E164Number } from 'svelte-tel-input/types';
	import { page } from '$app/state';

	// --- Local State ---
	let selectedCountry: CountryCode | null = $state('FR');
	let detailedValue: DetailedValue | null = $state(null);

	let value: E164Number | null = $state(booking.customer.telephone ?? '');

	let valid = $state(true); // Internal validity from TelInput

	// Touched states: we only show errors after the user has interacted with a field
	let touched = $state({
		prenom: false,
		nom: false,
		email: false,
		telephone: false
	});

	// --- Dynamic Data from Directus (via Page Data) ---
	const availableLanguages = $derived(page.data.languages || []);
	const currentDbLocale = $derived(page.data.locale || 'fr-FR');
	// Translations
	const l = $derived(booking.labels);

	// --- Effects ---

	// 1. Listen for global validation trigger
	$effect(() => {
		if (booking.validationTrigger > 0) {
			touched.prenom = true;
			touched.nom = true;
			touched.email = true;
			touched.telephone = true;
		}
	});

	// 2. Listen for reset trigger
	$effect(() => {
		if (booking.resetTrigger > 0) {
			touched.prenom = false;
			touched.nom = false;
			touched.email = false;
			touched.telephone = false;
		}
	});

	// 3. Sync Phone validity
	$effect(() => {
		const isStrictlyValid = detailedValue?.isValid ?? valid;
		const hasContent = value !== null && value !== '' && value.length > 3;
		booking.customer.isPhoneValid = isStrictlyValid && hasContent;
		if (value !== null) {
			booking.customer.telephone = value;
		}
	});

	// 4. Set Default Locale
	$effect(() => {
		if (booking.customer.langue === 'fr-FR' && currentDbLocale && currentDbLocale !== 'fr-FR') {
			booking.customer.langue = currentDbLocale;
			const localeParts = currentDbLocale.split('-');
			if (localeParts.length > 1) {
				const countryCode = localeParts[1].toUpperCase() as CountryCode;
				if (normalizedCountries.find(c => c.iso2 === countryCode)) {
					selectedCountry = countryCode;
				}
			}
		}
	});

	// --- Helpers ---
	function handleBlur(field: keyof typeof touched) {
		touched[field] = true;
	}

	function showError(field: keyof typeof touched) {
		return touched[field] && booking.errors.customer[field] !== null;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		touched.prenom = true;
		touched.nom = true;
		touched.email = true;
		touched.telephone = true;
		if (booking.canGoNext) {
			booking.nextStep();
		}
	}
</script>

<svelte:head>
	<link
			rel="stylesheet"
			href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/css/flag-icons.min.css"
	/>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 sm:px-6">
	<!-- Header Section -->
	<div class="text-center mb-10" in:fly={{ y: -20, duration: 500 }}>
		<h2 class="heading-section text-center italic">
			{l.customer_title}
		</h2>
		<p class="text-body text-center italic mt-2">
			{l.customer_desc}
		</p>
	</div>

	<form class="space-y-6" onsubmit={handleSubmit}>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Prénom -->
			<div class="group" in:fly={{ y: 20, duration: 500, delay: 100 }}>
				<label
						for="prenom"
						class="block text-sm font-medium text-iron/80 dark:text-limestone-300 mb-2 transition-colors duration-300 group-focus-within:text-primary"
				>
					{l.customer_firstname} <span class="text-primary">*</span>
				</label>
				<div class="relative">
					<input
							id="prenom"
							type="text"
							bind:value={booking.customer.prenom}
							onblur={() => handleBlur('prenom')}
							placeholder="Jean"
							class="input-atelier w-full
						{showError('prenom') ? '!border-red-500 !bg-red-50/10' : ''}"
					/>
					{#if showError('prenom')}
						<div transition:slide={{ duration: 200 }} class="mt-1 text-xs text-red-500 font-medium">
							{booking.errors.customer.prenom}
						</div>
					{/if}
				</div>
			</div>

			<!-- Nom -->
			<div class="group" in:fly={{ y: 20, duration: 500, delay: 150 }}>
				<label
						for="nom"
						class="block text-sm font-medium text-iron/80 dark:text-limestone-300 mb-2 transition-colors duration-300 group-focus-within:text-primary"
				>
					{l.customer_lastname} <span class="text-primary">*</span>
				</label>
				<div class="relative">
					<input
							id="nom"
							type="text"
							bind:value={booking.customer.nom}
							onblur={() => handleBlur('nom')}
							placeholder="Dupont"
							class="input-atelier w-full
						{showError('nom') ? '!border-red-500 !bg-red-50/10' : ''}"
					/>
					{#if showError('nom')}
						<div transition:slide={{ duration: 200 }} class="mt-1 text-xs text-red-500 font-medium">
							{booking.errors.customer.nom}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Email -->
		<div class="group" in:fly={{ y: 20, duration: 500, delay: 200 }}>
			<label
					for="email"
					class="block text-sm font-medium text-iron/80 dark:text-limestone-300 mb-2 transition-colors duration-300 group-focus-within:text-primary"
			>
				{l.customer_email} <span class="text-primary">*</span>
			</label>
			<div class="relative">
				<input
						id="email"
						type="email"
						bind:value={booking.customer.email}
						onblur={() => handleBlur('email')}
						placeholder="jean.dupont@exemple.com"
						class="input-atelier w-full pr-10
					{showError('email') ? '!border-red-500 !bg-red-50/10' : ''}"
				/>
				<div class="absolute inset-y-0 right-2 flex items-center pointer-events-none">
					{#if !booking.errors.customer.email && booking.customer.email.length > 0}
						<svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
					{:else if showError('email')}
						<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
					{/if}
				</div>

				{#if showError('email')}
					<div transition:slide={{ duration: 200 }} class="mt-1 text-xs text-red-500 font-medium">
						{booking.errors.customer.email}
					</div>
				{/if}
			</div>
		</div>

		<!-- Téléphone -->
		<div class="group" in:fly={{ y: 20, duration: 500, delay: 250 }}>
			<label
					for="telephone"
					class="block text-sm font-medium text-iron/80 dark:text-limestone-300 mb-2 transition-colors duration-300 group-focus-within:text-primary"
			>
				{l.customer_phone} <span class="text-primary">*</span>
			</label>

			<div class="relative w-full">
				<div
						class="flex items-stretch w-full transition-all duration-200 overflow-hidden
                    border-b-2
					{showError('telephone')
						? 'border-red-500 bg-red-50/10'
						: 'border-black/20 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40 focus-within:!border-primary focus-within:bg-limestone-50/50 dark:focus-within:bg-iron-light/20'}"
				>
					<div class="relative flex items-center w-[90px] flex-shrink-0 cursor-pointer">
						<div class="flex items-center justify-between w-full px-2 py-3 text-iron dark:text-limestone-50">
							<div class="flex items-center gap-2">
								{#if selectedCountry}
									<span class="fi fi-{selectedCountry.toLowerCase()} !w-6 !h-[18px] !bg-cover rounded-sm shadow-sm flex-shrink-0"></span>
									<span class="text-xs font-bold font-mono opacity-80">{selectedCountry}</span>
								{/if}
							</div>
							<svg class="w-3 h-3 text-iron/40 dark:text-limestone-400/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
						</div>

						<select
								aria-label="Selectionner pays"
								bind:value={selectedCountry}
								class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
						>
							{#each normalizedCountries as country (country.id)}
								<option value={country.iso2}>
									{country.name} (+{country.dialCode})
								</option>
							{/each}
						</select>
					</div>

					<div class="w-[1px] bg-black/10 dark:bg-white/10 my-2"></div>

					<div class="flex-grow relative">
						<TelInput
								bind:country={selectedCountry}
								bind:value
								bind:valid
								bind:detailedValue
								options={{
								autoPlaceholder: true
							}}
								class="w-full h-full px-3 py-3 bg-transparent border-none focus:ring-0 outline-none placeholder-iron-300 text-iron dark:text-limestone-50 font-medium"
						/>

						<div class="absolute inset-0 pointer-events-none" aria-hidden="true"></div>
						<input
								aria-hidden="true"
								type="text"
								class="sr-only"
								onfocus={() => handleBlur('telephone')}
						/>
					</div>
				</div>

				{#if showError('telephone')}
					<div transition:slide={{ duration: 200 }} class="mt-1 text-xs text-red-500 font-medium">
						{booking.errors.customer.telephone}
					</div>
				{/if}
			</div>
		</div>

		<!-- Langue -->
		<div class="group relative" in:fly={{ y: 20, duration: 500, delay: 300 }}>
			<label
					for="langue"
					class="block text-sm font-medium text-iron/80 dark:text-limestone-300 mb-2 transition-colors duration-300 group-focus-within:text-primary"
			>
				{l.customer_lang} <span class="text-primary">*</span>
			</label>
			<div class="relative">
				<select
						id="langue"
						bind:value={booking.customer.langue}
						class="input-atelier w-full appearance-none cursor-pointer pr-10"
				>
					{#if availableLanguages.length === 0}
						<option value="fr-FR">Français</option>
						<option value="en-US">English</option>
					{:else}
						{#each availableLanguages as lang (lang.code)}
							<option value={lang.code}>{lang.nom}</option>
						{/each}
					{/if}
				</select>
				<div
						class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-iron-muted dark:text-limestone-400"
				>
					<svg
							class="w-4 h-4 fill-current transition-transform group-focus-within:rotate-180"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
					><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
					></path></svg
					>
				</div>
			</div>

			<button type="submit" class="sr-only">Submit</button>
		</div>
	</form>
</div>