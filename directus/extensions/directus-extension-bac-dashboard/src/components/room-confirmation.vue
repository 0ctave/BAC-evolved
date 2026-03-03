<template>
  <div class="pending-container">
    <div class="header">
      <div class="title-group">
        <h3>À Confirmer (Chambres)</h3>
        <span class="badge count" v-if="bookings.length > 0">{{ bookings.length }}</span>
      </div>
      <button class="refresh-btn" @click="fetchData" :disabled="loading">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
      </button>
    </div>

    <div v-if="loading && bookings.length === 0" class="loading-state">
      Chargement...
    </div>

    <div v-else-if="bookings.length === 0" class="no-data">
      <div class="icon-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="check-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <p>Aucune réservation en attente.</p>
    </div>

    <div v-else class="booking-list">
      <div v-for="booking in bookings" :key="booking.id" class="booking-item">
        <div class="booking-details">
          <div class="client-row">
            <span class="client-name">{{ getClientName(booking) }}</span>
            <span class="room-name">{{ getRoomName(booking) }}</span>
          </div>
          <div class="date-row">
            <span class="date">{{ formatDate(booking[config.roomStartDateField]) }}</span>
            <span class="arrow">→</span>
            <span class="date">{{ formatDate(booking[config.roomEndDateField]) }}</span>
            <span class="duration">({{ getDuration(booking) }} nuits)</span>
          </div>
        </div>

        <div class="actions">
          <button
              class="btn-confirm"
              @click="confirmBooking(booking)"
              :disabled="processing === booking.id"
          >
            <span v-if="processing === booking.id">...</span>
            <span v-else>Confirmer</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk';
import { ref, onMounted, onUnmounted } from 'vue';
import { format, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { config } from '../config';

const api = useApi();
const loading = ref(false);
const processing = ref<string | number | null>(null);
const bookings = ref<any[]>([]);

const STATUS_PENDING = 'en_attente';
const STATUS_CONFIRMED = 'confirmee';

async function fetchData() {
  loading.value = true;
  try {
    const response = await api.get(`/items/${config.roomBookingsCollection}`, {
      params: {
        filter: { [config.statusField]: { _eq: STATUS_PENDING } },
        fields: ['*', `${config.clientField}.*`, `${config.roomRelationField}.*`],
        sort: [config.roomStartDateField],
        limit: 20
      }
    });
    bookings.value = response.data.data;
  } catch (err) { console.error(err); } finally { loading.value = false; }
}

async function confirmBooking(booking: any) {
  processing.value = booking.id;
  try {
    await api.patch(`/items/${config.roomBookingsCollection}/${booking.id}`, { [config.statusField]: STATUS_CONFIRMED });
    bookings.value = bookings.value.filter(b => b.id !== booking.id);
    window.dispatchEvent(new Event('hotel-booking-updated'));
  } catch (err: any) { alert("Erreur: " + err.message); } finally { processing.value = null; }
}

function handleGlobalUpdate() { fetchData(); }

function getClientName(b: any) {
  const client = b?.[config.clientField];
  if (typeof client === 'object' && client !== null) { return client.nom ? `${client.prenom || ''} ${client.nom}` : 'Client'; }
  return 'Client';
}
function getRoomName(b: any) {
  const room = b?.[config.roomRelationField];
  if (typeof room === 'object' && room !== null) { return room[config.roomNameField] || 'Chambre'; }
  return 'Chambre';
}
function formatDate(d: string) { return d ? format(parseISO(d), 'd MMM', { locale: fr }) : '-'; }
function getDuration(b: any) { return (b[config.roomStartDateField] && b[config.roomEndDateField]) ? differenceInDays(parseISO(b[config.roomEndDateField]), parseISO(b[config.roomStartDateField])) : 0; }

onMounted(() => {
  fetchData();
  window.addEventListener('hotel-booking-updated', handleGlobalUpdate);
});

onUnmounted(() => { window.removeEventListener('hotel-booking-updated', handleGlobalUpdate); });
</script>

<style scoped>
.pending-container {
  background: var(--theme--background);
  border: 1px solid var(--theme--border-color-subdued);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--theme--border-color-subdued);
  background: var(--theme--background-subdued);
}

.title-group { display: flex; align-items: center; gap: 10px; }
.title-group h3 { margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--theme--foreground); }

.badge.count { background: var(--warning); color: #1d2127; font-weight: 800; padding: 2px 10px; border-radius: 12px; font-size: 0.85rem; }

.refresh-btn { background: var(--theme--background); border: 1px solid var(--theme--border-color); cursor: pointer; color: var(--theme--foreground-subdued); padding: 6px; border-radius: 8px; display: flex; align-items: center; transition: all 0.2s; }
.refresh-btn:hover { color: var(--theme--primary); border-color: var(--theme--primary); }
.spinning { animation: spin 1s linear infinite; }

/* MODIFICATION ICI: Utilisation de Grid pour un affichage pleine largeur optimisé */
.booking-list {
  flex: 1;
  overflow-y: auto;
  display: grid;
  /* Crée automatiquement autant de colonnes que possible (min 320px par carte) */
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  align-content: start;
  padding: 16px;
  gap: 16px;
}

.booking-item { background: var(--theme--background); border: 1px solid var(--theme--border-color-subdued); border-radius: 10px; padding: 16px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; border-left: 4px solid var(--warning); box-shadow: 0 2px 6px rgba(0,0,0,0.02); }
.booking-item:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.06); }

.booking-details { display: flex; flex-direction: column; gap: 8px; }
.client-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.client-name { font-weight: 800; font-size: 1.05rem; }
.room-name { font-size: 0.75rem; color: var(--theme--foreground-subdued); background: var(--theme--background-subdued); padding: 4px 8px; border-radius: 6px; font-weight: 700; }

.date-row { font-size: 0.85rem; color: var(--theme--foreground-subdued); display: flex; gap: 6px; align-items: center; font-weight: 600; }
.arrow { opacity: 0.5; }

.btn-confirm { background: var(--success); color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: background 0.2s; }
.btn-confirm:hover { background: var(--success-125); }
.btn-confirm:disabled { opacity: 0.7; cursor: wait; }

.no-data { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--theme--foreground-subdued); padding: 32px; text-align: center; }
.icon-wrapper { background: var(--theme--background-subdued); padding: 16px; border-radius: 50%; margin-bottom: 16px; color: var(--success); opacity: 0.8; }
.loading-state { padding: 32px; text-align: center; color: var(--theme--foreground-subdued); font-weight: 600; }
</style>