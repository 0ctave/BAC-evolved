<template>
  <div class="hotel-timeline-container">
    <div v-if="loading" class="loading-state">
      <span class="loader"></span> Loading Schedule...
    </div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <div v-else class="timeline-wrapper">
      <!-- Main Calendar Grid -->
      <div class="timeline-grid">
        <!-- Header: Dates -->
        <div class="timeline-header">
          <div class="room-column-header">Room</div>
          <div
              v-for="day in days"
              :key="day.iso"
              class="date-cell-header"
              :class="{ 'is-weekend': day.isWeekend, 'is-today': day.isToday }"
          >
            <span class="day-name">{{ day.name }}</span>
            <span class="day-number">{{ day.number }}</span>
          </div>
        </div>

        <!-- Rows: Rooms -->
        <div v-for="room in visibleRooms" :key="room.name" class="timeline-row">
          <!-- Room Label with Color Strip -->
          <div class="room-label" :title="room.name">
            <div class="room-color-indicator" :style="{ backgroundColor: room.color || '#ccc' }"></div>
            <span class="room-text">{{ room.name }}</span>
          </div>

          <!-- Days Grid -->
          <div
              v-for="day in days"
              :key="day.iso"
              class="date-cell"
              :class="{ 'is-weekend': day.isWeekend, 'is-today': day.isToday }"
          >
            <!-- Booking Bar -->
            <div
                v-if="getBooking(room.name, day.iso)"
                class="booking-bar"
                :class="[getBooking(room.name, day.iso)?.status, { 'is-start': getBooking(room.name, day.iso)?.isStart }]"
                :style="getBarStyle(getBooking(room.name, day.iso))"
                @click.stop="selectBooking(getBooking(room.name, day.iso)!.raw)"
            >
							<span v-if="getBooking(room.name, day.iso)?.isStart" class="bar-label">
								{{ getBooking(room.name, day.iso)?.client }}
							</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Side Drawer for Details -->
      <transition name="slide-fade">
        <div v-if="selectedBooking" class="side-drawer" @click.stop>
          <div class="drawer-header">
            <h3>Booking Details</h3>
            <button class="close-btn" @click="selectedBooking = null">×</button>
          </div>
          <div class="drawer-content">
            <div class="drawer-row">
              <label>Guest</label>
              <div class="val text-lg">{{ selectedBooking.client?.prenom }} {{ selectedBooking.client?.nom }}</div>
              <div class="sub-val">{{ selectedBooking.client?.email }}</div>
            </div>

            <div class="drawer-row">
              <label>Room</label>
              <div class="val">
                <span class="badge">{{ selectedBooking.chambre }}</span>
              </div>
            </div>

            <div class="drawer-grid">
              <div>
                <label>Arrival</label>
                <div class="val">{{ formatDate(selectedBooking.date_arrivee) }}</div>
              </div>
              <div>
                <label>Departure</label>
                <div class="val">{{ formatDate(selectedBooking.date_depart) }}</div>
              </div>
            </div>

            <div class="drawer-row">
              <label>Status</label>
              <div class="status-tag" :class="selectedBooking.statut || 'confirmed'">
                {{ selectedBooking.statut || 'Confirmed' }}
              </div>
            </div>

            <div class="drawer-actions">
              <button class="btn-primary" @click="openInDirectus(selectedBooking.id)">
                Edit Booking
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk';
import { ref, onMounted, computed, watch } from 'vue';
import { format, addDays, startOfDay, isSameDay, isWeekend, parseISO, isWithinInterval, differenceInDays } from 'date-fns';

interface Props {
  roomFilter?: string;
  daysToShow?: number;
}

const props = withDefaults(defineProps<Props>(), {
  roomFilter: '',
  daysToShow: 21,
});

const api = useApi();
const loading = ref(true);
const error = ref<string | null>(null);
const bookings = ref<any[]>([]);
const roomsData = ref<any[]>([]);
const selectedBooking = ref<any | null>(null);

// --- Data Fetching ---

async function fetchData() {
  loading.value = true;
  try {
    // 1. Fetch Rooms to get Colors
    // Assuming collection 'chambres' has fields 'Nom' and 'color'
    const roomsRes = await api.get('/items/chambres', {
      params: { fields: ['Nom', 'color'], limit: 50 }
    });
    roomsData.value = roomsRes.data.data;

    // 2. Fetch Bookings
    // We fetch a wide range to be safe
    const todayStr = format(addDays(new Date(), -10), 'yyyy-MM-dd');
    const bookingsRes = await api.get('/items/reservations_chambre', {
      params: {
        fields: ['*', 'client.nom', 'client.prenom', 'client.email'],
        limit: 200,
        filter: {
          date_depart: { _gte: todayStr }
        }
      }
    });
    bookings.value = bookingsRes.data.data;
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

// --- Computeds ---

const days = computed(() => {
  const result = [];
  const today = startOfDay(new Date());
  const start = addDays(today, -2); // Start timeline 2 days ago

  for (let i = 0; i < props.daysToShow; i++) {
    const date = addDays(start, i);
    result.push({
      iso: date.toISOString(),
      obj: date,
      name: format(date, 'EEE'),
      number: format(date, 'd'),
      isWeekend: isWeekend(date),
      isToday: isSameDay(date, today)
    });
  }
  return result;
});

const visibleRooms = computed(() => {
  // 1. Get all unique room names from bookings and rooms collection
  const allNames = new Set([
    ...roomsData.value.map(r => r.Nom),
    ...bookings.value.map(b => b.chambre)
  ]);

  // 2. Build room objects with colors
  let rooms = Array.from(allNames).map(name => {
    const roomInfo = roomsData.value.find(r => r.Nom === name);
    return {
      name: name,
      color: roomInfo?.color || '#666' // Fallback color
    };
  }).filter(r => r.name); // Remove nulls

  // 3. Apply Filter (if prop is set)
  if (props.roomFilter && props.roomFilter.trim() !== '') {
    rooms = rooms.filter(r => r.name.toLowerCase().includes(props.roomFilter.toLowerCase()));
  }

  return rooms.sort((a, b) => a.name.localeCompare(b.name));
});

// --- Helpers ---

function getBooking(roomName: string, dateIso: string) {
  const targetDate = parseISO(dateIso);

  const match = bookings.value.find(b => {
    if (b.chambre !== roomName) return false;
    // Standard Hotel Logic: Check-in day counts, Check-out day is free for next guest
    // Interval is [start, end - 1 day]
    const start = parseISO(b.date_arrivee);
    const end = parseISO(b.date_depart);
    const stayEnd = addDays(end, -1);

    // Handle 1 night stays where start == stayEnd
    if (isSameDay(start, end)) return false; // Invalid data protection

    return isWithinInterval(targetDate, { start, end: stayEnd });
  });

  if (match) {
    const isStart = isSameDay(parseISO(match.date_arrivee), targetDate);
    return {
      raw: match,
      status: match.statut || 'confirmed',
      client: match.client ? `${match.client.prenom || ''} ${match.client.nom}` : 'Guest',
      isStart
    };
  }
  return null;
}

function getBarStyle(bookingWrapper: any) {
  if (!bookingWrapper) return {};
  // If you want to use the Room Color for the bar, uncomment below:
  // const room = roomsData.value.find(r => r.Nom === bookingWrapper.raw.chambre);
  // return { backgroundColor: room?.color || 'var(--primary)' };

  // Currently using Status Colors via CSS classes
  return {};
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  return format(parseISO(dateStr), 'PP'); // e.g. Feb 2, 2026
}

function selectBooking(booking: any) {
  selectedBooking.value = booking;
}

function openInDirectus(id: string | number) {
  window.open(`/admin/content/reservations_chambre/${id}`, '_blank');
}

onMounted(fetchData);

// Close drawer on outside click logic is handled by @click.stop on drawer and click on bg
</script>

<style scoped>
.hotel-timeline-container {
  height: 100%;
  width: 100%;
  display: flex;
  background: var(--theme--background);
  color: var(--theme--foreground);
  position: relative;
  overflow: hidden;
}

.timeline-wrapper {
  flex: 1;
  overflow: auto;
  position: relative;
}

.timeline-grid {
  display: inline-block;
  min-width: 100%;
}

/* --- Header --- */
.timeline-header {
  display: flex;
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--theme--background-accent);
  border-bottom: 2px solid var(--theme--border-color-subdued);
}

.room-column-header {
  width: 180px;
  min-width: 180px;
  padding: 12px;
  font-weight: 700;
  position: sticky;
  left: 0;
  background: var(--theme--background-accent);
  z-index: 30;
  border-right: 1px solid var(--theme--border-color);
}

.date-cell-header {
  width: 45px;
  min-width: 45px;
  text-align: center;
  padding: 4px 0;
  border-right: 1px solid var(--theme--border-color-subdued);
  font-size: 0.8rem;
}
.date-cell-header.is-weekend { background-color: var(--theme--background-subdued); }
.date-cell-header.is-today { color: var(--primary); font-weight: bold; }

/* --- Rows --- */
.timeline-row {
  display: flex;
  border-bottom: 1px solid var(--theme--border-color-subdued);
  height: 50px; /* Fixed height for consistency */
}

.room-label {
  width: 180px;
  min-width: 180px;
  position: sticky;
  left: 0;
  background: var(--theme--background);
  z-index: 10;
  border-right: 1px solid var(--theme--border-color);
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-weight: 600;
  font-size: 0.9rem;
}

.room-color-indicator {
  width: 4px;
  height: 24px;
  margin-right: 10px;
  border-radius: 4px;
}

.date-cell {
  width: 45px;
  min-width: 45px;
  border-right: 1px solid var(--theme--border-color-subdued);
  position: relative;
}
.date-cell.is-weekend { background-color: var(--theme--background-subdued); }

/* --- Booking Bar --- */
.booking-bar {
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: -1px; /* Overlap borders */
  right: -1px;
  background-color: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  padding-left: 8px;
  font-size: 0.75rem;
  cursor: pointer;
  z-index: 5;
  white-space: nowrap;
  overflow: hidden;
  transition: opacity 0.2s;
}
.booking-bar:hover { opacity: 0.9; }

/* Status Colors (Matches Directus default palettes roughly) */
.booking-bar.confirmed { background-color: var(--primary); }
.booking-bar.pending { background-color: var(--warning); color: #1d2127; }
.booking-bar.checked_in { background-color: var(--success); }
.booking-bar.maintenance { background-color: var(--danger); }

/* --- Side Drawer --- */
.side-drawer {
  position: absolute;
  top: 0;
  right: 0;
  width: 320px;
  height: 100%;
  background: var(--theme--background);
  border-left: 1px solid var(--theme--border-color);
  box-shadow: -4px 0 12px rgba(0,0,0,0.1);
  z-index: 50;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  padding: 16px;
  border-bottom: 1px solid var(--theme--border-color-subdued);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--theme--background-accent);
}

.drawer-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.drawer-row { margin-bottom: 20px; }
.drawer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }

label {
  display: block;
  font-size: 0.75rem;
  color: var(--theme--foreground-subdued);
  text-transform: uppercase;
  margin-bottom: 4px;
  font-weight: 600;
}

.val { font-size: 1rem; color: var(--theme--foreground); }
.text-lg { font-size: 1.1rem; font-weight: bold; }
.sub-val { font-size: 0.85rem; color: var(--theme--foreground-subdued); }

.status-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  text-transform: capitalize;
  color: white;
  background: #888;
}
.status-tag.confirmed { background: var(--primary); }
.status-tag.pending { background: var(--warning); color: #333; }
.status-tag.checked_in { background: var(--success); }

.badge {
  background: var(--theme--background-subdued);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.drawer-actions { margin-top: auto; padding-top: 20px; }
.btn-primary {
  width: 100%;
  padding: 10px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:hover { background: var(--primary-125); }

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--theme--foreground-subdued);
}

/* Transitions */
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(100%); opacity: 0; }
</style>