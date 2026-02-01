<template>
  <div class="hotel-timeline-container" :class="{ 'has-error': error }">
    <div v-if="loading" class="loading-state">Loading Schedule...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <div v-else class="timeline-grid">
      <!-- Header Row: Dates -->
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

      <!-- Body Rows: Rooms -->
      <div v-for="room in uniqueRooms" :key="room" class="timeline-row">
        <div class="room-label" :title="room">{{ room }}</div>

        <div
            v-for="day in days"
            :key="day.iso"
            class="date-cell"
            :class="{ 'is-weekend': day.isWeekend }"
        >
          <!-- Render Booking Bar if exists for this room/day -->
          <div
              v-if="getBookingStatus(room, day.iso)"
              class="booking-bar"
              :class="getBookingStatus(room, day.iso)?.status"
              :title="getBookingStatus(room, day.iso)?.client"
              @click="getBookingStatus(room, day.iso)?.id && openBooking(getBookingStatus(room, day.iso)!.id)"
          >
            <!-- Only show name if it's the start of the booking to avoid clutter -->
            <span v-if="getBookingStatus(room, day.iso)?.isStart">
							{{ getBookingStatus(room, day.iso)?.client }}
						</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk';
import { ref, onMounted, computed } from 'vue';
import { format, addDays, startOfDay, isSameDay, isWeekend, parseISO, isWithinInterval } from 'date-fns';

interface Props {
  collection?: string;
  daysToShow?: number;
}

const props = withDefaults(defineProps<Props>(), {
  collection: 'reservations_chambre',
  daysToShow: 14,
});

interface Client {
  nom: string;
  prenom?: string;
}

interface Booking {
  id: number | string;
  chambre: string;
  date_arrivee: string;
  date_depart: string;
  client?: Client;
  statut?: string;
}

interface BookingStatus {
  id: number | string;
  status: string;
  client: string;
  isStart: boolean;
}

interface DayItem {
  iso: string;
  obj: Date;
  name: string;
  number: string;
  isWeekend: boolean;
  isToday: boolean;
}

const api = useApi();
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const bookings = ref<Booking[]>([]);

// Generate the next X days
const days = computed<DayItem[]>(() => {
  const result: DayItem[] = [];
  const today = startOfDay(new Date());
  // Start from 2 days ago to see recent context
  const start = addDays(today, -2);

  for (let i = 0; i < (props.daysToShow); i++) {
    const date = addDays(start, i);
    result.push({
      iso: date.toISOString(),
      obj: date,
      name: format(date, 'EEE'), // Mon, Tue
      number: format(date, 'd'), // 01, 02
      isWeekend: isWeekend(date),
      isToday: isSameDay(date, today)
    });
  }
  return result;
});

// Extract unique rooms from bookings
const uniqueRooms = computed<string[]>(() => {
  const rooms = new Set(bookings.value.map(b => b.chambre).filter(Boolean));
  return Array.from(rooms).sort();
});

// Fetch Data
async function fetchData() {
  loading.value = true;
  try {
    const response = await api.get(`/items/${props.collection}`, {
      params: {
        fields: ['id', 'chambre', 'date_arrivee', 'date_depart', 'client.nom', 'statut'],
        limit: 100,
        // Filter: Overlapping with our date range (roughly)
        filter: {
          _and: [
            { date_depart: { _gte: format(addDays(new Date(), -5), 'yyyy-MM-dd') } }
          ]
        }
      }
    });
    bookings.value = response.data.data;
  } catch (err: any) {
    error.value = err.message || 'Unknown error occurred';
  } finally {
    loading.value = false;
  }
}

// Check if a room is booked on a specific day
function getBookingStatus(room: string, dateIso: string): BookingStatus | null {
  const targetDate = parseISO(dateIso);

  const booking = bookings.value.find(b => {
    if (b.chambre !== room) return false;
    const start = parseISO(b.date_arrivee);
    const end = parseISO(b.date_depart);
    // Check if targetDate is within start and end (exclusive of end date usually for hotels)
    return isWithinInterval(targetDate, { start, end: addDays(end, -1) });
  });

  if (booking) {
    const isStart = isSameDay(parseISO(booking.date_arrivee), targetDate);
    return {
      id: booking.id,
      status: booking.statut || 'confirmed', // 'confirmed', 'pending', 'maintenance'
      client: booking.client?.nom || 'Guest',
      isStart
    };
  }
  return null;
}

function openBooking(id: number | string) {
  // Need to construct URL to admin, or use router if available.
  // For simple panels, window.open is safest.
  window.open(`/admin/content/${props.collection}/${id}`, '_blank');
}

onMounted(fetchData);
</script>

<style scoped>
.hotel-timeline-container {
  height: 100%;
  width: 100%;
  overflow: auto;
  font-family: var(--family-sans);
  background: var(--theme--background);
  color: var(--theme--foreground);
}

.timeline-grid {
  display: inline-block;
  min-width: 100%;
}

/* Row Layout */
.timeline-header, .timeline-row {
  display: flex;
  border-bottom: 1px solid var(--theme--border-color-subdued);
}

.timeline-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--theme--background-accent);
  font-weight: bold;
  font-size: 0.8rem;
}

/* Columns */
.room-column-header, .room-label {
  width: 150px;
  min-width: 150px;
  padding: 10px;
  border-right: 1px solid var(--theme--border-color-subdued);
  position: sticky;
  left: 0;
  background: inherit;
  z-index: 5;
  display: flex;
  align-items: center;
}

.room-label {
  background: var(--theme--background);
}

.date-cell-header, .date-cell {
  width: 50px;
  min-width: 50px;
  padding: 4px;
  text-align: center;
  border-right: 1px solid var(--theme--border-color-subdued);
  position: relative;
}

.date-cell-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.is-weekend {
  background-color: var(--theme--background-subdued);
}

.is-today {
  color: var(--primary);
  border-bottom: 2px solid var(--primary);
}

/* Booking Bars */
.booking-bar {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 0;
  right: 0;
  z-index: 1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding-left: 4px;
  font-size: 10px;
  color: white;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  /* Overwrite borders to look continuous */
  left: -1px;
  right: -1px;
  border-radius: 0;
}

/* Status Colors */
.booking-bar.confirmed { background-color: var(--primary); }
.booking-bar.pending { background-color: var(--warning); color: black; }
.booking-bar.maintenance { background-color: var(--danger); }
.booking-bar.checked_in { background-color: var(--success); }

/* Make start rounded */
.date-cell:has(.booking-bar) + .date-cell:has(.booking-bar) .booking-bar {
  /* Continuous segment logic handled loosely here */
}
</style>