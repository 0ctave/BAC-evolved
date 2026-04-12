<script lang="ts">
	import { booking } from '$lib/logic/booking.svelte';
	import { submitBooking } from '$lib/logic/submit';
	import StepSelector from './steps/StepSelector.svelte';
	import StepRoomCalendar from './steps/StepRoomCalendar.svelte';
	import StepCustomerDetails from './steps/StepCustomerDetails.svelte';
	import StepSummary from './steps/StepSummary.svelte';
	import { fade, fly, scale, slide } from 'svelte/transition';
	import { backOut, cubicIn, cubicOut } from 'svelte/easing';
	import Button from '$lib/components/blocks/Button.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import StepTourSession from '$lib/components/wizard/steps/StepTourSession.svelte';
	import { Turnstile } from 'svelte-turnstile';
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public'; // Nouvel import

	interface Props {
		data: any; // We accept any structure since it contains dynamic labels
	}

	let { data }: Props = $props();

	let loading = $state(false);
	let error = $state('');
	let success = $state(false);
	let isLoaded = $state(false);

	let contentHeight = $state<number>(300);
	let headerHeight = $state<number>(0);
	let footerHeight = $state<number>(0);
	let successHeight = $state<number>(0);
	let direction = $state(1);

	// Sync labels from prop data to store
	$effect(() => {
		if (data) {
			booking.setLabels(data);
		}
	});

	// Use local alias for template
	const l = $derived(booking.labels);

	const stepsLabels = $derived([l.step_1_label, l.step_2_label, l.step_3_label, l.step_4_label]);

	onMount(() => {
		isLoaded = true;

		if (page.url) {
			booking.initFromUrl(page.url);
		}

		return () => {
			booking.step = 0;
			if (typeof booking.reset === 'function') booking.reset();
		};
	});

	function goNext() {
		if (booking.canGoNext) {
			direction = 1;
			booking.nextStep();
		} else {
			booking.triggerValidation();
		}
	}

	function goPrev() {
		direction = -1;
		booking.prevStep();
	}

	function jumpToStep(i: number) {
		if (booking.step === i) return;
		direction = i > booking.step ? 1 : -1;
		if (booking.step > i) booking.step = i;
	}

	let turnstileToken = $state<string>(''); // Stockage du token Captcha
	let turnstileInstance = $state<any>(null); // Permet de contrôler le widget

	function handleTurnstileError() {
		turnstileToken = '';
		error =
			l.wizard_error_captcha_failed ||
			'Le système anti-robot a rencontré une erreur. Veuillez rafraîchir la page.';
	}

	function handleTurnstileExpired() {
		turnstileToken = '';
		error =
			l.wizard_error_captcha_expired ||
			'La vérification de sécurité a expiré. Veuillez patienter pendant son rechargement.';
		// On force le widget à se recharger pour obtenir un nouveau token
		if (turnstileInstance) turnstileInstance.reset();
	}

	async function onFinalize() {
		if (!turnstileToken) {
			error = 'Veuillez patienter, validation de sécurité en cours...';
			return;
		}

		loading = true;
		error = '';
		try {
			await submitBooking(turnstileToken);
			success = true;
		} catch (e: any) {
			error = e.message || l.wizard_error_generic;
			turnstileToken = '';
		} finally {
			loading = false;
		}
	}

	function handleGlobalClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (target.closest('button, input, select, textarea, a, label, [role="button"], .interactive'))
			return;
		booking.clearValidation();
	}

	let totalHeight = $derived.by(() => {
		if (success) return successHeight || 400;
		const h = (headerHeight || 0) + (contentHeight || 0) + (footerHeight || 0);
		return h > 0 ? h : 400;
	});

	function slideFade(node: Element, { duration = 500, delay = 0, xDir = 1, easing = cubicOut }) {
		return {
			duration,
			delay,
			css: (t: number) => {
				const eased = easing(t);
				return `transform: translate3d(${(1 - eased) * 100 * xDir}%, 0, 0); opacity: ${t};`;
			}
		};
	}
</script>

<svelte:window onclick={handleGlobalClick} />

<div class="relative flex w-full flex-col transition-all duration-500">
	{#if !isLoaded}
		<div
			class="absolute inset-0 z-50 flex min-h-[400px] items-center justify-center"
			out:fade={{ duration: 200 }}
		>
			<div
				class="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
			></div>
		</div>
	{:else}
		<div
			class="surface-atelier relative flex w-full flex-col overflow-hidden transition-[height] duration-500 will-change-[height]"
			style="height: {totalHeight}px; transition-timing-function: cubic-bezier(0.25, 1, 0.5, 1);"
			in:fly|global={{ y: 30, duration: 600, delay: 100, easing: cubicOut }}
		>
			<div class="bg-primary absolute top-0 right-0 left-0 z-20 h-1.5"></div>

			{#if success}
				<div
					class="absolute top-0 left-0 z-50 flex w-full flex-col items-center justify-center bg-[var(--background-color)] px-6 py-12 text-center"
					in:fade={{ duration: 300, delay: 100 }}
					bind:clientHeight={successHeight}
				>
					<div
						class="bg-primary shadow-retro-primary border-iron mb-8 flex h-24 w-24 items-center justify-center rounded-full border-2 text-white"
						in:scale={{ duration: 400, delay: 0, easing: backOut, start: 0.5 }}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-10 w-10"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="3"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h2
						class="font-heading text-iron dark:text-limestone-50 mb-6 text-5xl italic"
						in:fly={{ y: 20, duration: 400, delay: 100 }}
					>
						{l.wizard_success_title}
					</h2>
					<p
						class="text-body mx-auto mb-12 max-w-md text-xl font-light"
						in:fly={{ y: 20, duration: 400, delay: 200 }}
					>
						{(l.wizard_success_desc || '').replace('{name}', booking.customer.prenom)}
					</p>
					<div in:fly={{ y: 20, duration: 400, delay: 300 }}>
						<Button url="/" variant="outline" label={l.wizard_btn_home} id="home" />
					</div>
				</div>
			{:else}
				<div class="flex h-full w-full flex-col" out:fade={{ duration: 200 }}>
					<div
						class="bg-limestone-50/50 border-iron/5 dark:border-iron-light/30 relative z-20 border-b-2 px-4 pt-10 pb-6 sm:px-10 dark:bg-[#2a292b]"
						bind:clientHeight={headerHeight}
					>
						<div class="relative mx-auto flex max-w-3xl items-center justify-between">
							<div
								class="bg-iron/10 dark:bg-iron-light absolute top-1/2 left-0 -z-0 h-[2px] w-full"
							></div>
							{#each stepsLabels as label, i (i)}
								<button
									class="group relative z-10 flex flex-col items-center focus:outline-none disabled:cursor-not-allowed"
									onclick={() => jumpToStep(i)}
									disabled={booking.step < i}
								>
									<div
										class="step-indicator relative transition-all duration-300 ease-out {booking.step ===
										i
											? 'active'
											: ''} {booking.step > i ? 'completed' : ''} {booking.step < i
											? 'inactive'
											: ''}"
									>
										{#if booking.step > i}
											<span in:scale={{ duration: 200, start: 0.5 }}>✓</span>
										{:else}
											<span>{i + 1}</span>
										{/if}
									</div>
									<span
										class="font-heading absolute -bottom-8 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase transition-all duration-300 sm:text-xs {booking.step >=
										i
											? 'text-iron dark:text-limestone-100 opacity-100'
											: 'text-iron/30 dark:text-iron-muted opacity-60'}"
									>
										{label}
									</span>
								</button>
							{/each}
						</div>
						<div class="h-6"></div>
					</div>

					{#if error}
						<div
							in:slide={{ axis: 'y' }}
							class="m-6 flex items-center gap-3 border-l-4 border-red-500 bg-red-50 p-4 text-sm font-medium text-red-800 dark:bg-red-900/10 dark:text-red-300"
						>
							<svg
								class="h-5 w-5 flex-shrink-0"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							{error}
						</div>
					{/if}

					<div
						class="relative w-full flex-1 overflow-hidden"
						style="height: {contentHeight}px; transition: height 500ms cubic-bezier(0.25, 1, 0.5, 1);"
					>
						{#key booking.step}
							<div
								class="absolute top-0 left-0 w-full"
								in:slideFade={{ duration: 500, xDir: direction, easing: cubicOut }}
								out:slideFade={{ duration: 500, xDir: -direction, easing: cubicIn }}
							>
								<div class="p-6 sm:p-12" bind:clientHeight={contentHeight}>
									{#if booking.step === 0}
										<StepSelector />
									{:else if booking.step === 1}
										{#if booking.type === 'CHAMBRE'}
											<StepRoomCalendar />
										{:else}
											<StepTourSession />
										{/if}
									{:else if booking.step === 2}
										<StepCustomerDetails />
									{:else if booking.step === 3}
										<StepSummary />
									{/if}
								</div>
							</div>
						{/key}
					</div>

					<div
						class="bg-limestone-50/50 border-iron/5 dark:border-iron-light/30 z-20 mt-auto flex items-center justify-between gap-4 border-t-2 p-8 dark:bg-[#2a292b]"
						bind:clientHeight={footerHeight}
					>
						<Button
							onClick={goPrev}
							disabled={booking.step === 0 || loading}
							variant="ghost"
							label={l.wizard_btn_back}
							icon="arrow_left"
							id="back"
						/>

						{#if booking.step > 0 && booking.step < 3}
							<div in:fly={{ x: 10, duration: 300 }}>
								<Button
									id="continuer"
									onClick={goNext}
									disabled={false}
									label={l.wizard_btn_continue}
									variant="dark"
									class={!booking.canGoNext
										? '!bg-iron/20 !text-iron/40 dark:!bg-limestone-50/10 dark:!text-limestone-50/40 cursor-not-allowed !shadow-none hover:!translate-y-0 hover:!shadow-none'
										: ''}
								/>
							</div>
						{:else if booking.step === 3}
							<div class="flex items-center gap-4">
								<Turnstile
									siteKey={PUBLIC_TURNSTILE_SITE_KEY}
									theme="auto"
									bind:this={turnstileInstance}
									on:turnstile-callback={(e) => {
										turnstileToken = e.detail.token;
										error = ''; // On efface l'erreur si le captcha réussit
									}}
									on:turnstile-error={handleTurnstileError}
									on:turnstile-timeout={handleTurnstileExpired}
									on:turnstile-expired={handleTurnstileExpired}
								/>
								<button
									onclick={onFinalize}
									disabled={loading || !turnstileToken}
									class="btn-atelier-primary group relative overflow-hidden disabled:opacity-50"
								>
									{#if loading}
										<span class="relative z-10 flex items-center gap-2">
											<div
												class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
											></div>
											{l.wizard_loading_validation}
										</span>
									{:else}
										<span class="relative z-10">{l.wizard_btn_confirm}</span>
									{/if}
								</button>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
