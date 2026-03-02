<template>
  <div class="tours-container">
    <div class="header">
      <h2>Réservations de Visites (À Confirmer)</h2>
      <button class="refresh-btn" @click="fetchData" :disabled="loading">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
      </button>
    </div>

    <div v-if="loading && tours.length === 0" class="loading-state">
      Chargement des visites...
    </div>

    <div v-else-if="tours.length === 0" class="no-data">
      <span class="material-icons icon-huge">tour</span>
      <h3>Aucune visite en attente</h3>
      <p>L'ensemble de vos réservations de visites sont traitées.</p>
    </div>

    <div v-else class="tours-grid">
      <div v-for="tour in tours" :key="tour.id" class="tour-card">
        <div class="tour-header">
          <div class="tour-name">{{ getTourName(tour) }}</div>
          <div class="tour-date">{{ formatTourDate(tour) }}</div>
        </div>
        <div class="tour-body">
          <div class="client-info">
            <strong>{{ getClientName(tour) }}</strong>
            <span>{{ tour.quantite_billets }} billet(s)</span>
          </div>
        </div>
        <div class="tour-actions">
          <button class="btn-confirm" @click="confirmTour(tour)" :disabled="processing === tour.id">
            {{ processing === tour.id ? '...' : 'Confirmer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk';
import { ref, onMounted } from 'vue';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { config } from '../config';

const api = useApi();
const loading = ref(false);
const processing = ref<number | null>(null);
const tours = ref<any[]>([]);

async function fetchData() {
  loading.value = true;
  try {
    const res = await api.get(`/items/${config.tourBookingsCollection}`, {
      params: {
        filter: { [config.statusField]: { _eq: 'en_attente' } },
        fields: ['*', 'client.*', 'creneau_visite.*', 'creneau_visite.visite_id.*'],
      }
    });
    tours.value = res.data.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function confirmTour(tour: any) {
  processing.value = tour.id;
  try {
    await api.patch(`/items/${config.tourBookingsCollection}/${tour.id}`, { [config.statusField]: 'confirmee' });
    tours.value = tours.value.filter(t => t.id !== tour.id);
  } catch (err) {
    alert("Erreur lors de la confirmation");
  } finally {
    processing.value = null;
  }
}

function getClientName(t: any) {
  const c = t?.client;
  return (c && typeof c === 'object') ? `${c.prenom || ''} ${c.nom || ''}` : 'Client';
}

function getTourName(t: any) {
  const creneau = t?.creneau_visite;
  if (!creneau || typeof creneau !== 'object') return 'Visite';
  return creneau.visite_id?.nom || 'Visite';
}

function formatTourDate(t: any) {
  const creneau = t?.creneau_visite;
  if (!creneau || typeof creneau !== 'object' || !creneau.date_heure_debut) return '-';
  return format(parseISO(creneau.date_heure_debut), 'd MMM yyyy, HH:mm', { locale: fr });
}

onMounted(() => { fetchData(); });
</script>

<style scoped>
.tours-container {
  background: var(--theme--background);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--theme--border-color-subdued);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.header h2 { margin: 0; font-weight: 800; font-size: 1.4rem; }

.tours-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.tour-card {
  border: 1px solid var(--theme--border-color-subdued);
  border-radius: 10px;
  padding: 16px;
  background: var(--theme--background-subdued);
}

.tour-header {
  border-bottom: 1px solid var(--theme--border-color);
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.tour-name { font-weight: 800; font-size: 1.1rem; color: var(--theme--primary); }
.tour-date { font-size: 0.85rem; color: var(--theme--foreground-subdued); }

.client-info { display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem; }

.tour-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.btn-confirm { background: var(--success); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; }
.btn-confirm:disabled { opacity: 0.7; }

.refresh-btn { background: transparent; border: 1px solid var(--theme--border-color); padding: 8px; border-radius: 8px; cursor: pointer; color: var(--theme--foreground-subdued); }
.refresh-btn:hover { color: var(--theme--primary); border-color: var(--theme--primary); }
.spinning { animation: spin 1s linear infinite; }

.no-data { text-align: center; padding: 48px; color: var(--theme--foreground-subdued); }
.icon-huge { font-size: 4rem; color: var(--theme--primary); opacity: 0.3; margin-bottom: 16px; }
.no-data h3 { margin-bottom: 8px; font-weight: 800; }
</style>