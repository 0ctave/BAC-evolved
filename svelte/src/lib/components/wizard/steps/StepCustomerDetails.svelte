<script lang="ts">
    import { booking } from '$lib/logic/booking.svelte';
    import { fly } from 'svelte/transition';
</script>

<div class="max-w-2xl mx-auto">
    <div class="text-center mb-16" in:fly={{ y: -20, duration: 500 }}>
        <h2 class="text-3xl font-heading font-italic text-iron dark:text-limestone-50">Livre d'or</h2>
        <p class="text-iron-muted dark:text-limestone-300 mt-2 font-serif italic">Vos coordonnées pour la réservation.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">

        <!-- Prénom -->
        <div class="col-span-1 group" in:fly={{ y: 20, duration: 500, delay: 100 }}>
            <label for="prenom" class="block text-xs font-bold text-iron/60 dark:text-limestone-400 uppercase tracking-widest mb-1 group-focus-within:text-primary transition-colors duration-300">Prénom</label>
            <input id="prenom" type="text" bind:value={booking.customer.prenom} placeholder="Jean"
                   class="input-atelier focus:pl-2" />
        </div>

        <!-- Nom -->
        <div class="col-span-1 group" in:fly={{ y: 20, duration: 500, delay: 150 }}>
            <label for="nom" class="block text-xs font-bold text-iron/60 dark:text-limestone-400 uppercase tracking-widest mb-1 group-focus-within:text-primary transition-colors duration-300">Nom</label>
            <input id="nom" type="text" bind:value={booking.customer.nom} placeholder="Dupont"
                   class="input-atelier focus:pl-2" />
        </div>

        <!-- Email -->
        <div class="col-span-1 md:col-span-2 group" in:fly={{ y: 20, duration: 500, delay: 200 }}>
            <label for="email" class="block text-xs font-bold text-iron/60 dark:text-limestone-400 uppercase tracking-widest mb-1 group-focus-within:text-primary transition-colors duration-300">Email</label>
            <input id="email" type="email" bind:value={booking.customer.email} placeholder="jean.dupont@exemple.com"
                   class="input-atelier focus:pl-2" />
        </div>

        <!-- Téléphone -->
        <div class="col-span-1 group" in:fly={{ y: 20, duration: 500, delay: 250 }}>
            <label for="telephone" class="block text-xs font-bold text-iron/60 dark:text-limestone-400 uppercase tracking-widest mb-1 group-focus-within:text-primary transition-colors duration-300">Téléphone</label>
            <input id="telephone" type="tel" bind:value={booking.customer.telephone} placeholder="06..."
                   class="input-atelier focus:pl-2" />
        </div>

        <!-- Langue -->
        <div class="col-span-1 group relative" in:fly={{ y: 20, duration: 500, delay: 300 }}>
            <label for="langue" class="block text-xs font-bold text-iron/60 dark:text-limestone-400 uppercase tracking-widest mb-1 group-focus-within:text-primary transition-colors duration-300">Langue</label>
            <select id="langue" bind:value={booking.customer.langue}
                    class="input-atelier appearance-none cursor-pointer focus:pl-2">
                <option value="fr-FR">Français</option>
                <option value="en-US">English</option>
            </select>
            <div class="absolute right-0 bottom-4 pointer-events-none text-iron-muted dark:text-limestone-400 text-xs transition-transform group-focus-within:rotate-180">▼</div>
        </div>
    </div>
</div>