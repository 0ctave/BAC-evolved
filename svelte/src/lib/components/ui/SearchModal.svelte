<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Search, X } from '@lucide/svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import { debounce } from '$lib/utils';
	import { goto } from '$app/navigation';

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
		goto(result.link);
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
			class="border-2 border-iron/10 rounded-lg hover:bg-white dark:hover:bg-iron-light transition-all duration-200 hover:shadow-retro-sm hover:border-primary active:translate-y-0.5"
	>
		<Search class="size-5 text-iron dark:text-limestone-100" />
	</Button>

	<Command.Dialog bind:open shouldFilter={false} contentClass="bg-transparent border-none shadow-none p-0">
		<!-- Custom Atelier Modal Content -->
		<div class="w-full max-w-lg mx-auto bg-white dark:bg-[#252426] border-2 border-iron/10 dark:border-limestone-100/10 shadow-retro dark:shadow-black/60 rounded-xl overflow-hidden">

			<div class="flex items-center border-b-2 border-iron/5 dark:border-limestone-100/5 p-4 gap-3 bg-limestone-50/50 dark:bg-iron-light/10">
				<Search class="size-5 text-iron-muted dark:text-limestone-400" />
				<Command.Input
						placeholder="Rechercher..."
						bind:value={search}
						class="flex-1 bg-transparent border-none outline-none text-lg font-medium text-iron dark:text-limestone-50 placeholder:text-iron-muted/40"
				/>
				<button onclick={() => open = false} class="p-1 hover:bg-iron/10 rounded-full transition-colors">
					<X class="size-4 text-iron-muted" />
				</button>
			</div>

			<Command.List class="max-h-[300px] overflow-y-auto p-2 bg-white dark:bg-[#252426]">
				{#if !loading && !searched && search.length < 3}
					<div class="py-8 text-center text-iron-muted/60 dark:text-limestone-400/50 text-sm">
						Tapez au moins 3 caractères...
					</div>
				{/if}

				{#if loading}
					<div class="py-8 text-center text-primary text-sm font-bold uppercase tracking-widest animate-pulse">
						Recherche en cours...
					</div>
				{/if}

				{#if !loading && searched && results.length === 0}
					<div class="py-8 text-center text-iron-muted dark:text-limestone-400 text-sm">
						Aucun résultat trouvé.
					</div>
				{/if}

				{#if results.length > 0}
					<div class="px-2 pb-2">
						<span class="text-[10px] font-bold uppercase tracking-widest text-iron-muted/50 dark:text-limestone-400/50 pl-2 mb-2 block">Résultats</span>
						{#each results as result}
							<Command.Item
									class="flex items-start gap-4 p-3 rounded-lg hover:bg-limestone-50 dark:hover:bg-iron-light/30 cursor-pointer transition-colors group"
									onSelect={() => handleSelect(result)}
							>
								<div class="mt-1">
									<span class="inline-block w-2 h-2 rounded-full bg-primary/20 group-hover:bg-primary transition-colors"></span>
								</div>
								<div class="w-full">
									<p class="text-base font-bold text-iron dark:text-limestone-50 font-heading group-hover:text-primary transition-colors">{result.title}</p>
									<p class="mt-1 line-clamp-1 text-sm text-iron-muted dark:text-limestone-400">{result.description}</p>
								</div>
							</Command.Item>
						{/each}
					</div>
				{/if}
			</Command.List>
		</div>
	</Command.Dialog>
</div>