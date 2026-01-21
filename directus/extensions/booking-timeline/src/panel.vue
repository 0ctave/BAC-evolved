<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';

const props = defineProps({
  roomsCollection: { type: String, default: 'chambres' },
  bookingsCollection: { type: String, default: 'reservations_chambre' },
  startDateField: { type: String, default: 'date_arrivee' },
  endDateField: { type: String, default: 'date_depart' },
  roomRefField: { type: String, default: 'chambre' },
  clientField: { type: String, default: 'client' },
  statusField: { type: String, default: 'statut' },
});

const api = useApi();
const rooms = ref([]);
const bookings = ref([]);
const viewStartDate = ref(new Date());
const selectedBooking = ref(null);

// Zoom Configuration
const zoomModes = [
  { label: '3M', days: 90, width: '20px', fontSize: '9px' },
  { label: '2M', days: 60, width: '30px', fontSize: '10px' },
  { label: '30J', days: 30, width: '45px', fontSize: '11px' },
  { label: '14J', days: 14, width: '90px', fontSize: '12px' },
  { label: '7J', days: 7, width: '180px', fontSize: '14px' },
];
const currentZoomIndex = ref(2);
const currentZoom = computed(() => zoomModes[currentZoomIndex.value]);

// Set start date to today 00:00
viewStartDate.value.setHours(0,0,0,0);

const days = computed(() => {
  const arr = [];
  for (let i = 0; i < currentZoom.value.days; i++) {
    const d = new Date(viewStartDate.value);
    d.setDate(d.getDate() + i);
    arr.push(d);
  }
  return arr;
});

// --- ROBUST Month Segments Calculation ---
const monthSegments = computed(() => {
  const segments = [];
  if (!days.value.length) return segments;

  let currentStartIdx = 0;
  let currentMonth = days.value[0].getMonth();
  let currentYear = days.value[0].getFullYear();

  for (let i = 1; i <= days.value.length; i++) {
    const d = i < days.value.length ? days.value[i] : null;

    // If we hit the end of the array OR a different month
    if (!d || d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) {

      // Create the segment for the previous block
      const dateObj = days.value[currentStartIdx];
      const label = dateObj.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

      segments.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        // Grid column starts at 2 (1 is rooms) + index
        start: currentStartIdx + 2,
        // Span is current index minus start index
        span: i - currentStartIdx,
        isOdd: currentMonth % 2 !== 0
      });

      // Reset trackers for the next block
      if (d) {
        currentStartIdx = i;
        currentMonth = d.getMonth();
        currentYear = d.getFullYear();
      }
    }
  }
  return segments;
});

// Format helpers
const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const getWeekendClass = (d) => {
  const day = d.getDay();
  return (day === 0 || day === 6) ? 'is-weekend' : '';
};
const isNewMonth = (d) => d.getDate() === 1;

// Helper for alternating background on individual days
function getMonthBgClass(d) {
  // Return specific classes for styling
  return (d.getMonth() % 2 !== 0) ? 'bg-month-odd' : 'bg-month-even';
}

// --- Color Helpers ---
function stringToHslColor(str, saturation = 60, lightness = 85) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${saturation}%, ${lightness}%)`;
}

function getRoomColor(room) {
  return stringToHslColor(room.nom || room.id || 'room');
}

function getRoomDarkColor(room) {
  return stringToHslColor(room.nom || room.id || 'room', 70, 40);
}

// --- Data Fetching ---
async function fetchData() {
  if (!props.roomsCollection || !props.bookingsCollection) return;

  try {
    const roomsRes = await api.get(`/items/${props.roomsCollection}`);
    rooms.value = roomsRes.data.data;

    const fields = ['*', `${props.roomRefField}.*`];
    if (props.clientField) fields.push(`${props.clientField}.*`);

    const bookingsRes = await api.get(`/items/${props.bookingsCollection}`, {
      params: { limit: -1, fields: fields }
    });
    bookings.value = bookingsRes.data.data;
  } catch (e) {
    console.error("Error fetching data", e);
  }
}

onMounted(fetchData);
watch(() => [props.roomsCollection, props.bookingsCollection], fetchData);

// --- Timeline Logic ---
function getBookingsForRoom(roomId) {
  if (!bookings.value.length) return [];

  const viewStart = days.value[0].getTime();
  const viewEnd = days.value[days.value.length - 1].getTime();

  return bookings.value.filter(b => {
    const bRoomId = typeof b[props.roomRefField] === 'object' ? b[props.roomRefField]?.id : b[props.roomRefField];
    return bRoomId === roomId;
  }).filter(b => {
    const start = new Date(b[props.startDateField]).getTime();
    const end = new Date(b[props.endDateField]).getTime();
    return (start < viewEnd && end > viewStart);
  }).map(b => {
    const startDate = new Date(b[props.startDateField]);
    const endDate = new Date(b[props.endDateField]);

    let startOffset = Math.floor((startDate - viewStartDate.value) / (1000 * 60 * 60 * 24));
    let duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    if (startOffset < 0) {
      duration += startOffset;
      startOffset = 0;
    }

    return {
      ...b,
      gridStyle: {
        gridColumnStart: startOffset + 2,
        gridColumnEnd: `span ${duration}`,
      }
    };
  });
}

function shiftDate(offset) {
  const newDate = new Date(viewStartDate.value);
  newDate.setDate(newDate.getDate() + offset);
  viewStartDate.value = newDate;
}

function getClientName(b) {
  if (!props.clientField || !b[props.clientField]) return 'Client Inconnu';
  const c = b[props.clientField];
  return `${c.prenom || ''} ${c.nom || ''}`.trim() || c.email || 'Sans Nom';
}

function getStatusColor(status) {
  const s = status?.toLowerCase();
  if (s === 'published' || s === 'confirmee' || s === 'confirmed') return 'var(--theme--success)';
  if (s === 'draft' || s === 'attente' || s === 'pending') return 'var(--theme--warning)';
  if (s === 'archived' || s === 'annulee' || s === 'cancelled') return 'var(--theme--danger)';
  return 'var(--theme--primary)';
}
</script>

<template>
  <div class="timeline-panel" :style="{ '--day-width': currentZoom.width, '--day-font': currentZoom.fontSize }">
    <!-- Header Actions -->
    <div class="header">
      <div class="title-section">
        <h3>Planning</h3>
        <span class="date-range">
					{{ days[0].toLocaleDateString('fr-FR', {day: 'numeric', month:'short'}) }} -
					{{ days[days.length-1].toLocaleDateString('fr-FR', {day: 'numeric', month:'short'}) }}
				</span>
      </div>

      <div class="controls-group">
        <div class="zoom-controls">
          <button
              v-for="(mode, idx) in zoomModes"
              :key="idx"
              class="zoom-btn"
              :class="{ active: currentZoomIndex === idx }"
              @click="currentZoomIndex = idx"
          >
            {{ mode.label }}
          </button>
        </div>

        <div class="nav-controls">
          <button class="icon-btn" @click="shiftDate(-7)">
            <v-icon name="chevron_left" />
          </button>
          <button class="today-btn" @click="viewStartDate = new Date(); viewStartDate.setHours(0,0,0,0);">Aujourd'hui</button>
          <button class="icon-btn" @click="shiftDate(7)">
            <v-icon name="chevron_right" />
          </button>
        </div>
      </div>
    </div>

    <!-- Main Grid Container -->
    <div class="grid-scroll-area">
      <div class="timeline-grid" :style="{ gridTemplateColumns: '200px repeat(' + currentZoom.days + ', var(--day-width))' }">

        <!-- ROW 1: Month Headers (Spanning) -->
        <div class="header-corner sticky-corner" style="grid-row: 1 / span 2; grid-column: 1;">
          <div class="corner-content">
            <v-icon name="meeting_room" />
            <span>Chambres</span>
          </div>
        </div>

        <!-- Month segments loop -->
        <div
            v-for="(seg, idx) in monthSegments"
            :key="'m-'+idx"
            class="header-month sticky-top-1"
            :class="{ 'month-odd': seg.isOdd, 'month-even': !seg.isOdd }"
            :style="{ gridColumn: `${seg.start} / span ${seg.span}`, gridRow: 1 }"
        >
          <span class="month-label-text">{{ seg.label }}</span>
        </div>

        <!-- ROW 2: Day Headers -->
        <div
            v-for="d in days"
            :key="d"
            class="header-day sticky-top-2"
            :class="[getWeekendClass(d), getMonthBgClass(d), { 'new-month-border': isNewMonth(d) }]"
            style="grid-row: 2"
        >
          <!-- Weekday Name -->
          <span class="day-name" v-if="parseInt(currentZoom.width) > 35">{{ d.toLocaleDateString('fr-FR', { weekday: 'short' }) }}</span>
          <!-- Day Number -->
          <span class="day-num">{{ d.getDate() }}</span>
        </div>

        <!-- ROW 3+: Room Rows -->
        <template v-for="(room, index) in rooms" :key="room.id">
          <!-- 1. Room Name Cell -->
          <div
              class="room-cell sticky-col"
              :style="{
							gridRow: index + 3,
							'--room-color': getRoomColor(room),
							'--room-dark': getRoomDarkColor(room)
						}"
          >
            <div class="room-icon-box">
              <v-icon name="bed" small />
            </div>
            <div class="room-info">
              <span class="room-name">{{ room.nom }}</span>
              <span class="room-type">{{ room.type?.nom }}</span>
            </div>
          </div>

          <!-- 2. Background Grid Cells -->
          <div
              v-for="d in days"
              :key="d"
              class="grid-cell-bg"
              :class="[getWeekendClass(d), getMonthBgClass(d), { 'new-month-border': isNewMonth(d) }]"
              :style="{ gridRow: index + 3 }"
          ></div>

          <!-- 3. Events Overlay -->
          <div class="events-row" :style="{
						gridRow: index + 3,
						gridTemplateColumns: '200px repeat(' + currentZoom.days + ', var(--day-width))'
					}">
            <div
                v-for="booking in getBookingsForRoom(room.id)"
                :key="booking.id"
                class="booking-bar"
                :style="{
								...booking.gridStyle,
								'--bar-color': getStatusColor(booking[statusField])
							}"
                @click="selectedBooking = booking"
            >
              <div class="bar-content" v-if="parseInt(currentZoom.width) > 35">
                <span class="client-name">{{ getClientName(booking) }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Details Drawer -->
    <transition name="slide-fade">
      <div v-if="selectedBooking" class="details-drawer">
        <div class="drawer-header">
          <h4>Détails Réservation</h4>
          <button class="close-btn" @click="selectedBooking = null">
            <v-icon name="close" />
          </button>
        </div>

        <div class="drawer-content">
          <div class="status-banner" :style="{ backgroundColor: getStatusColor(selectedBooking[statusField]) }">
            <v-icon name="bookmark" />
            <span>{{ selectedBooking[statusField]?.toUpperCase() }}</span>
          </div>

          <div class="info-group">
            <label>Client</label>
            <div class="client-card">
              <div class="avatar-placeholder">
                {{ getClientName(selectedBooking).charAt(0).toUpperCase() }}
              </div>
              <div class="client-details">
                <strong>{{ getClientName(selectedBooking) }}</strong>
                <small v-if="selectedBooking[clientField]?.email">{{ selectedBooking[clientField].email }}</small>
                <small v-if="selectedBooking[clientField]?.telephone">{{ selectedBooking[clientField].telephone }}</small>
              </div>
            </div>
          </div>

          <div class="info-group">
            <label>Dates</label>
            <div class="date-display">
              <div class="date-box">
                <span class="label">Arrivée</span>
                <span class="val">{{ formatDate(selectedBooking[startDateField]) }}</span>
              </div>
              <div class="arrow"><v-icon name="arrow_forward" /></div>
              <div class="date-box">
                <span class="label">Départ</span>
                <span class="val">{{ formatDate(selectedBooking[endDateField]) }}</span>
              </div>
            </div>
          </div>

          <div class="info-group">
            <label>Chambre</label>
            <div class="room-tag" :style="{
							backgroundColor: getRoomColor(selectedBooking[roomRefField]),
							color: getRoomDarkColor(selectedBooking[roomRefField])
						}">
              <v-icon name="bed" small />
              <span>{{ selectedBooking[roomRefField]?.nom || 'Chambre' }}</span>
            </div>
          </div>

          <div class="actions">
            <a
                :href="`/admin/content/${bookingsCollection}/${selectedBooking.id}`"
                target="_blank"
                class="edit-link"
            >
              <v-icon name="open_in_new" small />
              Ouvrir la fiche complète
            </a>
          </div>
        </div>
      </div>
    </transition>

    <div v-if="selectedBooking" class="backdrop" @click="selectedBooking = null"></div>
  </div>
</template>

<style scoped>
/* --- Layout --- */
.timeline-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--theme--background);
  position: relative;
  overflow: hidden;
  --header-row-1-height: 32px;
  --header-row-2-height: 40px;
}

/* --- Header --- */
.header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--theme--background);
  border-bottom: 1px solid var(--theme--border-detail);
  flex-wrap: wrap;
  gap: 10px;
}
.title-section h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--theme--foreground); }
.date-range { font-size: 0.85rem; color: var(--theme--foreground-subdued); }

.controls-group { display: flex; align-items: center; gap: 16px; }

.zoom-controls { display: flex; background: var(--theme--background-subdued); border-radius: 6px; padding: 2px; }
.zoom-btn {
  background: none; border: none; padding: 4px 10px; font-size: 0.75rem; font-weight: 600;
  color: var(--theme--foreground-subdued); cursor: pointer; border-radius: 4px;
}
.zoom-btn.active { background: var(--theme--background); color: var(--theme--primary); box-shadow: 0 1px 2px rgba(0,0,0,0.1); }

.nav-controls { display: flex; gap: 8px; align-items: center; }
.icon-btn {
  background: none; border: none; cursor: pointer; color: var(--theme--foreground);
  padding: 4px; border-radius: 50%; transition: background 0.2s;
}
.icon-btn:hover { background-color: var(--theme--background-accent); }
.today-btn {
  background: var(--theme--primary-subdued); color: var(--theme--primary);
  border: none; padding: 4px 12px; border-radius: 4px; font-weight: 600; font-size: 0.8rem; cursor: pointer;
}

/* --- Grid Area --- */
.grid-scroll-area {
  flex: 1;
  overflow: auto;
  position: relative;
}
.timeline-grid {
  display: grid;
  grid-auto-rows: 60px; /* Base row height for content */
}

/* --- Headers --- */
.header-corner {
  background: var(--theme--background);
  z-index: 30;
  border-right: 2px solid var(--theme--border-detail);
  border-bottom: 2px solid var(--theme--border-detail);
  display: flex; align-items: center; padding-left: 16px;
}
.corner-content { display: flex; flex-direction: column; color: var(--theme--foreground-subdued); font-weight: 600; font-size: 0.8rem; gap: 4px; }

/* Month Header */
.header-month {
  font-weight: 700;
  font-size: 0.85rem;
  display: flex; align-items: center; justify-content: center;
  z-index: 15;
  border-right: 1px solid rgba(0,0,0,0.1);
  text-transform: capitalize;
  overflow: hidden;
}
/* Stronger contrast for Alternating Months in Header */
.header-month.month-odd { background: var(--theme--primary); color: white; }
.header-month.month-even { background: var(--theme--primary-subdued); color: var(--theme--primary); border-right: 1px solid var(--theme--primary); }

.month-label-text { white-space: nowrap; }

/* Day Header */
.header-day {
  border-bottom: 2px solid var(--theme--border-detail);
  border-right: 1px solid var(--theme--border-subdued);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-size: var(--day-font); font-weight: 600; color: var(--theme--foreground-subdued);
  z-index: 10;
}
.header-day.is-weekend { color: var(--theme--primary); font-weight: 800; }
.day-name { font-size: 0.8em; text-transform: uppercase; margin-bottom: 2px; }

/* Sticky Positioning */
.sticky-corner { position: sticky; left: 0; top: 0; }
.sticky-top-1 { position: sticky; top: 0; height: var(--header-row-1-height); }
.sticky-top-2 { position: sticky; top: var(--header-row-1-height); height: var(--header-row-2-height); }
.sticky-col { position: sticky; left: 0; background: var(--theme--background); z-index: 20; border-right: 2px solid var(--theme--border-detail); }


/* --- Room Rows --- */
.room-cell {
  padding: 0 16px;
  border-bottom: 1px solid var(--theme--border-subdued);
  display: flex; align-items: center; gap: 12px;
  justify-content: flex-start;
}
.room-icon-box {
  width: 32px; height: 32px; border-radius: 8px;
  background: var(--room-color); color: var(--room-dark);
  display: flex; align-items: center; justify-content: center;
}
.room-info { display: flex; flex-direction: column; }
.room-name { font-weight: 700; color: var(--theme--foreground); font-size: 0.9rem; }
.room-type { font-size: 0.75rem; color: var(--theme--foreground-subdued); }

/* --- Grid Body --- */
.grid-cell-bg {
  border-right: 1px dashed var(--theme--border-subdued);
  border-bottom: 1px solid var(--theme--border-subdued);
}

/* Visible Background Alternating Styles */
.bg-month-even { background: var(--theme--background); }
.bg-month-odd { background: rgba(0,0,0,0.06); } /* Much darker to be visible */

/* Weekend Tint */
.grid-cell-bg.is-weekend { background-color: rgba(var(--theme--primary-rgb), 0.1); }

/* --- Month Delimiter --- */
.new-month-border {
  border-left: 3px solid var(--theme--primary) !important;
}

/* --- Events --- */
.events-row {
  grid-column: 1 / -1;
  display: grid;
  pointer-events: none;
  align-items: center;
}

.booking-bar {
  background-color: var(--bar-color);
  color: white;
  height: 52px;
  border-radius: 6px;
  margin: 0 1px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  pointer-events: auto;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  cursor: pointer;
  transition: transform 0.1s;
  z-index: 6;
}

.booking-bar:hover { transform: translateY(-1px); filter: brightness(1.1); z-index: 25; }
.bar-content { font-size: 0.8rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* --- Drawer --- */
.backdrop {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.3); z-index: 40;
}
.details-drawer {
  position: absolute; top: 0; right: 0; bottom: 0;
  width: 320px;
  background: var(--theme--background);
  box-shadow: -5px 0 15px rgba(0,0,0,0.1);
  z-index: 50;
  display: flex; flex-direction: column;
  border-left: 1px solid var(--theme--border-normal);
}
.drawer-header { padding: 16px; border-bottom: 1px solid var(--theme--border-subdued); display: flex; justify-content: space-between; align-items: center; }
.drawer-header h4 { margin: 0; font-size: 1.1rem; }
.close-btn { background: none; border: none; cursor: pointer; color: var(--theme--foreground-subdued); }
.drawer-content { flex: 1; padding: 0; overflow-y: auto; }
.status-banner { padding: 12px 16px; color: white; display: flex; align-items: center; gap: 8px; font-weight: bold; }
.info-group { padding: 16px; border-bottom: 1px solid var(--theme--border-subdued); }
.info-group label { display: block; font-size: 0.75rem; text-transform: uppercase; color: var(--theme--foreground-subdued); margin-bottom: 8px; }
.client-card { display: flex; align-items: center; gap: 12px; }
.avatar-placeholder { width: 40px; height: 40px; border-radius: 50%; background: var(--theme--primary-subdued); color: var(--theme--primary); display: flex; align-items: center; justify-content: center; font-weight: bold; }
.client-details { display: flex; flex-direction: column; }
.date-display { display: flex; justify-content: space-between; align-items: center; background: var(--theme--background-subdued); padding: 10px; border-radius: 6px; }
.date-box { display: flex; flex-direction: column; }
.date-box .label { font-size: 0.7rem; color: var(--theme--foreground-subdued); }
.date-box .val { font-weight: 600; color: var(--theme--foreground); }
.room-tag { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; }
.actions { padding: 20px; text-align: center; }
.edit-link { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 10px; background: var(--theme--primary); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; transition: background 0.2s; }
.edit-link:hover { background: var(--theme--primary-accent); }
.slide-fade-enter-active, .slide-fade-leave-active { transition: transform 0.3s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(100%); }
</style>