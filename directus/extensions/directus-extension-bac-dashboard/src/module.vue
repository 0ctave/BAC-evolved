<template>
  <private-view title="Gestion du Domaine">
    <!-- Intégration des actions dans le header natif de Directus -->
    <template #actions>
      <div class="module-tabs">
        <button
            @click="currentTab = 'rooms'"
            :class="{ active: currentTab === 'rooms' }"
            class="tab-btn"
        >
          <span class="material-icons">bed</span> Chambres
        </button>
        <button
            @click="currentTab = 'tours'"
            :class="{ active: currentTab === 'tours' }"
            class="tab-btn"
        >
          <span class="material-icons">tour</span> Visites
        </button>
      </div>
    </template>

    <div class="module-content-scroll">
      <main class="module-wrapper">
        <!-- VUE: CHAMBRES -->
        <div v-if="currentTab === 'rooms'" class="rooms-dashboard">
          <aside class="sidebar-column">
            <PendingBookings />
          </aside>

          <section class="calendars-column">
            <!-- Calendrier Combiné -->
            <div class="calendar-card">
              <BookingCalendar title="Vue Combinée des Réservations" />
            </div>

            <!-- Calendriers Séparés par Chambre (générés dynamiquement) -->
            <div class="split-calendars" v-if="rooms.length > 0">
              <div v-for="room in rooms" :key="room.id" class="calendar-card half">
                <BookingCalendar :title="room.nom" :room-filter="room.nom" />
              </div>
            </div>
            <div v-else class="loading-rooms">Chargement des chambres...</div>
          </section>
        </div>

        <!-- VUE: VISITES -->
        <div v-else class="tours-dashboard">
          <TourDashboard />
        </div>
      </main>
    </div>
  </private-view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { config } from './config';
import PendingBookings from './components/room-confirmation.vue';
import BookingCalendar from './components/room-calendar.vue';
import TourDashboard from './components/tour-calendar.vue';

const api = useApi();
const currentTab = ref('rooms');
const rooms = ref<any[]>([]);

// Charger la liste des chambres pour générer automatiquement les calendriers individuels
onMounted(async () => {
  try {
    const res = await api.get(`/items/${config.roomsCollection}`);
    rooms.value = res.data.data;
  } catch (err) {
    console.error("Erreur lors du chargement des chambres", err);
  }
});
</script>

<style scoped>
.module-content-scroll {
  height: 100%;
  overflow-y: auto;
  background: var(--theme--background-page);
}

.module-wrapper {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

/* Tabs dans le header de Directus */
.module-tabs {
  display: flex;
  gap: 8px;
  background: var(--theme--background-subdued);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--theme--border-color);
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 8px 16px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--theme--foreground-subdued);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.tab-btn:hover { color: var(--theme--foreground); }
.tab-btn.active {
  background: var(--theme--background);
  color: var(--theme--primary);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* Grille Responsive pour les chambres */
.rooms-dashboard {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 24px;
  align-items: start;
}

.calendars-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.calendar-card {
  background: var(--theme--background);
  border: 1px solid var(--theme--border-color-subdued);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  overflow: hidden;
  min-height: 500px;
}

.split-calendars {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.loading-rooms { padding: 24px; text-align: center; color: var(--theme--foreground-subdued); }

/* Mobile Responsiveness */
@media (max-width: 1000px) {
  .rooms-dashboard { grid-template-columns: 1fr; }
  .sidebar-column { height: 450px; }
  .module-wrapper { padding: 12px; }
}
</style>