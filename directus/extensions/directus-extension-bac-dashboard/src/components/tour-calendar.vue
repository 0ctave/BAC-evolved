<template>
  <div class="tours-container">

    <!-- En-tête -->
    <div class="header">
      <div class="title-group">
        <h2>Planning des Visites</h2>
        <span class="subtitle">Aperçu de vos créneaux regroupés par type de visite</span>
      </div>

      <!-- Actions Globales -->
      <div class="header-actions">
        <button class="btn-outline" @click="showCreateVisiteModal = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <span class="mobile-hide">Type de visite</span>
        </button>
        <button class="btn-primary" @click="showCreateSlotModal = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>
          <span class="mobile-hide">Nouveau créneau</span>
        </button>
        <div class="divider mobile-hide"></div>
        <button class="refresh-btn" @click="fetchData" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
        </button>
      </div>
    </div>

    <!-- Alertes : Réservations en attente -->
    <div class="pending-alerts" v-if="globalPendingBookings.length > 0">
      <div class="alert-box">
        <div class="alert-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
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
      <svg class="icon-huge" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
      <h3>Aucun créneau à venir</h3>
      <p>Vous n'avez pas de visites prévues dans les prochains jours.</p>
      <button class="btn-primary mt-4" @click="showCreateSlotModal = true">Créer le premier créneau</button>
    </div>

    <!-- Groupement par Visites -->
    <div v-else class="tour-groups-container">
      <div v-for="(group, visiteName) in groupedSlots" :key="visiteName" class="tour-group">

        <div class="tour-header">
          <div class="tour-icon-bg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>
          </div>
          <div class="tour-header-text">
            <h3 class="tour-title">{{ visiteName }}</h3>
            <span class="tour-count">{{ group.length }} créneau(x) à venir</span>
          </div>
        </div>

        <div class="slots-grid">
          <div
              v-for="slot in group"
              :key="slot.id"
              class="slot-card"
              @click="openSlot(slot)"
          >
            <!-- Badge Date/Heure mis en évidence -->
            <div class="slot-datetime-badge">
              <div class="slot-date">
                <svg class="date-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {{ formatShortDate(slot.date_heure_debut) }}
              </div>
              <div class="slot-time">
                <svg class="time-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {{ formatTime(slot.date_heure_debut) }}
              </div>
            </div>

            <div class="slot-info">
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
            <h3>{{ selectedSlot[config.visiteRelationField]?.nom || 'Détails du créneau' }}</h3>
          </div>
          <div class="drawer-actions">
            <button class="delete-btn" @click="deleteSlot(selectedSlot)" title="Supprimer le créneau">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
            <button class="close-btn" @click="closeDrawer">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
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
              <svg v-if="!isAddingManual" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              {{ isAddingManual ? 'Fermer' : 'Ajouter' }}
            </button>
          </div>

          <!-- FORMULAIRE D'AJOUT MANUEL -->
          <div v-if="isAddingManual" class="manual-add-card">
            <h5>Nouvelle Réservation (Hors-ligne)</h5>

            <div class="client-toggle">
              <button class="toggle-btn" :class="{ active: !isNewClient }" @click="isNewClient = false">Client existant</button>
              <button class="toggle-btn" :class="{ active: isNewClient }" @click="isNewClient = true">Nouveau client</button>
            </div>

            <!-- Client existant -->
            <div v-if="!isNewClient" class="form-group">
              <label>Rechercher le client</label>
              <select v-model="manualForm.client_id" class="form-input">
                <option value="">-- Sélectionner un client --</option>
                <option v-for="client in clientsList" :key="client.id" :value="client.id">
                  {{ client.prenom }} {{ client.nom }} ({{ client.email || 'Sans email' }})
                </option>
              </select>
            </div>

            <!-- Nouveau Client -->
            <div v-else class="new-client-form">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Prénom *</label>
                  <input type="text" v-model="clientForm.prenom" class="form-input" placeholder="Jean" />
                </div>
                <div class="form-group flex-1">
                  <label>Nom *</label>
                  <input type="text" v-model="clientForm.nom" class="form-input" placeholder="Dupont" />
                </div>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" v-model="clientForm.email" class="form-input" placeholder="jean.dupont@email.com" />
              </div>
              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Téléphone</label>
                  <input type="tel" v-model="clientForm.numero" class="form-input" placeholder="+33 6..." />
                </div>
                <div class="form-group flex-1">
                  <label>Langue *</label>
                  <select v-model="clientForm.langue" class="form-input">
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                    <option value="es">Espagnol</option>
                    <option value="de">Allemand</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-group mt-3">
              <label>Nombre de billets</label>
              <div class="ticket-counter">
                <button class="counter-btn" @click="manualForm.quantite--" :disabled="manualForm.quantite <= 1">-</button>
                <span class="counter-val">{{ manualForm.quantite }}</span>
                <button class="counter-btn" @click="manualForm.quantite++" :disabled="getSlotReservedCount(selectedSlot.id) + manualForm.quantite >= getSlotMaxCapacity(selectedSlot)">+</button>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn-cancel" @click="isAddingManual = false">Annuler</button>
              <button class="btn-confirm" @click="submitManualReservation" :disabled="submitting || !isManualFormValid">
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
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


    <!-- === MODALS DE CRÉATION === -->

    <!-- Modal : Nouvelle Visite (Type) -->
    <div v-if="showCreateVisiteModal" class="modal-overlay" @click.self="showCreateVisiteModal = false">
      <div class="modal-card">
        <h3>Nouveau Type de Visite</h3>
        <p class="modal-desc">Ajoutez une nouvelle offre de visite à votre catalogue.</p>

        <div class="modal-body">
          <div class="form-group">
            <label>Nom de la visite *</label>
            <input type="text" v-model="visiteForm.nom" class="form-input" placeholder="Ex: Visite Découverte des Chais" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="visiteForm.description" class="form-input" rows="3" placeholder="Brève description..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>Durée (minutes)</label>
              <input type="number" v-model="visiteForm.duree_minutes" class="form-input" min="15" step="15" />
            </div>
            <div class="form-group flex-1">
              <label>Prix unitaire (€)</label>
              <input type="number" v-model="visiteForm.prix_unitaire" class="form-input" min="0" step="0.5" />
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showCreateVisiteModal = false">Annuler</button>
          <button class="btn-confirm" @click="submitVisite" :disabled="creatingData || !visiteForm.nom">
            {{ creatingData ? '...' : 'Créer la visite' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal : Nouveau Créneau -->
    <div v-if="showCreateSlotModal" class="modal-overlay" @click.self="showCreateSlotModal = false">
      <div class="modal-card">
        <h3>Ouvrir un nouveau créneau</h3>
        <p class="modal-desc">Programmez une session pour une visite existante.</p>

        <div class="modal-body">
          <div class="form-group">
            <label>Type de visite *</label>
            <select v-model="slotForm.visite_id" class="form-input">
              <option value="" disabled>-- Sélectionner une visite --</option>
              <option v-for="v in visitesList" :key="v.id" :value="v.id">{{ v.nom }}</option>
            </select>
            <small class="form-hint" v-if="visitesList.length === 0">Vous devez d'abord créer un type de visite.</small>
          </div>

          <!-- Remplacement du datetime-local par deux champs séparés -->
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
            <label>Capacité maximum (personnes) *</label>
            <input type="number" v-model="slotForm.capacite_max" class="form-input" min="1" />
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showCreateSlotModal = false">Annuler</button>
          <button class="btn-confirm" @click="submitSlot" :disabled="creatingData || !slotForm.visite_id || !slotForm.date || !slotForm.time">
            {{ creatingData ? '...' : 'Créer le créneau' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk';
import { ref, onMounted, computed } from 'vue';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const config = {
  visitesCollection: 'visites',
  slotsCollection: 'creneaux_visites',
  bookingsCollection: 'reservations_visite',
  clientsCollection: 'clients',
  slotRelationField: 'creneau_visite',
  visiteRelationField: 'visite_id',
  statusField: 'statut',
  defaultMaxCapacity: 20
};

const api = useApi();
const loading = ref(false);
const submitting = ref(false);
const creatingData = ref(false);

const slots = ref<any[]>([]);
const allBookings = ref<any[]>([]);
const clientsList = ref<any[]>([]);
const visitesList = ref<any[]>([]);

const selectedSlot = ref<any | null>(null);

const isAddingManual = ref(false);
const isNewClient = ref(false);
const manualForm = ref({ client_id: '', quantite: 1 });
const clientForm = ref({ prenom: '', nom: '', email: '', numero: '', langue: 'fr' });

const showCreateVisiteModal = ref(false);
const visiteForm = ref({ nom: '', description: '', duree_minutes: 60, prix_unitaire: 10 });

const showCreateSlotModal = ref(false);
// Modification de la structure du formulaire pour séparer date et time
const slotForm = ref({ visite_id: '', date: '', time: '', capacite_max: 20 });


async function fetchData() {
  loading.value = true;
  try {
    const today = new Date().toISOString().split('T')[0];

    const slotsRes = await api.get(`/items/${config.slotsCollection}`, {
      params: {
        filter: { date_heure_debut: { _gte: today } },
        sort: 'date_heure_debut',
        fields: ['*', `${config.visiteRelationField}.nom`],
        limit: -1
      }
    });
    slots.value = slotsRes.data.data;

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

    // CORRECTION : Tri par -id car date_created n'existe pas sur la collection clients
    const clientsRes = await api.get(`/items/${config.clientsCollection}`, {
      params: { fields: ['id', 'nom', 'prenom', 'email'], limit: -1, sort: '-id' }
    });
    clientsList.value = clientsRes.data.data;

    const visitesRes = await api.get(`/items/${config.visitesCollection}`, {
      params: { fields: ['id', 'nom'], limit: -1 }
    });
    visitesList.value = visitesRes.data.data;

  } catch (err) {
    console.error("Erreur lors du chargement des visites:", err);
  } finally {
    loading.value = false;
  }
}

async function submitVisite() {
  creatingData.value = true;
  try {
    await api.post(`/items/${config.visitesCollection}`, visiteForm.value);
    showCreateVisiteModal.value = false;
    visiteForm.value = { nom: '', description: '', duree_minutes: 60, prix_unitaire: 10 };
    await fetchData();
  } catch (err) {
    alert("Erreur lors de la création de la visite.");
    console.error(err);
  } finally {
    creatingData.value = false;
  }
}

async function submitSlot() {
  creatingData.value = true;
  try {
    // Recombinaison de la date et de l'heure au format ISO pour Directus
    const payload = {
      visite_id: slotForm.value.visite_id,
      date_heure_debut: `${slotForm.value.date}T${slotForm.value.time}:00`,
      capacite_max: slotForm.value.capacite_max
    };

    await api.post(`/items/${config.slotsCollection}`, payload);
    showCreateSlotModal.value = false;
    // Réinitialisation du formulaire avec les nouveaux champs
    slotForm.value = { visite_id: '', date: '', time: '', capacite_max: 20 };
    await fetchData();
  } catch (err) {
    alert("Erreur lors de la création du créneau.");
    console.error(err);
  } finally {
    creatingData.value = false;
  }
}

async function deleteSlot(slot: any) {
  if (!slot) return;
  const reservedCount = getSlotReservedCount(slot.id);
  let message = "Voulez-vous vraiment supprimer ce créneau ?";
  if (reservedCount > 0) {
    message = `Attention : Ce créneau contient ${reservedCount} réservation(s) active(s). La suppression du créneau peut entraîner des erreurs si les réservations ne sont pas d'abord annulées. Continuer ?`;
  }

  if (!confirm(message)) return;

  try {
    await api.delete(`/items/${config.slotsCollection}/${slot.id}`);
    closeDrawer();
    await fetchData();
  } catch (err) {
    alert("Erreur lors de la suppression du créneau. Il est possible que des réservations y soient liées.");
    console.error(err);
  }
}

const groupedSlots = computed(() => {
  const groups: Record<string, any[]> = {};
  slots.value.forEach(slot => {
    const visiteName = slot[config.visiteRelationField]?.nom || 'Visite Standard';
    if (!groups[visiteName]) groups[visiteName] = [];
    groups[visiteName].push(slot);
  });
  return groups;
});

const globalPendingBookings = computed(() => {
  return allBookings.value.filter(b => normalizeStatus(b[config.statusField]) === 'en_attente');
});

const isManualFormValid = computed(() => {
  if (isNewClient.value) {
    return clientForm.value.prenom && clientForm.value.nom && clientForm.value.langue;
  }
  return !!manualForm.value.client_id;
});

function getSlotBookings(slotId: number | string) {
  return allBookings.value.filter(b => {
    const sId = typeof b[config.slotRelationField] === 'object' ? b[config.slotRelationField]?.id : b[config.slotRelationField];
    return sId === slotId;
  });
}

function getSlotMaxCapacity(slot: any) {
  return slot.capacite_max || config.defaultMaxCapacity;
}

function getSlotReservedCount(slotId: number | string) {
  const bookings = getSlotBookings(slotId);
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

function openSlot(slot: any) {
  selectedSlot.value = slot;
  isAddingManual.value = false;
  isNewClient.value = false;
  manualForm.value = { client_id: '', quantite: 1 };
  clientForm.value = { prenom: '', nom: '', email: '', numero: '', langue: 'fr' };
}

function closeDrawer() {
  selectedSlot.value = null;
  isAddingManual.value = false;
}

async function updateBookingStatus(booking: any, newStatus: string) {
  const oldStatus = booking[config.statusField];
  booking[config.statusField] = newStatus;
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
  if (!selectedSlot.value || !isManualFormValid.value) return;

  submitting.value = true;
  try {
    let finalClientId = manualForm.value.client_id;

    if (isNewClient.value) {
      const cRes = await api.post(`/items/${config.clientsCollection}`, clientForm.value);
      finalClientId = cRes.data.data.id;
    }

    const payload = {
      [config.slotRelationField]: selectedSlot.value.id,
      client: finalClientId,
      quantite_billets: manualForm.value.quantite,
      [config.statusField]: 'confirmee',
    };

    await api.post(`/items/${config.bookingsCollection}`, payload);
    await fetchData();
    isAddingManual.value = false;
    selectedSlot.value = slots.value.find(s => s.id === selectedSlot.value.id) || null;

  } catch (err) {
    alert("Erreur lors de la création de la réservation.");
    console.error(err);
  } finally {
    submitting.value = false;
  }
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

function getClientName(b: any) {
  const c = b?.client;
  if (typeof c === 'object' && c !== null) return `${c.prenom || ''} ${c.nom || ''}`.trim() || c.email || 'Client Inconnu';
  return 'Client';
}

function formatShortDate(d: string) {
  if (!d) return '';
  return format(parseISO(d), 'EEE d MMM', { locale: fr });
}

function formatFullDate(d: string) {
  if (!d) return '';
  return format(parseISO(d), 'EEEE d MMMM yyyy', { locale: fr });
}

function formatTime(d: string) {
  if(!d) return '--:--';
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
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}
.title-group h2 { margin: 0; font-size: 1.6rem; font-weight: 900; color: var(--theme--primary); line-height: 1.2; }
.subtitle { color: var(--theme--foreground-subdued); font-size: 0.9rem; font-weight: 600; }

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary, .btn-outline {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary { background: var(--theme--primary); color: white; border: 1px solid var(--theme--primary); }
.btn-primary:hover { filter: brightness(1.1); }
.btn-outline { background: transparent; border: 1px solid var(--theme--border-color); color: var(--theme--foreground); }
.btn-outline:hover { background: var(--theme--background-subdued); border-color: var(--theme--primary); color: var(--theme--primary); }

.divider { width: 1px; height: 32px; background: var(--theme--border-color-subdued); margin: 0 4px; }

.refresh-btn {
  background: var(--theme--background-subdued);
  border: 1px solid var(--theme--border-color);
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--theme--foreground);
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

/* === TIMELINE / GROUPES === */
.tour-groups-container {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding-bottom: 40px;
}

.tour-group {
  background: var(--theme--background);
  border: 1px solid var(--theme--border-color-subdued);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

.tour-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--theme--background-subdued);
  border-bottom: 1px solid var(--theme--border-color-subdued);
}

.tour-icon-bg {
  background: var(--theme--primary-subdued);
  color: var(--theme--primary);
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.tour-header-text { display: flex; flex-direction: column; }
.tour-title { margin: 0; font-size: 1.2rem; font-weight: 800; color: var(--theme--foreground); }
.tour-count { font-size: 0.85rem; color: var(--theme--foreground-subdued); font-weight: 600; margin-top: 4px; }

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
  gap: 16px;
}
.slot-card:hover { background: var(--theme--background-subdued); }

.slot-datetime-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--theme--background-subdued);
  border: 1px solid var(--theme--border-color-subdued);
  border-radius: 8px;
  padding: 8px 12px;
}

.slot-date { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 0.9rem; color: var(--theme--foreground); text-transform: capitalize; }
.slot-time { display: flex; align-items: center; gap: 6px; font-weight: 900; font-size: 1.1rem; color: var(--theme--primary); }
.date-icon, .time-icon { color: var(--theme--foreground-subdued); }

.slot-info { display: flex; flex-direction: column; gap: 12px; }

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
.drawer-actions { display: flex; align-items: center; gap: 8px; }
.delete-btn { background: transparent; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; color: var(--danger); display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
.delete-btn:hover { background: rgba(var(--danger-rgb), 0.1); }
.drawer-surtitle { font-size: 0.85rem; color: var(--theme--primary); font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
.drawer-header h3 { margin: 0; font-size: 1.4rem; font-weight: 900; line-height: 1.2; }
.close-btn { background: var(--theme--background-subdued); border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 1.5rem; cursor: pointer; color: var(--theme--foreground); display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
.close-btn:hover { background: var(--theme--border-color-subdued); }

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
.btn-add-manual { background: var(--theme--primary); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: filter 0.2s; }
.btn-add-manual:hover { filter: brightness(1.1); }

/* Formulaire Manuel & Toggle Client */
.manual-add-card { background: var(--theme--background); border: 1px solid var(--theme--primary); border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 8px 24px rgba(var(--primary-rgb), 0.15); }
.manual-add-card h5 { margin: 0 0 16px 0; color: var(--theme--primary); font-size: 1rem; font-weight: 800; }

.client-toggle { display: flex; background: var(--theme--background-subdued); border-radius: 8px; padding: 4px; margin-bottom: 20px; }
.toggle-btn { flex: 1; padding: 8px; border: none; background: transparent; border-radius: 6px; font-size: 0.85rem; font-weight: 700; color: var(--theme--foreground-subdued); cursor: pointer; transition: all 0.2s; }
.toggle-btn.active { background: var(--theme--background); color: var(--theme--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

.form-row { display: flex; gap: 12px; }
.flex-1 { flex: 1; min-width: 0; }

.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 6px; color: var(--theme--foreground-subdued); }
.form-input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--theme--border-color); background: var(--theme--background); color: var(--theme--foreground); font-family: inherit; font-size: 0.95rem; }
.form-hint { display: block; margin-top: 4px; font-size: 0.75rem; color: var(--theme--foreground-subdued); }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }

.ticket-counter { display: flex; align-items: center; gap: 16px; }
.counter-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--theme--border-color); background: var(--theme--background-subdued); font-size: 1.2rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--theme--foreground); }
.counter-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.counter-val { font-size: 1.2rem; font-weight: 900; min-width: 20px; text-align: center; }

/* Liste Réservations */
.booking-list { display: flex; flex-direction: column; gap: 12px; }
.booking-card { background: var(--theme--background); border: 1px solid var(--theme--border-color-subdued); border-radius: 12px; padding: 16px; border-left: 4px solid var(--success); }
.booking-card.is-pending { border-left-color: var(--warning); }

.b-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.b-client { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.05rem; }
.b-client svg { color: var(--theme--foreground-subdued); }
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

/* Utilitaires & Modals */
.empty-state { padding: 64px 20px; text-align: center; color: var(--theme--foreground-subdued); display: flex; flex-direction: column; align-items: center; }
.icon-huge { opacity: 0.3; margin-bottom: 16px; color: var(--theme--primary); }
.no-data-small { text-align: center; padding: 32px; color: var(--theme--foreground-subdued); font-style: italic; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 16px; }
.modal-card { background: var(--theme--background); padding: 32px; border-radius: 16px; width: 100%; max-width: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
.modal-card h3 { margin: 0 0 8px 0; color: var(--theme--primary); font-weight: 900; font-size: 1.4rem; }
.modal-desc { color: var(--theme--foreground-subdued); margin: 0 0 24px 0; font-size: 0.95rem; }

.modal-actions, .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--theme--border-color-subdued); }
.btn-cancel { background: transparent; border: 1px solid var(--theme--border-color); padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; color: var(--theme--foreground); transition: all 0.2s; }
.btn-cancel:hover { background: var(--theme--background-subdued); }
.btn-confirm { background: var(--theme--primary); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 800; transition: filter 0.2s; }
.btn-confirm:hover:not(:disabled) { filter: brightness(1.1); }
.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinner { width: 32px; height: 32px; border: 3px solid var(--theme--border-color); border-top-color: var(--theme--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }

/* Transitions */
.slide-enter-active, .slide-leave-active { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }

/* Mobile Strict */
@media (max-width: 768px) {
  .mobile-hide { display: none !important; }
  .header { flex-direction: column; align-items: stretch; gap: 16px; }
  .header-actions { justify-content: stretch; width: 100%; }
  .header-actions button { flex: 1; justify-content: center; }

  .slots-grid { grid-template-columns: 1fr; }
  .slot-card { border-right: none; }

  .side-drawer { width: 100%; border-left: none; }
  .form-row { flex-direction: column; gap: 0; }
}
</style>