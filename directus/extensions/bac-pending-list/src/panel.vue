<template>
  <div class="pending-container">
    <!-- Config Needed State -->
    <div v-if="!bookingCollection" class="empty-state">
      <p>Veuillez configurer la collection de réservations.</p>
    </div>

    <!-- Main List -->
    <div v-else class="content-wrapper">
      <div class="header">
        <div class="title-group">
          <h3>En Attente</h3>
          <span class="badge count" v-if="bookings.length > 0">{{ bookings.length }}</span>
        </div>
        <button class="refresh-btn" @click="fetchData" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading && bookings.length === 0" class="loading-state">
        Chargement...
      </div>

      <!-- Empty State -->
      <div v-else-if="bookings.length === 0" class="no-data">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="check-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <p>Aucune réservation en attente.</p>
      </div>

      <!-- Booking List -->
      <div v-else class="booking-list">
        <div v-for="booking in bookings" :key="booking.id" class="booking-item">
          <div class="booking-details">
            <div class="client-row">
              <span class="client-name">{{ getClientName(booking) }}</span>
              <span class="room-name">{{ getRoomName(booking) }}</span>
            </div>
            <div class="date-row">
              <span class="date">{{ formatDate(booking[startDateField]) }}</span>
              <span class="arrow">→</span>
              <span class="date">{{ formatDate(booking[endDateField]) }}</span>
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
  </div>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { format, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const props = defineProps({
  bookingCollection: { type: String, default: '' },
  statusField: { type: String, default: 'statut' },
  roomFieldName: { type: String, default: 'chambre' },
  clientField: { type: String, default: 'client' },
  startDateField: { type: String, default: 'date_arrivee' },
  endDateField: { type: String, default: 'date_depart' },
});

const api = useApi();
const loading = ref(false);
const processing = ref<string | number | null>(null);
const bookings = ref<any[]>([]);

// Define keys based on your setup
const STATUS_PENDING = 'en_attente';
const STATUS_CONFIRMED = 'confirmee';

async function fetchData() {
  if (!props.bookingCollection) return;

  loading.value = true;
  try {
    const response = await api.get(`/items/${props.bookingCollection}`, {
      params: {
        filter: {
          [props.statusField]: { _eq: STATUS_PENDING }
        },
        fields: ['*', `${props.clientField}.*`, `${props.roomFieldName}.*`],
        sort: [props.startDateField], // Sort by soonest arrival
        limit: 20
      }
    });
    bookings.value = response.data.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function confirmBooking(booking: any) {
  processing.value = booking.id;
  try {
    await api.patch(`/items/${props.bookingCollection}/${booking.id}`, {
      [props.statusField]: STATUS_CONFIRMED
    });
    // Remove from list locally for instant feedback
    bookings.value = bookings.value.filter(b => b.id !== booking.id);

    // Broadcast update to other panels (like the Calendar)
    window.dispatchEvent(new Event('hotel-booking-updated'));

  } catch (err: any) {
    alert("Erreur: " + err.message);
  } finally {
    processing.value = null;
  }
}

// Listen for updates from other panels (e.g. if I change status in calendar)
function handleGlobalUpdate() {
  fetchData();
}

// --- Helpers ---

function getClientName(b: any) {
  const client = b?.[props.clientField];
  if (typeof client === 'object' && client !== null) {
    return client.nom ? `${client.prenom || ''} ${client.nom}` : (client.full_name || 'Client');
  }
  return 'Client';
}

function getRoomName(b: any) {
  const room = b?.[props.roomFieldName];
  if (typeof room === 'object' && room !== null) {
    return room.Nom || room.name || 'Chambre';
  }
  return room || 'Chambre';
}

function formatDate(d: string) {
  if (!d) return '-';
  return format(parseISO(d), 'd MMM', { locale: fr });
}

function getDuration(b: any) {
  if (!b[props.startDateField] || !b[props.endDateField]) return 0;
  return differenceInDays(parseISO(b[props.endDateField]), parseISO(b[props.startDateField]));
}

watch(() => props.bookingCollection, fetchData);

onMounted(() => {
  fetchData();
  window.addEventListener('hotel-booking-updated', handleGlobalUpdate);
});

onUnmounted(() => {
  window.removeEventListener('hotel-booking-updated', handleGlobalUpdate);
});
</script>

<style scoped>
.pending-container {
  height: 100%;
  width: 100%;
  background: var(--theme--background);
  color: var(--theme--foreground);
  font-family: var(--family-sans);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.empty-state {
  height: 100%; display: flex; align-items: center; justify-content: center;
  color: var(--theme--foreground-subdued);
}

.content-wrapper {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--theme--border-color-subdued);
}

.title-group { display: flex; align-items: center; gap: 8px; }
.title-group h3 { margin: 0; font-size: 1rem; font-weight: 700; text-transform: uppercase; color: var(--theme--foreground-subdued); }

.badge.count {
  background: var(--warning);
  color: #1d2127;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.refresh-btn {
  background: transparent; border: none; cursor: pointer; color: var(--theme--foreground-subdued);
  padding: 4px; border-radius: 50%; display: flex; align-items: center;
}
.refresh-btn:hover { background: var(--theme--background-subdued); color: var(--theme--foreground); }
.refresh-btn:disabled { opacity: 0.5; cursor: default; }
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* List */
.booking-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }

.booking-item {
  background: var(--theme--background);
  border: 1px solid var(--theme--border-color-subdued);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  border-left: 4px solid var(--warning);
}
.booking-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

.booking-details { display: flex; flex-direction: column; gap: 4px; }

.client-row { display: flex; align-items: center; gap: 8px; }
.client-name { font-weight: 700; font-size: 1rem; }
.room-name { font-size: 0.8rem; color: var(--theme--foreground-subdued); background: var(--theme--background-subdued); padding: 2px 6px; border-radius: 4px; }

.date-row { font-size: 0.85rem; color: var(--theme--foreground-subdued); display: flex; gap: 6px; align-items: center; }
.arrow { font-size: 0.8rem; opacity: 0.5; }
.duration { font-size: 0.75rem; opacity: 0.7; margin-left: 4px; }

.actions { display: flex; align-items: center; }

.btn-confirm {
  background: var(--success);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-confirm:hover { background: var(--success-125); }
.btn-confirm:disabled { opacity: 0.7; cursor: wait; }

/* No Data */
.no-data {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: var(--theme--foreground-subdued); text-align: center;
}
.check-icon { margin-bottom: 12px; color: var(--success); opacity: 0.5; }
</style>