<template>
  <div class="pending-container">
    <div class="header">
      <div class="title-group">
        <v-icon name="pending_actions" class="header-icon" />
        <div class="text-group">
          <h3>À Confirmer</h3>
          <span class="subtitle">Réservations de visites en attente</span>
        </div>
        <span class="badge count" v-if="bookings.length > 0">{{ bookings.length }}</span>
      </div>
      <v-button secondary icon @click="fetchData" :loading="loading" title="Actualiser">
        <v-icon name="refresh" />
      </v-button>
    </div>

    <div v-if="loading && bookings.length === 0" class="loading-state">
      <v-progress-circular indeterminate />
      <p>Chargement des réservations...</p>
    </div>

    <div v-else-if="bookings.length === 0" class="no-data">
      <div class="icon-wrapper">
        <v-icon name="check_circle" size="large" />
      </div>
      <p>Aucune réservation en attente</p>
      <span class="subtext">Tout est à jour !</span>
    </div>

    <div v-else class="booking-list">
      <div v-for="booking in bookings" :key="booking.id" class="booking-item">
        <div class="status-indicator" :class="booking.statut"></div>
        
        <div class="booking-content">
          <div class="client-info">
            <span class="client-name">{{ getClientName(booking) }}</span>
            <div class="tour-tag">
              <v-icon name="confirmation_number" size="x-small" />
              <span>{{ getTourName(booking) }}</span>
            </div>
          </div>

          <div class="appointment-details">
            <div class="detail-item">
              <v-icon name="calendar_today" size="x-small" />
              <span>{{ formatDate(getSlotDate(booking)) }}</span>
            </div>
            <div class="detail-item">
              <v-icon name="schedule" size="x-small" />
              <span>{{ formatTime(getSlotDate(booking)) }}</span>
            </div>
            <div class="detail-item tickets">
              <v-icon name="groups" size="x-small" />
              <span><strong>{{ booking.quantite_billets }}</strong> pers.</span>
            </div>
          </div>
        </div>

        <div class="actions">
          <v-button
              v-tooltip="'Confirmer la réservation'"
              secondary
              rounded
              icon
              class="confirm-btn"
              @click="confirmBooking(booking)"
              :loading="processing === booking.id"
          >
            <v-icon name="check" />
          </v-button>
          
          <v-button
              v-tooltip="'Annuler/Rejeter'"
              secondary
              rounded
              icon
              danger
              class="reject-btn"
              @click="rejectBooking(booking)"
              :disabled="processing === booking.id"
          >
            <v-icon name="close" />
          </v-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk';
import { ref, onMounted, onUnmounted } from 'vue';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { config } from '../config';
import type { ReservationVisite, Client, CreneauVisite } from '../types';

const api = useApi();
const loading = ref(false);
const processing = ref<number | null>(null);
const bookings = ref<ReservationVisite[]>([]);

async function fetchData() {
  loading.value = true;
  try {
    const response = await api.get(`/items/${config.tourBookingsCollection}`, {
      params: {
        filter: { [config.statusField]: { _eq: 'en_attente' } },
        fields: ['*', 'client.*', `${config.slotRelationField}.*`, `${config.slotRelationField}.${config.visiteRelationField}.*`],
        limit: 50,
        sort: 'date_created'
      }
    });
    bookings.value = response.data.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function confirmBooking(booking: ReservationVisite) {
  processing.value = booking.id;
  try {
    await api.patch(`/items/${config.tourBookingsCollection}/${booking.id}`, { [config.statusField]: 'confirmee' });
    bookings.value = bookings.value.filter(b => b.id !== booking.id);
    window.dispatchEvent(new Event('tour-booking-updated'));
  } catch (err: any) {
    console.error(err);
  } finally {
    processing.value = null;
  }
}

async function rejectBooking(booking: ReservationVisite) {
  if (!confirm("Voulez-vous vraiment annuler cette demande de réservation ?")) return;
  processing.value = booking.id;
  try {
    await api.patch(`/items/${config.tourBookingsCollection}/${booking.id}`, { [config.statusField]: 'annulee' });
    bookings.value = bookings.value.filter(b => b.id !== booking.id);
    window.dispatchEvent(new Event('tour-booking-updated'));
  } catch (err: any) {
    console.error(err);
  } finally {
    processing.value = null;
  }
}

function handleGlobalUpdate() { fetchData(); }

function getClientName(b: ReservationVisite) {
  const client = b.client as Client;
  if (typeof client === 'object' && client !== null) {
    return `${client.prenom || ''} ${client.nom || ''}`.trim() || client.email || 'Client';
  }
  return 'Client';
}

function getTourName(b: ReservationVisite) {
  const slot = b[config.slotRelationField as keyof ReservationVisite] as any;
  return slot?.[config.visiteRelationField]?.nom || 'Visite';
}

function getSlotDate(b: ReservationVisite) {
  const slot = b[config.slotRelationField as keyof ReservationVisite] as CreneauVisite;
  return slot?.date_heure_debut;
}

function formatDate(d: string | undefined) {
  return d ? format(parseISO(d), 'd MMM yyyy', { locale: fr }) : '-';
}

function formatTime(d: string | undefined) {
  return d ? format(parseISO(d), 'HH:mm') : '';
}

onMounted(() => {
  fetchData();
  window.addEventListener('tour-booking-updated', handleGlobalUpdate);
});

onUnmounted(() => {
  window.removeEventListener('tour-booking-updated', handleGlobalUpdate);
});
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
  padding: 16px 20px;
  border-bottom: 1px solid var(--theme--border-color-subdued);
  background: var(--theme--background-subdued);
}

.title-group { display: flex; align-items: center; gap: 12px; }
.header-icon { color: var(--theme--primary); }
.text-group { display: flex; flex-direction: column; }
.text-group h3 { margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--theme--foreground); line-height: 1.2; }
.subtitle { font-size: 0.75rem; color: var(--theme--foreground-subdued); font-weight: 600; }

.badge.count { background: var(--theme--primary); color: white; font-weight: 800; padding: 2px 10px; border-radius: 12px; font-size: 0.85rem; }

.booking-list {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  align-content: start;
  padding: 16px;
  gap: 12px;
}

.booking-item { 
  background: var(--theme--background); 
  border: 1px solid var(--theme--border-color-subdued); 
  border-radius: 10px; 
  display: flex; 
  align-items: stretch; 
  transition: all 0.2s; 
  position: relative;
  overflow: hidden;
}

.booking-item:hover { 
  border-color: var(--theme--primary);
  box-shadow: 0 6px 16px rgba(0,0,0,0.06); 
}

.status-indicator {
  width: 4px;
  background: var(--theme--primary);
}

.booking-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.client-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.client-name { 
  font-weight: 800; 
  font-size: 1rem; 
  color: var(--theme--foreground);
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
}

.tour-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: var(--theme--primary);
  background: var(--theme--primary-subdued);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
  width: fit-content;
}

.appointment-details {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--theme--foreground-subdued);
  font-weight: 600;
}

.detail-item.tickets {
  color: var(--theme--foreground);
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 16px;
}

.no-data { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  color: var(--theme--foreground-subdued); 
  padding: 40px; 
  text-align: center; 
}

.icon-wrapper { 
  color: var(--theme--success); 
  background: var(--theme--success-subdued);
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.subtext {
  font-size: 0.85rem;
  opacity: 0.7;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 16px;
  color: var(--theme--foreground-subdued);
}
</style>

