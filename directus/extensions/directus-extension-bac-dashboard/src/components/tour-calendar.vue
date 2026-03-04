<template>
  <div class="tours-container">

    <!-- En-tête -->
    <div class="header">
      <div class="title-group">
        <h2>Planning des Visites</h2>
        <span class="subtitle">Aperçu des créneaux et réservations</span>
      </div>
      <button class="refresh-btn" @click="fetchData" :disabled="loading">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
        <span class="mobile-hide">Actualiser</span>
      </button>
    </div>

    <!-- Alertes : Réservations en attente -->
    <div class="pending-alerts" v-if="globalPendingBookings.length > 0">
      <div class="alert-box">
        <div class="alert-icon">
          <span class="material-icons">notification_important</span>
        </div>
        <div class="alert-content">
          <strong>{{ globalPendingBookings.length }} réservation(s) de visite en attente.</strong>
          <span>Veuillez ouvrir les créneaux concernés pour les confirmer.</span>
        </div>
      </div>
    </div>

    <!-- État de chargement -->
    <div v-if="loading && slots.length === 0" class="empty-state">
      <div class="spinner"></div>
      <p>Chargement du planning...</p>
    </div>

    <!-- État vide -->
    <div v-else-if="slots.length === 0" class="empty-state">
      <span class="material-icons icon-huge">event_busy</span>
      <h3>Aucun créneau à venir</h3>
      <p>Vous n'avez pas de visites prévues dans les prochains jours.</p>
    </div>

    <!-- Timeline des créneaux -->
    <div v-else class="timeline-container">
      <div v-for="(group, dateStr) in groupedSlots" :key="dateStr" class="date-group">
        <div class="date-header">
          <div class="date-badge">
            <span class="day-num">{{ formatDayNum(dateStr) }}</span>
            <span class="day-month">{{ formatMonthStr(dateStr) }}</span>
          </div>
          <h3 class="date-title">{{ formatFullDate(dateStr) }}</h3>
        </div>

        <div class="slots-grid">
          <div
              v-for="slot in group"
              :key="slot.id"
              class="slot-card"
              @click="openSlot(slot)"
          >
            <div class="slot-time">
              <span class="material-icons time-icon">schedule</span>
              {{ formatTime(slot.date_heure_debut) }}
            </div>

            <div class="slot-info">
              <h4 class="tour-name">{{ slot.visite_id?.nom || 'Visite Standard' }}</h4>

              <div class="capacity-section">
                <div class="capacity-labels">
                  <span class="reserved-count">
                    <strong>{{ getSlotReservedCount(slot.id) }}</strong> réservés
                  </span>
                  <span class="max-count">/ {{ getSlotMaxCapacity(slot) }} places</span>
                </div>

                <div class="progress-bar-bg">
                  <div
                      class="progress-bar-fill"
                      :class="getCapacityColorClass(slot)"
                      :style="{ width: getCapacityPercentage(slot) + '%' }"
                  ></div>
                </div>
              </div>

              <!-- Badges de statut du créneau -->
              <div class="slot-badges">
                <span v-if="getSlotPendingCount(slot.id) > 0" class="badge pending">
                  {{ getSlotPendingCount(slot.id) }} en attente
                </span>
                <span v-if="getCapacityPercentage(slot) >= 100" class="badge full">
                  Complet
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TIROIR : DÉTAILS DU CRÉNEAU ET RÉSERVATIONS -->
    <transition name="slide">
      <div v-if="selectedSlot" class="side-drawer" @click.stop>

        <div class="drawer-header">
          <div>
            <span class="drawer-surtitle">{{ formatFullDate(selectedSlot.date_heure_debut) }} à {{ formatTime(selectedSlot.date_heure_debut) }}</span>
            <h3>{{ selectedSlot.visite_id?.nom || 'Détails du créneau' }}</h3>
          </div>
          <button class="close-btn" @click="closeDrawer">×</button>
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
            <h4>Liste des participants</h4>
            <button class="btn-add-manual" @click="isAddingManual = !isAddingManual">
              <span class="material-icons">add</span>
              Ajouter
            </button>
          </div>

          <!-- FORMULAIRE D'AJOUT MANUEL -->
          <div v-if="isAddingManual" class="manual-add-card">
            <h5>Nouvelle Réservation (Hors-ligne)</h5>

            <div class="form-group">
              <label>Client</label>
              <select v-model="manualForm.client_id" class="form-input">
                <option value="">-- Sélectionner un client --</option>
                <option v-for="client in clientsList" :key="client.id" :value="client.id">
                  {{ client.prenom }} {{ client.nom }} ({{ client.email }})
                </option>
              </select>
              <small class="form-hint">Le client doit être préalablement enregistré dans la base.</small>
            </div>

            <div class="form-group">
              <label>Nombre de billets</label>
              <div class="ticket-counter">
                <button class="counter-btn" @click="manualForm.quantite--" :disabled="manualForm.quantite <= 1">-</button>
                <span class="counter-val">{{ manualForm.quantite }}</span>
                <button class="counter-btn" @click="manualForm.quantite++" :disabled="getSlotReservedCount(selectedSlot.id) + manualForm.quantite >= getSlotMaxCapacity(selectedSlot)">+</button>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn-cancel" @click="isAddingManual = false">Annuler</button>
              <button class="btn-confirm" @click="submitManualReservation" :disabled="submitting || !manualForm.client_id">
                {{ submitting ? 'Création...' : 'Valider la réservation' }}
              </button>
            </div>
          </div>

          <!-- LISTE DES RÉSERVATIONS -->
          <div v-if="getSlotBookings(selectedSlot.id).length === 0" class="no-data-small">
            Personne n'a encore réservé ce créneau.
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
                  <span class="material-icons">person</span>
                  {{ getClientName(booking) }}
                </div>
                <div class="b-tickets">
                  <strong>{{ booking.quantite_billets || 1 }}</strong> billet(s)
                </div>
              </div>

              <div class="b-footer">
                <div class="b-status" :class="normalizeStatus(booking.statut)">
                  {{ getStatusLabel(booking.statut) }}
                </div>

                <div class="b-actions">
                  <button v-if="booking.statut === 'en_attente'" class="btn-quick-confirm" @click="updateBookingStatus(booking, 'confirmee')">
                    Confirmer
                  </button>
                  <button v-else class="btn-text-danger" @click="deleteBooking(booking)">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </transition>

    <!-- Overlay sombre quand le tiroir est ouvert -->
    <div v-if="selectedSlot" class="drawer-backdrop" @click="closeDrawer"></div>

  </div>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk';
import { ref, onMounted, computed } from 'vue';
import { format, parseISO, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';

// Configuration de la base de données (Assurez-vous que ces noms correspondent à vos collections exactes)
const config = {
  slotsCollection: 'creneaux_visites',
  bookingsCollection: 'reservations_visite',
  clientsCollection: 'clients', // Assumé basé sur le besoin d'ajouter un client manuellement
  slotRelationField: 'creneau_visite', // Le champ dans reservations_visite qui pointe vers creneaux_visites
  statusField: 'statut',
  defaultMaxCapacity: 20
};

const api = useApi();
const loading = ref(false);
const submitting = ref(false);

const slots = ref<any[]>([]);
const allBookings = ref<any[]>([]);
const clientsList = ref<any[]>([]);

const selectedSlot = ref<any | null>(null);
const isAddingManual = ref(false);
const manualForm = ref({ client_id: '', quantite: 1 });

// --- FETCH DATA ---
async function fetchData() {
  loading.value = true;
  try {
    // 1. Récupérer les créneaux à partir d'aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    const slotsRes = await api.get(`/items/${config.slotsCollection}`, {
      params: {
        filter: { date_heure_debut: { _gte: today } },
        sort: 'date_heure_debut',
        fields: ['*', 'visite_id.nom', 'visite_id.capacite_max'],
        limit: -1
      }
    });
    slots.value = slotsRes.data.data;

    // 2. S'il y a des créneaux, récupérer TOUTES leurs réservations
    if (slots.value.length > 0) {
      const slotIds = slots.value.map(s => s.id);
      const bookingsRes = await api.get(`/items/${config.bookingsCollection}`, {
        params: {
          filter: { [config.slotRelationField]: { _in: slotIds } },
          fields: ['*', 'client.*'],
          limit: -1
        }
      });
      allBookings.value = bookingsRes.data.data;
    } else {
      allBookings.value = [];
    }

    // 3. Charger la liste des clients pour le formulaire manuel
    const clientsRes = await api.get(`/items/${config.clientsCollection}`, {
      params: { fields: ['id', 'nom', 'prenom', 'email'], limit: 100 }
    });
    clientsList.value = clientsRes.data.data;

  } catch (err) {
    console.error("Erreur lors du chargement des visites:", err);
  } finally {
    loading.value = false;
  }
}

// --- COMPUTED / LOGIQUE D'AFFICHAGE ---

// Grouper les créneaux par date (ex: "2026-03-04")
const groupedSlots = computed(() => {
  const groups: Record<string, any[]> = {};
  slots.value.forEach(slot => {
    if(!slot.date_heure_debut) return;
    const dateKey = slot.date_heure_debut.split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(slot);
  });
  return groups;
});

const globalPendingBookings = computed(() => {
  return allBookings.value.filter(b => normalizeStatus(b[config.statusField]) === 'en_attente');
});

function getSlotBookings(slotId: number | string) {
  return allBookings.value.filter(b => {
    const sId = typeof b[config.slotRelationField] === 'object' ? b[config.slotRelationField]?.id : b[config.slotRelationField];
    return sId === slotId;
  });
}

function getSlotMaxCapacity(slot: any) {
  return slot.capacite_max || slot.visite_id?.capacite_max || config.defaultMaxCapacity;
}

function getSlotReservedCount(slotId: number | string) {
  const bookings = getSlotBookings(slotId);
  // On ne compte que les confirmés ou en attente (on ignore les annulés)
  const activeBookings = bookings.filter(b => {
    const s = normalizeStatus(b[config.statusField]);
    return s === 'confirmee' || s === 'en_attente';
  });

  return activeBookings.reduce((total, b) => total + (b.quantite_billets || 1), 0);
}

function getSlotPendingCount(slotId: number | string) {
  const bookings = getSlotBookings(slotId);
  return bookings.filter(b => normalizeStatus(b[config.statusField]) === 'en_attente').length;
}

function getCapacityPercentage(slot: any) {
  const max = getSlotMaxCapacity(slot);
  const reserved = getSlotReservedCount(slot.id);
  if (max === 0) return 0;
  const pct = Math.round((reserved / max) * 100);
  return pct > 100 ? 100 : pct;
}

function getCapacityColorClass(slot: any) {
  const pct = getCapacityPercentage(slot);
  if (pct >= 100) return 'is-full';
  if (pct >= 80) return 'is-warning';
  if (pct > 0) return 'is-active';
  return 'is-empty';
}

// --- ACTIONS ---

function openSlot(slot: any) {
  selectedSlot.value = slot;
  isAddingManual.value = false;
  manualForm.value = { client_id: '', quantite: 1 };
}

function closeDrawer() {
  selectedSlot.value = null;
  isAddingManual.value = false;
}

async function updateBookingStatus(booking: any, newStatus: string) {
  const oldStatus = booking[config.statusField];
  booking[config.statusField] = newStatus; // Optimistic update
  try {
    await api.patch(`/items/${config.bookingsCollection}/${booking.id}`, { [config.statusField]: newStatus });
  } catch (e) {
    booking[config.statusField] = oldStatus;
    alert("Erreur lors de la mise à jour");
  }
}

async function deleteBooking(booking: any) {
  if(!confirm("Annuler définitivement cette réservation de visite ?")) return;
  try {
    await api.patch(`/items/${config.bookingsCollection}/${booking.id}`, { [config.statusField]: 'annulee' });
    booking[config.statusField] = 'annulee';
  } catch (e) {
    console.error(e);
  }
}

async function submitManualReservation() {
  if (!selectedSlot.value || !manualForm.value.client_id) return;

  submitting.value = true;
  try {
    const payload = {
      [config.slotRelationField]: selectedSlot.value.id,
      client: manualForm.value.client_id,
      quantite_billets: manualForm.value.quantite,
      [config.statusField]: 'confirmee', // Une résa manuelle est confirmée par défaut
      origine: 'hors-ligne' // Optionnel si vous avez ce champ
    };

    await api.post(`/items/${config.bookingsCollection}`, payload);

    // Rafraîchir les données pour voir la nouvelle réservation
    await fetchData();
    isAddingManual.value = false;

    // Mettre à jour le selectedSlot avec sa nouvelle référence si nécessaire
    selectedSlot.value = slots.value.find(s => s.id === selectedSlot.value.id) || null;

  } catch (err) {
    alert("Erreur lors de la création de la réservation manuelle.");
    console.error(err);
  } finally {
    submitting.value = false;
  }
}

// --- FORMATTING HELPERS ---
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

function getClientName(b: any) {
  const c = b?.client;
  if (typeof c === 'object' && c !== null) return `${c.prenom || ''} ${c.nom || ''}`.trim() || c.email || 'Client Inconnu';
  return 'Client';
}

function formatDayNum(d: string) { return format(parseISO(d), 'd'); }
function formatMonthStr(d: string) { return format(parseISO(d), 'MMM', { locale: fr }); }
function formatFullDate(d: string) { return format(parseISO(d), 'EEEE d MMMM yyyy', { locale: fr }); }
function formatTime(d: string) {
  if(!d) return '--:--';
  // Parse l'ISO pour extraire l'heure proprement
  const dateObj = new Date(d);
  return format(dateObj, 'HH:mm');
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
/* === LAYOUT GLOBAL === */
.tours-container, .tours-container * { box-sizing: border-box; }
.tours-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  height: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}
.title-group h2 { margin: 0; font-size: 1.6rem; font-weight: 900; color: var(--theme--primary); line-height: 1.2; }
.subtitle { color: var(--theme--foreground-subdued); font-size: 0.9rem; font-weight: 600; }

.refresh-btn {
  background: var(--theme--background-subdued);
  border: 1px solid var(--theme--border-color);
  padding: 8px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--theme--foreground);
  font-weight: 700;
  transition: all 0.2s;
}
.refresh-btn:hover { border-color: var(--theme--primary); color: var(--theme--primary); }
.spinning { animation: spin 1s linear infinite; }

/* === ALERTS === */
.pending-alerts { margin-bottom: 24px; }
.alert-box {
  background: rgba(var(--warning-rgb), 0.1);
  border: 1px solid var(--warning);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.alert-icon { color: var(--warning); display: flex; }
.alert-content { display: flex; flex-direction: column; }
.alert-content strong { color: var(--theme--foreground); font-size: 1rem; }
.alert-content span { color: var(--theme--foreground-subdued); font-size: 0.85rem; }

/* === TIMELINE GRID === */
.timeline-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-bottom: 40px;
}

.date-group {
  background: var(--theme--background);
  border: 1px solid var(--theme--border-color-subdued);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

.date-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: var(--theme--background-subdued);
  border-bottom: 1px solid var(--theme--border-color-subdued);
}

.date-badge {
  background: var(--theme--background);
  border: 1px solid var(--theme--border-color);
  border-radius: 8px;
  width: 48px;
  height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.day-num { font-size: 1.1rem; font-weight: 900; line-height: 1; color: var(--theme--primary); }
.day-month { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: var(--theme--foreground-subdued); }

.date-title { margin: 0; font-size: 1.1rem; font-weight: 800; text-transform: capitalize; color: var(--theme--foreground); }

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 0;
}

/* === SLOT CARD === */
.slot-card {
  padding: 20px 24px;
  border-right: 1px solid var(--theme--border-color-subdued);
  border-bottom: 1px solid var(--theme--border-color-subdued);
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.slot-card:hover { background: var(--theme--background-subdued); }

.slot-time { display: flex; align-items: center; gap: 6px; font-weight: 800; font-size: 1.1rem; color: var(--theme--foreground); }
.time-icon { font-size: 1.2rem; color: var(--theme--foreground-subdued); }

.slot-info { display: flex; flex-direction: column; gap: 12px; }
.tour-name { margin: 0; font-size: 1rem; font-weight: 700; color: var(--theme--foreground-subdued); }

.capacity-section { display: flex; flex-direction: column; gap: 6px; }
.capacity-labels { display: flex; justify-content: space-between; font-size: 0.85rem; }
.reserved-count strong { font-size: 1rem; color: var(--theme--foreground); }
.max-count { color: var(--theme--foreground-subdued); }

.progress-bar-bg { width: 100%; height: 8px; background: var(--theme--border-color); border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); }

.progress-bar-fill.is-empty { background: var(--theme--foreground-subdued); width: 0 !important; }
.progress-bar-fill.is-active { background: var(--success); }
.progress-bar-fill.is-warning { background: var(--warning); }
.progress-bar-fill.is-full { background: var(--danger); }

.slot-badges { display: flex; gap: 8px; }
.badge { padding: 4px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
.badge.pending { background: rgba(var(--warning-rgb), 0.2); color: var(--warning); }
.badge.full { background: rgba(var(--danger-rgb), 0.2); color: var(--danger); }

/* === DRAWER (TIROIR) === */
.drawer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 90; backdrop-filter: blur(2px); }
.side-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 480px; max-width: 100vw; background: var(--theme--background); z-index: 100; border-left: 1px solid var(--theme--border-color); display: flex; flex-direction: column; box-shadow: -15px 0 45px rgba(0,0,0,0.15); }

.drawer-header { padding: 24px; border-bottom: 1px solid var(--theme--border-color-subdued); display: flex; justify-content: space-between; align-items: flex-start; }
.drawer-surtitle { font-size: 0.85rem; color: var(--theme--primary); font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
.drawer-header h3 { margin: 0; font-size: 1.4rem; font-weight: 900; line-height: 1.2; }
.close-btn { background: var(--theme--background-subdued); border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 1.5rem; cursor: pointer; color: var(--theme--foreground); display: flex; align-items: center; justify-content: center; }

.drawer-stats { padding: 24px; display: flex; align-items: center; gap: 20px; background: var(--theme--background-page); border-bottom: 1px solid var(--theme--border-color-subdued); }
.stat-circle { width: 70px; height: 70px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--theme--background); border: 4px solid var(--theme--border-color); }
.stat-circle.is-active { border-color: var(--success); }
.stat-circle.is-warning { border-color: var(--warning); }
.stat-circle.is-full { border-color: var(--danger); background: rgba(var(--danger-rgb), 0.1); }
.stat-val { font-size: 1.4rem; font-weight: 900; line-height: 1; }
.stat-max { font-size: 0.75rem; color: var(--theme--foreground-subdued); font-weight: 700; }
.stat-text strong { display: block; font-size: 1.1rem; margin-bottom: 4px; }
.stat-text p { margin: 0; color: var(--theme--foreground-subdued); font-size: 0.9rem; }

.drawer-content { flex: 1; overflow-y: auto; padding: 24px; background: var(--theme--background-subdued); }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.section-header h4 { margin: 0; font-size: 1.1rem; font-weight: 800; }
.btn-add-manual { background: var(--theme--primary); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 4px; }

/* Formulaire Manuel */
.manual-add-card { background: var(--theme--background); border: 1px solid var(--theme--primary); border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 8px 24px rgba(var(--primary-rgb), 0.15); }
.manual-add-card h5 { margin: 0 0 16px 0; color: var(--theme--primary); font-size: 1rem; font-weight: 800; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 6px; color: var(--theme--foreground-subdued); }
.form-input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--theme--border-color); background: var(--theme--background); color: var(--theme--foreground); font-family: inherit; }
.form-hint { display: block; margin-top: 4px; font-size: 0.75rem; color: var(--theme--foreground-subdued); }

.ticket-counter { display: flex; align-items: center; gap: 16px; }
.counter-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--theme--border-color); background: var(--theme--background-subdued); font-size: 1.2rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--theme--foreground); }
.counter-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.counter-val { font-size: 1.2rem; font-weight: 900; min-width: 20px; text-align: center; }

.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--theme--border-color-subdued); }
.btn-cancel { background: transparent; border: 1px solid var(--theme--border-color); padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; color: var(--theme--foreground); }
.btn-confirm { background: var(--theme--primary); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

/* Liste Réservations */
.booking-list { display: flex; flex-direction: column; gap: 12px; }
.booking-card { background: var(--theme--background); border: 1px solid var(--theme--border-color-subdued); border-radius: 12px; padding: 16px; border-left: 4px solid var(--success); }
.booking-card.is-pending { border-left-color: var(--warning); }

.b-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.b-client { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.05rem; }
.b-client .material-icons { color: var(--theme--foreground-subdued); font-size: 1.2rem; }
.b-tickets { background: var(--theme--background-subdued); padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; color: var(--theme--foreground-subdued); }
.b-tickets strong { color: var(--theme--foreground); font-size: 1rem; }

.b-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--theme--border-color-subdued); }
.b-status { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; padding: 4px 8px; border-radius: 6px; }
.b-status.confirmee { color: var(--success); background: rgba(var(--success-rgb), 0.1); }
.b-status.en_attente { color: var(--warning); background: rgba(var(--warning-rgb), 0.1); }
.b-status.annulee { color: var(--danger); background: rgba(var(--danger-rgb), 0.1); text-decoration: line-through; }

.b-actions { display: flex; gap: 8px; }
.btn-quick-confirm { background: var(--success); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; cursor: pointer; }
.btn-text-danger { background: transparent; border: none; color: var(--danger); font-weight: 700; font-size: 0.8rem; cursor: pointer; text-decoration: underline; }

/* Utilitaires */
.empty-state { padding: 64px 20px; text-align: center; color: var(--theme--foreground-subdued); display: flex; flex-direction: column; align-items: center; }
.icon-huge { font-size: 4rem; opacity: 0.3; margin-bottom: 16px; }
.no-data-small { text-align: center; padding: 32px; color: var(--theme--foreground-subdued); font-style: italic; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinner { width: 32px; height: 32px; border: 3px solid var(--theme--border-color); border-top-color: var(--theme--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }

/* Transitions */
.slide-enter-active, .slide-leave-active { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }

/* Mobile Strict */
@media (max-width: 768px) {
  .mobile-hide { display: none !important; }
  .header { flex-direction: column; align-items: stretch; gap: 12px; }
  .refresh-btn { justify-content: center; }

  .slots-grid { grid-template-columns: 1fr; }
  .slot-card { border-right: none; }

  .side-drawer { width: 100%; border-left: none; }
}
</style>