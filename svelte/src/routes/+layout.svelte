<script lang="ts">
	import '../globals.css';
	// import '../fonts.css'; // Using Google Fonts for the new style
	import NavigationBar from '$lib/components/layout/NavigationBar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { getDirectusAssetURL } from '$lib/directus/directus-utils';
	import { page } from '$app/state';
	import { PUBLIC_DIRECTUS_URL } from '$env/static/public';
	import { afterNavigate, invalidateAll } from '$app/navigation';
	import { enableVisualEditing } from '$lib/directus/visualEditing';
	import { apply } from '@directus/visual-editing';

	let { children, data } = $props();

	const siteTitle = $derived(data.globals?.title || 'Chambre d\'Hôte');
	const siteDescription = $derived(
			page.data.globals?.description || 'Réservation de séjour et visites.'
	);
	const faviconURL = $derived(
			data.globals?.favicon ? getDirectusAssetURL(data.globals.favicon) : '/favicon.ico'
	);

	// Default to your Pink if CMS data is missing
	const accentColor = $derived(data.globals?.accent_color || '#f55677');

	// FIX: Only enable visual editing if the server flag allows it (prevents postMessage errors on localhost)
	$effect(() => {
		if (data.visualEditingEnabled) {
			enableVisualEditing();
		}
	});

	afterNavigate(async (_navigation) => {
		// FIX: Guard the apply function
		if (data.visualEditingEnabled) {
			apply({
				directusUrl: PUBLIC_DIRECTUS_URL,
				onSaved: async () => {
					await invalidateAll();
				}
			});
		}
	});
</script>

<svelte:head>
	<title>{siteTitle}</title>
	<meta name="description" content={siteDescription} />
	<link rel="icon" href={faviconURL} />

	<!-- Inject Accent Color -->
	{@html `<style>:root{ --accent-color: ${accentColor} !important }</style>`}

	<!-- Load Elegant Fonts -->
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
</svelte:head>

<ModeWatcher />
<NavigationBar />

<main class="flex-grow bg-background transition-colors duration-500">
	{@render children()}
</main>
<Footer />