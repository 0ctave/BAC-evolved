<template>
  <div class="tours-dashboard">
    <!-- SECTION 1: CONFIRMATION (Top, full width) -->
    <section class="confirmation-section">
      <TourConfirmation />
    </section>

    <!-- SECTION 2: PLANNING (Per Visite Type) -->
    <section class="planning-section">
      <div class="header">
        <div class="title-group">
          <h2>Planning des Visites</h2>
          <span class="subtitle">Gérez vos créneaux par type de visite</span>
        </div>

        <div class="header-actions">
          <button class="btn-outline" @click="showCreateVisiteModal = true">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            <span class="mobile-hide">Type de visite</span>
          </button>
          <button class="btn-primary" @click="showCreateSlotModal = true">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>
            <span class="mobile-hide">Nouveau créneau</span>
          </button>
          <button class="refresh-btn" @click="fetchData" :disabled="loading" aria-label="Actualiser">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
          </button>
        </div>
      </div>

      <div v-if="loading && slots.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>Chargement du planning...</p>
      </div>

      <div v-else-if="visitesList.length === 0" class="empty-state">
        <svg class="icon-huge" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
        <h3>Aucun type de visite</h3>
        <p>Commencez par créer un type de visite pour programmer des créneaux.</p>
        <button class="btn-primary mt-4" @click="showCreateVisiteModal = true">Créer un type de visite</button>
      </div>

      <!-- STANDALONE CONTAINER FOR EACH VISIT TYPE -->
      <div v-else class="tour-types-grid">
        <div v-for="visite in visitesList" :key="visite.id" class="tour-type-container">
          <div class="tour-type-header">
            <div class="tour-icon-bg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>
            </div>
            <div class="tour-type-title">
              <h3>{{ visite.nom }}</h3>
              <span class="tour-type-meta">{{ getSlotCount(visite.id) }} créneau(x) programmés</span>
            </div>
          </div>

          <div class="slots-container">
            <div v-if="getVisiteSlots(visite.id).length === 0" class="no-slots">
              Aucun créneau prévu pour cette visite.
            </div>
            <div v-else class="slots-grid">
              <div
                  v-for="slot in getVisiteSlots(visite.id)"
                  :key="slot.id"
                  class="slot-card"
                  @click="openSlot(slot)"
              >
                <div class="slot-time-badge">
                  <span class="slot-date">{{ formatShortDate(slot.date_heure_debut) }}</span>
                  <span class="slot-time">{{ formatTime(slot.date_heure_debut) }}</span>
                </div>

                <div class="slot-progress">
                  <div class="progress-labels">
                    <span>{{ getSlotReservedCount(slot.id) }} / {{ getSlotMaxCapacity(slot) }}</span>
                    <span v-if="getSlotPendingCount(slot.id) > 0" class="pending-tag">
                      +{{ getSlotPendingCount(slot.id) }} en attente
                    </span>
                  </div>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :class="getCapacityColorClass(slot)"
                      :style="{ width: getCapacityPercentage(slot) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- DRAWER: CRÉNEAU DETAILS -->
    <transition name="slide">
      <div v-if="selectedSlot" class="side-drawer" @click.stop>
        <div class="drawer-header">
          <div>
            <span class="drawer-surtitle">{{ formatFullDate(selectedSlot.date_heure_debut) }} à {{ formatTime(selectedSlot.date_heure_debut) }}</span>
            <h3>{{ getVisiteName(selectedSlot) }}</h3>
          </div>
          <button class="close-btn" @click="closeDrawer" aria-label="Fermer">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="drawer-stats">
          <div class="stat-circle" :class="getCapacityColorClass(selectedSlot)">
            <span class="stat-val">{{ getSlotReservedCount(selectedSlot.id) }}</span>
            <span class="stat-max">/ {{ getSlotMaxCapacity(selectedSlot) }}</span>
          </div>
          <div class="stat-text">
            <strong>Places occupées</strong>
            <p v-if="getCapacityPercentage(selectedSlot) >= 100">Ce créneau est complet.</p>
            <p v-else>Il reste {{ getSlotMaxCapacity(selectedSlot) - getSlotReservedCount(selectedSlot.id) }} place(s) disponible(s).</p>
          </div>
        </div>

        <div class="drawer-content">
          <div class="section-header">
            <h4>Participants</h4>
            <button class="btn-add-manual" @click="isAddingManual = !isAddingManual">
              {{ isAddingManual ? 'Fermer' : 'Ajouter' }}
            </button>
          </div>

          <!-- MANUAL ADD FORM -->
          <div v-if="isAddingManual" class="manual-add-card">
            <div class="client-toggle">
              <button class="toggle-btn" :class="{ active: !isNewClient }" @click="isNewClient = false">Existant</button>
              <button class="toggle-btn" :class="{ active: isNewClient }" @click="isNewClient = true">Nouveau</button>
            </div>

            <div v-if="!isNewClient" class="form-group">
              <select v-model="manualForm.client_id" class="form-input">
                <option value="">-- Sélectionner un client --</option>
                <option v-for="client in clientsList" :key="client.id" :value="client.id">
                  {{ client.prenom }} {{ client.nom }}
                </option>
              </select>
            </div>

            <div v-else class="new-client-form">
              <div class="form-row">
                <input type="text" v-model="clientForm.prenom" class="form-input" placeholder="Prénom" />
                <input type="text" v-model="clientForm.nom" class="form-input" placeholder="Nom" />
              </div>
              <input type="email" v-model="clientForm.email" class="form-input mt-2" placeholder="Email" />
            </div>

            <div class="ticket-counter mt-3">
              <label>Billets:</label>
              <button @click="manualForm.quantite--" :disabled="manualForm.quantite <= 1">-</button>
              <span>{{ manualForm.quantite }}</span>
              <button @click="manualForm.quantite++">+</button>
            </div>

            <div class="form-actions mt-3">
              <button class="btn-confirm w-full" @click="submitManualReservation" :disabled="submitting || !isManualFormValid">
                {{ submitting ? '...' : 'Valider' }}
              </button>
            </div>
          </div>

          <div v-if="getSlotBookings(selectedSlot.id).length === 0" class="no-data-small">
            Aucune réservation pour le moment.
          </div>

          <div v-else class="booking-list">
            <div
                v-for="booking in getSlotBookings(selectedSlot.id)"
                :key="booking.id"
                class="booking-card"
                :class="{ 'is-pending': booking.statut === 'en_attente' }"
            >
              <div class="b-header">
                <div class="b-client">
                  <strong>{{ getClientName(booking) }}</strong>
                </div>
                <div class="b-tickets">{{ booking.quantite_billets }} billets</div>
              </div>
              <div class="b-footer">
                <span class="status-dot" :class="booking.statut"></span>
                <span class="status-label">{{ getStatusLabel(booking.statut) }}</span>
                <div class="b-actions">
                  <button v-if="booking.statut === 'en_attente'" class="btn-confirm-small" @click="updateBookingStatus(booking, 'confirmee')">Confirmer</button>
                  <button class="btn-cancel-small" @click="deleteBooking(booking)">Annuler</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <div v-if="selectedSlot" class="drawer-backdrop" @click="closeDrawer"></div>

    <!-- MODALS -->
    <!-- Modal: New Visite Type -->
    <div v-if="showCreateVisiteModal" class="modal-overlay" @click.self="showCreateVisiteModal = false">
      <div class="modal-card">
        <h3>Nouveau Type de Visite</h3>
        <div class="modal-body">
          <div class="form-group">
            <label>Nom de la visite *</label>
            <input type="text" v-model="visiteForm.nom" class="form-input" />
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>Durée (min)</label>
              <input type="number" v-model="visiteForm.duree_minutes" class="form-input" />
            </div>
            <div class="form-group flex-1">
              <label>Prix (€)</label>
              <input type="number" v-model="visiteForm.prix_unitaire" class="form-input" />
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showCreateVisiteModal = false">Annuler</button>
          <button class="btn-confirm" @click="submitVisite" :disabled="creatingData || !visiteForm.nom">Créer</button>
        </div>
      </div>
    </div>

    <!-- Modal: New Slot -->
    <div v-if="showCreateSlotModal" class="modal-overlay" @click.self="showCreateSlotModal = false">
      <div class="modal-card">
        <h3>Ouvrir un nouveau créneau</h3>
        <div class="modal-body">
          <div class="form-group">
            <label>Type de visite *</label>
            <select v-model="slotForm.visite_id" class="form-input">
              <option value="" disabled>-- Sélectionner --</option>
              <option v-for="v in visitesList" :key="v.id" :value="v.id">{{ v.nom }}</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>Date *</label>
              <input type="date" v-model="slotForm.date" class="form-input" />
            </div>
            <div class="form-group flex-1">
              <label>Heure *</label>
              <input type="time" v-model="slotForm.time" class="form-input" />
            </div>
          </div>
          <div class="form-group">
            <label>Capacité max *</label>
            <input type="number" v-model="slotForm.capacite_max" class="form-input" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showCreateSlotModal = false">Annuler</button>
          <button class="btn-confirm" @click="submitSlot" :disabled="creatingData || !slotForm.visite_id || !slotForm.date">Ouvrir</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { config } from '../config';
import type { Visite, CreneauVisite, ReservationVisite, Client } from '../types';
import TourConfirmation from './tour-confirmation.vue';

const api = useApi();
const loading = ref(false);
const submitting = ref(false);
const creatingData = ref(false);

const slots = ref<CreneauVisite[]>([]);
const allBookings = ref<ReservationVisite[]>([]);
const clientsList = ref<Client[]>([]);
const visitesList = ref<Visite[]>([]);

const selectedSlot = ref<CreneauVisite | null>(null);

const isAddingManual = ref(false);
const isNewClient = ref(false);
const manualForm = ref({ client_id: '', quantite: 1 });
const clientForm = ref({ prenom: '', nom: '', email: '', numero: '', langue: 'fr' });

const showCreateVisiteModal = ref(false);
const visiteForm = ref({ nom: '', description: '', duree_minutes: 60, prix_unitaire: 10 });

const showCreateSlotModal = ref(false);
const slotForm = ref({ visite_id: '', date: '', time: '', capacite_max: 20 });

async function fetchData() {
  loading.value = true;
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch Visite Types
    const visitesRes = await api.get(`/items/${config.toursCollection}`, {
      params: { fields: ['id', 'nom', 'description', 'duree_minutes', 'prix_unitaire'], limit: -1, sort: 'nom' }
    });
    visitesList.value = visitesRes.data.data;

    // 2. Fetch Slots
    const slotsRes = await api.get(`/items/${config.tourSlotsCollection}`, {
      params: {
        filter: { date_heure_debut: { _gte: today } },
        sort: 'date_heure_debut',
        fields: ['*', `${config.visiteRelationField}.*`],
        limit: -1
      }
    });
    slots.value = slotsRes.data.data;

    // 3. Fetch Bookings for those slots
    if (slots.value.length > 0) {
      const bookingsRes = await api.get(`/items/${config.tourBookingsCollection}`, {
        params: {
          filter: { [config.slotRelationField]: { _in: slots.value.map(s => s.id) } },
          fields: ['*', 'client.*', `${config.slotRelationField}.id`],
          limit: -1
        }
      });
      allBookings.value = bookingsRes.data.data;
    } else {
      allBookings.value = [];
    }

    // 4. Fetch Clients for manual entries
    const clientsRes = await api.get(`/items/${config.clientsCollection}`, {
      params: { fields: ['id', 'nom', 'prenom', 'email'], limit: -1, sort: '-id' }
    });
    clientsList.value = clientsRes.data.data;

  } catch (err) {
    console.error("Fetch Error:", err);
  } finally {
    loading.value = false;
  }
}

function getVisiteSlots(visiteId: number) {
  return slots.value.filter(s => {
    const vId = typeof s[config.visiteRelationField as keyof CreneauVisite] === 'object'
        ? (s[config.visiteRelationField as keyof CreneauVisite] as any)?.id
        : s[config.visiteRelationField as keyof CreneauVisite];
    return vId === visiteId;
  });
}

function getSlotCount(visiteId: number) {
  return getVisiteSlots(visiteId).length;
}

function getSlotBookings(slotId: number) {
  return allBookings.value.filter(b => {
    const sId = typeof b[config.slotRelationField as keyof ReservationVisite] === 'object'
        ? (b[config.slotRelationField as keyof ReservationVisite] as any)?.id
        : b[config.slotRelationField as keyof ReservationVisite];
    return sId === slotId;
  });
}

function getSlotMaxCapacity(slot: CreneauVisite) {
  return slot.capacite_max || config.defaultMaxCapacity;
}

function getSlotReservedCount(slotId: number) {
  const bookings = getSlotBookings(slotId);
  return bookings
      .filter(b => ['confirmee', 'en_attente'].includes(normalizeStatus(b.statut)))
      .reduce((sum, b) => sum + (b.quantite_billets || 1), 0);
}

function getSlotPendingCount(slotId: number) {
  return getSlotBookings(slotId).filter(b => normalizeStatus(b.statut) === 'en_attente').length;
}

function getCapacityPercentage(slot: CreneauVisite) {
  const max = getSlotMaxCapacity(slot);
  return Math.min(100, Math.round((getSlotReservedCount(slot.id) / max) * 100));
}

function getCapacityColorClass(slot: CreneauVisite) {
  const pct = getCapacityPercentage(slot);
  if (pct >= 100) return 'is-full';
  if (pct >= 80) return 'is-warning';
  if (pct > 0) return 'is-active';
  return 'is-empty';
}

function normalizeStatus(val: string) {
  if (!val) return 'en_attente';
  const v = val.toLowerCase();
  if (v.includes('confirm')) return 'confirmee';
  if (v.includes('annul') || v.includes('cancel')) return 'annulee';
  return 'en_attente';
}

function getStatusLabel(val: string) {
  const s = normalizeStatus(val);
  if (s === 'confirmee') return 'Confirmée';
  if (s === 'en_attente') return 'En attente';
  if (s === 'annulee') return 'Annulée';
  return val;
}

function getVisiteName(slot: CreneauVisite) {
  return (slot[config.visiteRelationField as keyof CreneauVisite] as any)?.nom || 'Visite';
}

function getClientName(b: ReservationVisite) {
  const c = b.client as Client;
  if (typeof c === 'object' && c !== null) return `${c.prenom || ''} ${c.nom || ''}`.trim() || c.email || 'Inconnu';
  return 'Client';
}

function formatShortDate(d: string) { return d ? format(parseISO(d), 'EEE d MMM', { locale: fr }) : ''; }
function formatFullDate(d: string) { return d ? format(parseISO(d), 'EEEE d MMMM yyyy', { locale: fr }) : ''; }
function formatTime(d: string) { return d ? format(parseISO(d), 'HH:mm') : '--:--'; }

function openSlot(slot: CreneauVisite) {
  selectedSlot.value = slot;
  isAddingManual.value = false;
}

function closeDrawer() {
  selectedSlot.value = null;
}

async function updateBookingStatus(booking: ReservationVisite, newStatus: string) {
  try {
    await api.patch(`/items/${config.tourBookingsCollection}/${booking.id}`, { [config.statusField]: newStatus });
    await fetchData();
  } catch (e) { console.error(e); }
}

async function deleteBooking(booking: ReservationVisite) {
  if (!confirm("Annuler cette réservation ?")) return;
  try {
    await api.patch(`/items/${config.tourBookingsCollection}/${booking.id}`, { [config.statusField]: 'annulee' });
    await fetchData();
  } catch (e) { console.error(e); }
}

const isManualFormValid = computed(() => isNewClient.value ? (clientForm.value.prenom && clientForm.value.nom) : !!manualForm.value.client_id);

async function submitManualReservation() {
  if (!selectedSlot.value || !isManualFormValid.value) return;
  submitting.value = true;
  try {
    let finalClientId = manualForm.value.client_id;
    if (isNewClient.value) {
      const cRes = await api.post(`/items/${config.clientsCollection}`, clientForm.value);
      finalClientId = String(cRes.data.data.id);
    }
    await api.post(`/items/${config.tourBookingsCollection}`, {
      [config.slotRelationField]: selectedSlot.value.id,
      client: finalClientId,
      quantite_billets: manualForm.value.quantite,
      [config.statusField]: 'confirmee'
    });
    await fetchData();
    isAddingManual.value = false;
  } catch (err) { console.error(err); } finally { submitting.value = false; }
}

async function submitVisite() {
  creatingData.value = true;
  try {
    await api.post(`/items/${config.toursCollection}`, visiteForm.value);
    showCreateVisiteModal.value = false;
    await fetchData();
  } catch (err) { console.error(err); } finally { creatingData.value = false; }
}

async function submitSlot() {
  creatingData.value = true;
  try {
    await api.post(`/items/${config.tourSlotsCollection}`, {
      [config.visiteRelationField]: slotForm.value.visite_id,
      date_heure_debut: `${slotForm.value.date}T${slotForm.value.time}:00`,
      capacite_max: slotForm.value.capacite_max
    });
    showCreateSlotModal.value = false;
    await fetchData();
  } catch (err) { console.error(err); } finally { creatingData.value = false; }
}

function handleGlobalUpdate() { fetchData(); }

onMounted(() => {
  fetchData();
  window.addEventListener('tour-booking-updated', handleGlobalUpdate);
});

onUnmounted(() => {
  window.removeEventListener('tour-booking-updated', handleGlobalUpdate);
});
</script>

<style scoped>
.tours-dashboard { display: flex; flex-direction: column; gap: 32px; width: 100%; }
.header { display: flex; justify-content: space-between; align-items: center; }
.title-group h2 { margin: 0; font-size: 1.6rem; font-weight: 900; color: var(--theme--primary); }
.subtitle { color: var(--theme--foreground-subdued); font-size: 0.9rem; font-weight: 600; }
.header-actions { display: flex; gap: 12px; align-items: center; }

.btn-primary { background: var(--theme--primary); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-outline { background: transparent; border: 1px solid var(--theme--border-color); padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; }
.refresh-btn { background: var(--theme--background-subdued); border: 1px solid var(--theme--border-color); padding: 8px; border-radius: 8px; cursor: pointer; }
.spinning { animation: spin 1s linear infinite; }

/* TOUR TYPE CONTAINERS */
.tour-types-grid { display: flex; flex-direction: column; gap: 32px; }
.tour-type-container { background: var(--theme--background); border: 1px solid var(--theme--border-color-subdued); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
.tour-type-header { padding: 20px 24px; background: var(--theme--background-subdued); border-bottom: 1px solid var(--theme--border-color-subdued); display: flex; align-items: center; gap: 16px; }
.tour-icon-bg { background: var(--theme--primary-subdued); color: var(--theme--primary); width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.tour-type-title h3 { margin: 0; font-size: 1.2rem; font-weight: 800; }
.tour-type-meta { font-size: 0.8rem; color: var(--theme--foreground-subdued); font-weight: 600; }

.slots-container { padding: 24px; }
.slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.slot-card { background: var(--theme--background-subdued); border: 1px solid var(--theme--border-color-subdued); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s; }
.slot-card:hover { border-color: var(--theme--primary); transform: translateY(-2px); }

.slot-time-badge { display: flex; justify-content: space-between; margin-bottom: 12px; }
.slot-date { font-weight: 700; font-size: 0.85rem; color: var(--theme--foreground-subdued); }
.slot-time { font-weight: 900; color: var(--theme--primary); }

.progress-labels { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 800; margin-bottom: 6px; }
.pending-tag { color: var(--warning); }
.progress-bar { height: 6px; background: var(--theme--border-color); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; transition: width 0.3s; }
.progress-fill.is-active { background: var(--success); }
.progress-fill.is-warning { background: var(--warning); }
.progress-fill.is-full { background: var(--danger); }

/* DRAWER & OTHERS */
.side-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 440px; max-width: 100vw; background: var(--theme--background); z-index: 100; box-shadow: -10px 0 30px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
.drawer-header { padding: 24px; border-bottom: 1px solid var(--theme--border-color-subdued); display: flex; justify-content: space-between; }
.drawer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 90; }
.close-btn { background: none; border: none; cursor: pointer; }

.loading-state, .empty-state { padding: 64px; text-align: center; }
.spinner { width: 40px; height: 40px; border: 4px solid var(--theme--border-color-subdued); border-top-color: var(--theme--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
@keyframes spin { to { transform: rotate(360deg); } }

.slide-enter-active, .slide-leave-active { transition: transform 0.3s; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }

/* Rest of standard modal/form styles similar to room-calendar.vue */
.form-group { margin-bottom: 16px; }
.form-input { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--theme--border-color); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal-card { background: var(--theme--background); padding: 24px; border-radius: 12px; width: 400px; }
</style>
