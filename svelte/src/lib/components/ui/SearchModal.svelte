<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Search, X } from '@lucide/svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import { debounce } from '$lib/utils';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	let open = $state(false);
	let search = $state('');
	let searched = $state(false);
	let loading = $state(false);
	let results = $state<SearchResult[]>([]);

	type SearchResult = {
		id: string;
		title: string;
		description: string;
		type: string;
		link: string;
	};

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open = !open;
		}
	};

	$effect(() => {
		if (!open) {
			searched = false;
			loading = false;
			search = '';
			results = [];
		}
	});

	const fetchResults = async (search: string) => {
		if (search.length < 3 || !open) {
			results = [];
			return;
		}

		loading = true;
		try {
			const res = await fetch(`/api/search?search=${encodeURIComponent(search)}`);
			if (!res.ok) throw new Error('Failed to fetch results');
			const data: SearchResult[] = await res.json();
			results = data.filter((r) => r.link);
			searched = true;
		} catch (error) {
			console.error('Error fetching search results:', error);
			results = [];
		} finally {
			loading = false;
		}
	};
	const debouncedFetchResults = debounce(fetchResults, 300);

	$effect(() => {
		debouncedFetchResults(search);
	});

	const handleSelect = (result: SearchResult) => {
		goto(`${base}${result.link}`);
		open = false;
	};
</script>

<svelte:document onkeydown={handleKeydown} />

<div>
	<Button
		variant="ghost"
		size="icon"
		aria-label="Search"
		onclick={() => (open = true)}
		class="border-iron/10 dark:hover:bg-iron-light hover:shadow-retro-sm hover:border-primary rounded-lg border-2 transition-all duration-200 hover:bg-white active:translate-y-0.5"
	>
		<Search class="text-iron dark:text-limestone-100 size-5" />
	</Button>

	<Command.Dialog
		bind:open
		shouldFilter={false}
		contentClass="bg-transparent border-none shadow-none p-0"
	>
		<!-- Custom Atelier Modal Content -->
		<div
			class="border-iron/10 dark:border-limestone-100/10 shadow-retro mx-auto w-full max-w-lg overflow-hidden rounded-xl border-2 bg-white dark:bg-[#252426] dark:shadow-black/60"
		>
			<div
				class="border-iron/5 dark:border-limestone-100/5 bg-limestone-50/50 dark:bg-iron-light/10 flex items-center gap-3 border-b-2 p-4"
			>
				<Search class="text-iron-muted dark:text-limestone-400 size-5" />
				<Command.Input
					placeholder="Rechercher..."
					bind:value={search}
					class="text-iron dark:text-limestone-50 placeholder:text-iron-muted/40 flex-1 border-none bg-transparent text-lg font-medium outline-none"
				/>
				<button
					onclick={() => (open = false)}
					class="hover:bg-iron/10 rounded-full p-1 transition-colors"
				>
					<X class="text-iron-muted size-4" />
				</button>
			</div>

			<Command.List class="max-h-[300px] overflow-y-auto bg-white p-2 dark:bg-[#252426]">
				{#if !loading && !searched && search.length < 3}
					<div class="text-iron-muted/60 dark:text-limestone-400/50 py-8 text-center text-sm">
						Tapez au moins 3 caractères...
					</div>
				{/if}

				{#if loading}
					<div
						class="text-primary animate-pulse py-8 text-center text-sm font-bold tracking-widest uppercase"
					>
						Recherche en cours...
					</div>
				{/if}

				{#if !loading && searched && results.length === 0}
					<div class="text-iron-muted dark:text-limestone-400 py-8 text-center text-sm">
						Aucun résultat trouvé.
					</div>
				{/if}

				{#if results.length > 0}
					<div class="px-2 pb-2">
						<span
							class="text-iron-muted/50 dark:text-limestone-400/50 mb-2 block pl-2 text-[10px] font-bold tracking-widest uppercase"
							>Résultats</span
						>
						{#each results as result (result.id)}
							<Command.Item
								class="hover:bg-limestone-50 dark:hover:bg-iron-light/30 group flex cursor-pointer items-start gap-4 rounded-lg p-3 transition-colors"
								onSelect={() => handleSelect(result)}
							>
								<div class="mt-1">
									<span
										class="bg-primary/20 group-hover:bg-primary inline-block h-2 w-2 rounded-full transition-colors"
									></span>
								</div>
								<div class="w-full">
									<p
										class="text-iron dark:text-limestone-50 font-heading group-hover:text-primary text-base font-bold transition-colors"
									>
										{result.title}
									</p>
									<p class="text-iron-muted dark:text-limestone-400 mt-1 line-clamp-1 text-sm">
										{result.description}
									</p>
								</div>
							</Command.Item>
						{/each}
					</div>
				{/if}
			</Command.List>
		</div>
	</Command.Dialog>
</div>
