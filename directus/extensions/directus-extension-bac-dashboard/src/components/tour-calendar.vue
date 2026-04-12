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
          <v-icon name="calendar_month" class="header-icon" />
          <div class="text-group">
            <h2>Planning des Visites</h2>
            <span class="subtitle">Gérez vos créneaux et disponibilités par type de visite</span>
          </div>
        </div>

        <div class="header-actions">
          <v-button secondary @click="showCreateVisiteModal = true">
            <v-icon name="add" left />
            Type de visite
          </v-button>
          <v-button @click="showCreateSlotModal = true">
            <v-icon name="event" left />
            Nouveau créneau
          </v-button>
          <v-button secondary icon @click="fetchData" :loading="loading">
            <v-icon name="refresh" />
          </v-button>
        </div>
      </div>

      <div v-if="loading && slots.length === 0" class="loading-state">
        <v-progress-circular indeterminate />
        <p>Chargement du planning...</p>
      </div>

      <div v-else-if="visitesList.length === 0" class="empty-state">
        <v-icon name="map" size="huge" />
        <h3>Aucun type de visite</h3>
        <p>Commencez par créer un type de visite pour programmer des créneaux.</p>
        <v-button class="mt-4" @click="showCreateVisiteModal = true">Créer un type de visite</v-button>
      </div>

      <!-- STANDALONE CONTAINER FOR EACH VISIT TYPE -->
      <div v-else class="tour-types-grid">
        <div v-for="visite in visitesList" :key="visite.id" class="tour-type-container">
          <div class="tour-type-header">
            <div class="tour-icon-bg">
              <v-icon name="confirmation_number" />
            </div>
            <div class="tour-type-title">
              <h3>{{ visite.nom }}</h3>
              <span class="tour-type-meta">{{ getSlotCount(visite.id) }} créneau(x) programmés</span>
            </div>
          </div>

          <div class="slots-container">
            <div v-if="getVisiteSlots(visite.id).length === 0" class="no-slots">
              <v-icon name="info" size="small" left />
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
                    <span class="capacity-text">{{ getSlotReservedCount(slot.id) }} / {{ getSlotMaxCapacity(slot) }}</span>
                    <span v-if="getSlotPendingCount(slot.id) > 0" class="pending-tag">
                      +{{ getSlotPendingCount(slot.id) }} en attente
                    </span>
                  </div>
                  <div class="progress-bar-container">
                    <v-progress-linear
                      :value="getCapacityPercentage(slot)"
                      :color="getCapacityColor(slot)"
                      height="8"
                      rounded
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- DRAWER: CRÉNEAU DETAILS -->
    <v-drawer
      v-if="selectedSlot"
      :model-value="!!selectedSlot"
      @update:model-value="closeDrawer"
      :title="getVisiteName(selectedSlot)"
      :subtitle="`${formatFullDate(selectedSlot.date_heure_debut)} à ${formatTime(selectedSlot.date_heure_debut)}`"
      icon="event"
    >
      <template #actions>
        <v-button secondary icon v-tooltip="'Supprimer ce créneau'" danger @click="deleteSlot(selectedSlot)">
          <v-icon name="delete" />
        </v-button>
      </template>

      <div class="drawer-content-inner">
        <!-- CAPACITY CARD -->
        <div class="info-card capacity-card">
          <div class="card-header">
            <v-icon name="groups" left />
            <h4>Capacité et Remplissage</h4>
          </div>
          <div class="capacity-stats">
            <div class="stat-main">
              <span class="stat-value">{{ getSlotReservedCount(selectedSlot.id) }}</span>
              <span class="stat-label">Participants</span>
            </div>
            <div class="stat-divider">/</div>
            <div class="stat-total" @click="startEditingCapacity">
              <v-input
                v-if="isEditingCapacity"
                v-model="editingCapacityValue"
                type="number"
                size="small"
                @blur="saveCapacity"
                @keyup.enter="saveCapacity"
                autofocus
              />
              <span v-else class="stat-value clickable">
                {{ getSlotMaxCapacity(selectedSlot) }}
                <v-icon name="edit" size="x-small" />
              </span>
              <span class="stat-label">Maximum</span>
            </div>
          </div>
          <v-progress-linear
            :value="getCapacityPercentage(selectedSlot)"
            :color="getCapacityColor(selectedSlot)"
            height="12"
            rounded
            class="mt-4"
          />
        </div>

        <!-- PARTICIPANTS SECTION -->
        <div class="participants-section">
          <div class="section-header">
            <div class="title-with-badge">
              <h4>Participants</h4>
              <v-badge :content="String(getSlotBookings(selectedSlot.id).length)" />
            </div>
            <v-button secondary size="small" @click="isAddingManual = !isAddingManual">
              <v-icon :name="isAddingManual ? 'close' : 'person_add'" left />
              {{ isAddingManual ? 'Annuler' : 'Ajouter' }}
            </v-button>
          </div>

          <!-- MANUAL ADD FORM -->
          <v-notice v-if="isAddingManual" class="manual-add-notice" type="info">
            <div class="manual-form">
              <v-select
                v-model="isNewClient"
                :items="[{text: 'Client existant', value: false}, {text: 'Nouveau client', value: true}]"
                inline
                class="mb-3"
              />

              <div v-if="!isNewClient" class="form-field">
                <v-select
                  v-model="manualForm.client_id"
                  :items="clientsList.map(c => ({ text: `${c.prenom} ${c.nom}`, value: String(c.id) }))"
                  placeholder="Sélectionner un client"
                />
              </div>

              <div v-else class="new-client-fields">
                <div class="v-form-grid">
                  <v-input v-model="clientForm.prenom" placeholder="Prénom" />
                  <v-input v-model="clientForm.nom" placeholder="Nom" />
                </div>
                <v-input v-model="clientForm.email" placeholder="Email" class="mt-2" />
              </div>

              <div class="ticket-picker mt-3">
                <span class="label">Nombre de billets:</span>
                <div class="counter">
                  <v-button secondary icon size="small" @click="manualForm.quantite--" :disabled="manualForm.quantite <= 1">
                    <v-icon name="remove" />
                  </v-button>
                  <span class="count-val">{{ manualForm.quantite }}</span>
                  <v-button secondary icon size="small" @click="manualForm.quantite++">
                    <v-icon name="add" />
                  </v-button>
                </div>
              </div>

              <v-button class="mt-4 w-full" @click="submitManualReservation" :loading="submitting" :disabled="!isManualFormValid">
                Valider la réservation
              </v-button>
            </div>
          </v-notice>

          <div v-if="getSlotBookings(selectedSlot.id).length === 0" class="empty-list-notice">
            <v-icon name="group_off" size="large" />
            <p>Aucune réservation sur ce créneau</p>
          </div>

          <div v-else class="booking-list-vertical">
            <div
                v-for="booking in getSlotBookings(selectedSlot.id)"
                :key="booking.id"
                class="booking-row"
                :class="{ 'is-pending': normalizeStatus(booking.statut) === 'en_attente' }"
            >
              <div class="booking-main">
                <div class="booking-client">
                  <strong>{{ getClientName(booking) }}</strong>
                  <span class="booking-meta">{{ booking.quantite_billets }} billet(s) • {{ formatDateCreated(booking.date_created) }}</span>
                </div>
                <v-chip size="x-small" :color="getStatusColor(booking.statut)" class="status-chip">
                  {{ getStatusLabel(booking.statut) }}
                </v-chip>
              </div>
              
              <div class="booking-actions">
                <v-button
                  v-if="normalizeStatus(booking.statut) === 'en_attente'"
                  secondary
                  size="x-small"
                  color="var(--theme--success)"
                  @click="updateBookingStatus(booking, 'confirmee')"
                >
                  Confirmer
                </v-button>
                <v-button
                  secondary
                  size="x-small"
                  danger
                  icon
                  v-tooltip="'Annuler la réservation'"
                  @click="deleteBooking(booking)"
                >
                  <v-icon name="close" size="small" />
                </v-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <v-button secondary @click="closeDrawer">Fermer</v-button>
      </template>
    </v-drawer>

    <!-- MODALS -->
    <!-- Modal: New Visite Type -->
    <v-dialog :model-value="showCreateVisiteModal" @update:model-value="showCreateVisiteModal = false" title="Nouveau Type de Visite">
      <div class="v-form">
        <div class="field">
          <div class="type-label">Nom de la visite</div>
          <v-input v-model="visiteForm.nom" placeholder="Ex: Bordeaux Historique" />
        </div>
        <div class="v-form-grid mt-4">
          <div class="field">
            <div class="type-label">Durée (min)</div>
            <v-input type="number" v-model="visiteForm.duree_minutes" />
          </div>
          <div class="field">
            <div class="type-label">Prix (€)</div>
            <v-input type="number" v-model="visiteForm.prix_unitaire" />
          </div>
        </div>
      </div>
      <template #actions>
        <v-button secondary @click="showCreateVisiteModal = false">Annuler</v-button>
        <v-button @click="submitVisite" :loading="creatingData" :disabled="!visiteForm.nom">Créer</v-button>
      </template>
    </v-dialog>

    <!-- Modal: New Slot -->
    <v-dialog :model-value="showCreateSlotModal" @update:model-value="showCreateSlotModal = false" title="Ouvrir un nouveau créneau">
      <div class="v-form">
        <div class="field">
          <div class="type-label">Type de visite</div>
          <v-select
            v-model="slotForm.visite_id"
            :items="visitesList.map(v => ({ text: v.nom, value: v.id }))"
            placeholder="Sélectionner une visite"
          />
        </div>
        <div class="v-form-grid mt-4">
          <div class="field">
            <div class="type-label">Date</div>
            <v-input type="date" v-model="slotForm.date" />
          </div>
          <div class="field">
            <div class="type-label">Heure</div>
            <v-input type="time" v-model="slotForm.time" />
          </div>
        </div>
        <div class="field mt-4">
          <div class="type-label">Capacité max</div>
          <v-input type="number" v-model="slotForm.capacite_max" />
        </div>
      </div>
      <template #actions>
        <v-button secondary @click="showCreateSlotModal = false">Annuler</v-button>
        <v-button @click="submitSlot" :loading="creatingData" :disabled="!slotForm.visite_id || !slotForm.date">Ouvrir</v-button>
      </template>
    </v-dialog>
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

const isEditingCapacity = ref(false);
const editingCapacityValue = ref(20);

async function fetchData() {
  loading.value = true;
  try {
    const today = new Date().toISOString().split('T')[0];

    const visitesRes = await api.get(`/items/${config.toursCollection}`, {
      params: { fields: ['id', 'nom', 'description', 'duree_minutes', 'prix_unitaire'], limit: -1, sort: 'nom' }
    });
    visitesList.value = visitesRes.data.data;

    const slotsRes = await api.get(`/items/${config.tourSlotsCollection}`, {
      params: {
        filter: { date_heure_debut: { _gte: today } },
        sort: 'date_heure_debut',
        fields: ['*', `${config.visiteRelationField}.*`],
        limit: -1
      }
    });
    slots.value = slotsRes.data.data;

    if (slots.value.length > 0) {
      const bookingsRes = await api.get(`/items/${config.tourBookingsCollection}`, {
        params: {
          filter: { 
            [config.slotRelationField]: { _in: slots.value.map(s => s.id) },
            [config.statusField]: { _neq: 'annulee' }
          },
          fields: ['*', 'client.*', `${config.slotRelationField}.id`],
          limit: -1
        }
      });
      allBookings.value = bookingsRes.data.data;
    } else {
      allBookings.value = [];
    }

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

function getCapacityColor(slot: CreneauVisite) {
  const pct = getCapacityPercentage(slot);
  if (pct >= 100) return 'var(--theme--danger)';
  if (pct >= 80) return 'var(--theme--warning)';
  return 'var(--theme--success)';
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

function getStatusColor(val: string) {
  const s = normalizeStatus(val);
  if (s === 'confirmee') return 'var(--theme--success)';
  if (s === 'en_attente') return 'var(--theme--warning)';
  return 'var(--theme--foreground-subdued)';
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
function formatDateCreated(d: string) { return d ? format(parseISO(d), 'd/MM HH:mm', { locale: fr }) : ''; }

function openSlot(slot: CreneauVisite) {
  selectedSlot.value = slot;
  isAddingManual.value = false;
  isEditingCapacity.value = false;
  editingCapacityValue.value = slot.capacite_max;
}

function closeDrawer() {
  selectedSlot.value = null;
}

function startEditingCapacity() {
  isEditingCapacity.value = true;
  editingCapacityValue.value = selectedSlot.value?.capacite_max || 20;
}

async function saveCapacity() {
  if (!selectedSlot.value) return;
  try {
    await api.patch(`/items/${config.tourSlotsCollection}/${selectedSlot.value.id}`, {
      capacite_max: editingCapacityValue.value
    });
    selectedSlot.value.capacite_max = editingCapacityValue.value;
    fetchData();
  } catch (e) { console.error(e); }
  finally { isEditingCapacity.value = false; }
}

async function deleteSlot(slot: CreneauVisite) {
  const bookingsCount = getSlotBookings(slot.id).length;
  let message = "Voulez-vous vraiment supprimer ce créneau ?";
  if (bookingsCount > 0) {
    message = `ATTENTION: Ce créneau contient ${bookingsCount} réservation(s). La suppression du créneau n'annulera pas forcément les réservations dans la base mais elles n'auront plus de créneau rattaché. Continuer ?`;
  }
  
  if (!confirm(message)) return;
  
  try {
    await api.delete(`/items/${config.tourSlotsCollection}/${slot.id}`);
    closeDrawer();
    await fetchData();
  } catch (e) {
    alert("Erreur lors de la suppression. Il est possible que des réservations y soient liées.");
    console.error(e);
  }
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
    showCreateSlotModal = false;
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

.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.title-group { display: flex; align-items: center; gap: 16px; }
.header-icon { color: var(--theme--primary); font-size: 32px; }
.text-group h2 { margin: 0; font-size: 1.8rem; font-weight: 900; color: var(--theme--foreground); line-height: 1.1; }
.subtitle { color: var(--theme--foreground-subdued); font-size: 1rem; font-weight: 600; }
.header-actions { display: flex; gap: 12px; align-items: center; }

/* TOUR TYPE CONTAINERS */
.tour-types-grid { display: flex; flex-direction: column; gap: 24px; }
.tour-type-container { 
  background: var(--theme--background); 
  border: 1px solid var(--theme--border-color-subdued); 
  border-radius: 16px; 
  overflow: hidden; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.03); 
}
.tour-type-header { 
  padding: 20px 24px; 
  background: var(--theme--background-subdued); 
  border-bottom: 1px solid var(--theme--border-color-subdued); 
  display: flex; 
  align-items: center; 
  gap: 16px; 
}
.tour-icon-bg { 
  background: var(--theme--primary-subdued); 
  color: var(--theme--primary); 
  width: 44px; 
  height: 44px; 
  border-radius: 12px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
}
.tour-type-title h3 { margin: 0; font-size: 1.3rem; font-weight: 800; color: var(--theme--foreground); }
.tour-type-meta { font-size: 0.85rem; color: var(--theme--foreground-subdued); font-weight: 600; }

.slots-container { padding: 24px; }
.no-slots { 
  display: flex; 
  align-items: center; 
  color: var(--theme--foreground-subdued); 
  font-weight: 600; 
  padding: 12px;
  background: var(--theme--background-subdued);
  border-radius: 8px;
  font-style: italic;
}
.slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }

.slot-card { 
  background: var(--theme--background); 
  border: 2px solid var(--theme--border-color-subdued); 
  border-radius: 14px; 
  padding: 18px; 
  cursor: pointer; 
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.slot-card:hover { 
  border-color: var(--theme--primary); 
  transform: translateY(-4px); 
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

.slot-time-badge { display: flex; justify-content: space-between; align-items: baseline; }
.slot-date { font-weight: 700; font-size: 0.9rem; color: var(--theme--foreground-subdued); }
.slot-time { font-weight: 900; color: var(--theme--primary); font-size: 1.2rem; }

.progress-labels { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; font-weight: 800; margin-bottom: 8px; }
.capacity-text { color: var(--theme--foreground); }
.pending-tag { color: var(--theme--warning); background: var(--theme--warning-subdued); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; }

/* DRAWER INNER */
.drawer-content-inner { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
.info-card { 
  background: var(--theme--background-subdued); 
  border-radius: 12px; 
  padding: 20px; 
  border: 1px solid var(--theme--border-color-subdued);
}
.card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; color: var(--theme--foreground-subdued); }
.card-header h4 { margin: 0; font-size: 0.9rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }

.capacity-stats { display: flex; align-items: center; justify-content: center; gap: 24px; margin: 10px 0; }
.stat-main, .stat-total { display: flex; flex-direction: column; align-items: center; }
.stat-value { font-size: 2.2rem; font-weight: 900; line-height: 1; color: var(--theme--foreground); }
.stat-label { font-size: 0.75rem; font-weight: 700; color: var(--theme--foreground-subdued); margin-top: 4px; }
.stat-divider { font-size: 1.5rem; color: var(--theme--border-color); font-weight: 300; }
.clickable { cursor: pointer; color: var(--theme--primary); border-bottom: 2px dashed var(--theme--primary-subdued); }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.title-with-badge { display: flex; align-items: center; gap: 12px; }
.title-with-badge h4 { margin: 0; font-size: 1.1rem; font-weight: 800; }

.manual-add-notice { margin-bottom: 20px; }
.manual-form { display: flex; flex-direction: column; gap: 12px; }
.ticket-picker { display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--theme--background); border-radius: 8px; }
.ticket-picker .label { font-weight: 700; font-size: 0.9rem; }
.counter { display: flex; align-items: center; gap: 16px; }
.count-val { font-weight: 900; font-size: 1.1rem; min-width: 20px; text-align: center; }

.empty-list-notice { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  padding: 40px 20px; 
  color: var(--theme--foreground-subdued); 
  text-align: center; 
}
.empty-list-notice p { margin-top: 12px; font-weight: 600; }

.booking-list-vertical { display: flex; flex-direction: column; gap: 10px; }
.booking-row { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 14px; 
  background: var(--theme--background); 
  border: 1px solid var(--theme--border-color-subdued); 
  border-radius: 10px; 
  transition: border-color 0.2s;
}
.booking-row:hover { border-color: var(--theme--primary-subdued); }
.booking-row.is-pending { border-left: 4px solid var(--theme--warning); }

.booking-main { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.booking-client { display: flex; flex-direction: column; }
.booking-client strong { font-size: 0.95rem; color: var(--theme--foreground); }
.booking-meta { font-size: 0.75rem; color: var(--theme--foreground-subdued); font-weight: 600; }
.status-chip { width: fit-content; margin-top: 4px; }

.booking-actions { display: flex; gap: 8px; }

/* SHARED */
.loading-state, .empty-state { padding: 80px; text-align: center; color: var(--theme--foreground-subdued); }
.empty-state h3 { margin: 16px 0 8px; color: var(--theme--foreground); }

.v-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.type-label { font-size: 0.8rem; font-weight: 700; color: var(--theme--foreground-subdued); margin-bottom: 6px; text-transform: uppercase; }

.w-full { width: 100%; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.mb-3 { margin-bottom: 12px; }
</style>