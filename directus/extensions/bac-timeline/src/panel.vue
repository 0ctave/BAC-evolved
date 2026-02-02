<template>
  <div class="calendar-container" ref="containerRef" @click="selectedDay = null">
    <!-- Configuration Needed -->
    <div v-if="!collectionName || !roomCollectionName" class="empty-state">
      <div class="msg-box">
        <span class="material-icons">settings</span>
        <h3>Configuration Requise</h3>
        <p>Veuillez configurer les collections dans les paramètres du panneau.</p>
      </div>
    </div>

    <!-- Main Calendar UI -->
    <div v-else class="calendar-wrapper">
      <div class="view-title">
        <h1>{{ roomFilter ? roomFilter : 'Vue Combinée des Réservations' }}</h1>
      </div>

      <div class="calendar-header">
        <div class="nav-controls">
          <button class="nav-btn icon-btn" @click="changeMonth(-1)" title="Précédent">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button class="nav-btn icon-btn" @click="changeMonth(1)" title="Suivant">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <button class="nav-btn text-btn" @click="goToToday">Aujourd'hui</button>
        </div>

        <div class="mode-controls">
          <button
              class="nav-btn text-btn mode-btn"
              :class="{ active: isSelectionMode }"
              @click.stop="toggleSelectionMode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            {{ isSelectionMode ? 'Mode Blocage' : 'Bloquer Dates' }}
          </button>
        </div>

        <h2 class="month-label" v-if="!isDoubleView">{{ formatMonthTitle(monthsToDisplay[0]) }}</h2>

        <div class="legend" v-if="!roomFilter">
          <div v-for="room in visibleRooms" :key="room.id" class="legend-item">
            <span class="dot" :style="{ background: room.color }"></span>
            <span>{{ room.name }}</span>
          </div>
        </div>
      </div>

      <div class="calendars-row" :class="{ 'is-double': isDoubleView }">
        <div
            v-for="monthDate in monthsToDisplay"
            :key="monthDate.toISOString()"
            class="single-calendar"
        >
          <h3 class="calendar-month-title" v-if="isDoubleView">
            {{ formatMonthTitle(monthDate) }}
          </h3>

          <div class="weekdays-row">
            <div v-for="dayName in weekDays" :key="dayName" class="weekday-header">
              {{ dayName.substring(0, 3) }}
            </div>
          </div>

          <div class="calendar-grid">
            <div
                v-for="day in getCalendarDays(monthDate)"
                :key="day.iso"
                class="day-cell"
                :class="{
								'is-padding': day.isPadding,
								'is-today': day.isToday,
								'is-selected': isDaySelected(day.date),
								'in-selection-range': isInSelectionRange(day.date),
                'has-filter': !!roomFilter
							}"
                @click.stop="handleDayClick(day)"
            >
              <div class="day-header">
                <span class="day-number">{{ day.number }}</span>
              </div>

              <div class="day-content">
                <div v-for="lane in day.lanes" :key="lane.roomId" class="room-lane">
                  <div
                      v-for="seg in lane.segments"
                      :key="seg.id + seg.type"
                      class="booking-segment"
                      :class="[
                      seg.type,
                      {
                        'connect-left': seg.connectLeft,
                        'connect-right': seg.connectRight,
                        'is-blocked': seg.status === 'indisponible'
                      }
                    ]"
                      :style="{ backgroundColor: seg.color }"
                      :title="seg.label"
                  >
                    <span v-if="seg.showLabel" class="segment-label">
                      {{ seg.label }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Side Drawer -->
    <transition name="slide">
      <div v-if="selectedDay" class="side-drawer" @click.stop>
        <div class="drawer-header">
          <h3>{{ formatFullDate(selectedDay.date) }}</h3>
          <button class="close-btn" @click="selectedDay = null">×</button>
        </div>

        <div class="drawer-content">
          <div v-if="selectedDay.bookings.length === 0" class="no-bookings">
            Aucune réservation pour ce jour.
          </div>

          <div v-for="booking in selectedDay.bookings" :key="booking.id" class="booking-card">
            <div class="card-header" :style="{ borderLeftColor: getRoomColor(booking) }">
              <div class="room-name" :style="{ color: getRoomColor(booking) }">
                {{ getRoomNameFromBooking(booking) }}
              </div>
              <div class="status-badge" :class="normalizeStatus(booking[statusField])">
                {{ getStatusLabel(booking[statusField]) }}
              </div>
            </div>

            <div class="card-body">
              <div class="client-info">
                <div class="client-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div class="client-text">
                  <div class="name">{{ getClientName(booking) }}</div>
                  <div class="email">{{ getClientEmail(booking) }}</div>
                </div>
              </div>

              <div class="dates-info">
                <div class="date-row">
                  <span class="label">Arrivée</span>
                  <span class="value">{{ formatDateShort(booking[startDateField]) }}</span>
                </div>
                <div class="date-row">
                  <span class="label">Départ</span>
                  <span class="value">{{ formatDateShort(booking[endDateField]) }}</span>
                </div>
              </div>

              <div class="status-actions">
                <span class="label">Modifier le statut :</span>
                <div class="status-pills">
                  <button
                      v-for="opt in statusOptions"
                      :key="opt.value"
                      class="status-pill-btn"
                      :class="[opt.value, { active: normalizeStatus(booking[statusField]) === opt.value }]"
                      @click="updateBookingStatus(booking, opt.value)"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <button class="btn-link delete" @click="deleteBooking(booking)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Supprimer
              </button>
              <button class="btn-link" @click="openInDirectus(booking.id)">
                Voir la fiche <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-1"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Block Dates Modal -->
    <div v-if="showBlockModal" class="modal-overlay" @click.self="cancelSelection">
      <div class="modal-card">
        <h3>Bloquer une période</h3>
        <div class="modal-body">
          <div class="form-group">
            <label>Dates sélectionnées</label>
            <div class="date-display">
              {{ formatDateSafe(selectionStart) }} au {{ formatDateSafe(selectionEnd) }}
            </div>
          </div>
          <div class="form-group">
            <label>Chambre(s) concernée(s)</label>
            <select v-model="blockRoomId" class="modal-select">
              <option value="all">Toutes les chambres</option>
              <option v-for="r in visibleRooms" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelSelection">Annuler</button>
          <button class="btn-confirm" @click="confirmBlockDates" :disabled="!blockRoomId || submitting">
            {{ submitting ? '...' : 'Confirmer le blocage' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk';
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth,
  isSameDay, parseISO, isWithinInterval, addDays, isBefore, isAfter
} from 'date-fns';
import { fr } from 'date-fns/locale';

// --- 1. HELPERS ---

const statusOptions = [
  { value: 'en_attente', label: 'En Attente' },
  { value: 'confirmee', label: 'Confirmée' },
  { value: 'annulee', label: 'Annulée' },
  { value: 'indisponible', label: 'Indisponible' },
];

const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function normalizeStatus(val: string) {
  if (!val) return 'confirmee';
  const v = val.toLowerCase();
  if (v.includes('confirm')) return 'confirmee';
  if (v.includes('attente') || v.includes('pending')) return 'en_attente';
  if (v.includes('annul') || v.includes('cancel')) return 'annulee';
  if (v.includes('indisp')) return 'indisponible';
  return v;
}

function getStatusLabel(val: string) {
  const norm = normalizeStatus(val);
  const found = statusOptions.find(o => o.value === norm);
  return found ? found.label : val || 'Confirmée';
}

function formatDateSafe(d: Date | string | null) {
  if (!d) return '-';
  try {
    if (d instanceof Date) return format(d, 'dd/MM/yyyy');
    return format(parseISO(d), 'dd/MM/yyyy');
  } catch (e) { return '-'; }
}

function formatDateShort(d: string) {
  if (!d) return '-';
  try { return format(parseISO(d), 'dd/MM/yyyy'); } catch (e) { return '-'; }
}

function formatFullDate(d: Date) {
  if (!d) return '';
  return format(d, 'EEEE d MMMM yyyy', { locale: fr });
}

function formatMonthTitle(date: Date) {
  if (!date) return '';
  return format(date, 'MMMM yyyy', { locale: fr });
}

function stringToColor(str: string) {
  if (!str) return '#ccc';
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

// --- 2. PROPS & STATE ---

const props = defineProps({
  bookingCollection: { type: String, default: '' },
  bookingsCollection: { type: String, default: '' },
  roomCollection: { type: String, default: '' },
  roomsCollection: { type: String, default: '' },
  startDateField: { type: String, default: 'date_arrivee' },
  endDateField: { type: String, default: 'date_depart' },
  roomFieldName: { type: String, default: 'chambre' },
  roomRefField: { type: String, default: '' },
  clientField: { type: String, default: 'client' },
  statusField: { type: String, default: 'statut' },
  roomNameField: { type: String, default: 'Nom' },
  roomFilter: { type: String, default: '' },
});

const api = useApi();
const loading = ref(false);
const submitting = ref(false);
const bookings = ref<any[]>([]);
const roomsData = ref<any[]>([]);
const viewDate = ref(new Date());
const selectedDay = ref<any | null>(null);

const collectionName = computed(() => props.bookingCollection || props.bookingsCollection);
const roomCollectionName = computed(() => props.roomCollection || props.roomsCollection);
const actualRoomField = computed(() => props.roomRefField || props.roomFieldName);

const isSelectionMode = ref(false);
const selectionStart = ref<Date | null>(null);
const selectionEnd = ref<Date | null>(null);
const showBlockModal = ref(false);
const blockRoomId = ref<any>('all');

const containerRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);
let resizeObserver: ResizeObserver | null = null;
const isDoubleView = computed(() => containerWidth.value > 900);

// --- 3. COMPUTED ---

const monthsToDisplay = computed(() => {
  const months = [viewDate.value];
  if (isDoubleView.value) months.push(addMonths(viewDate.value, 1));
  return months;
});

const visibleRooms = computed(() => {
  let rooms = roomsData.value.map(r => ({
    id: r.id,
    name: r[props.roomNameField] || `Room ${r.id}`,
    color: r.color || stringToColor(r[props.roomNameField] || 'room')
  }));
  if (props.roomFilter && typeof props.roomFilter === 'string') {
    rooms = rooms.filter(r => r.name.toLowerCase().includes(props.roomFilter.toLowerCase()));
  }
  return rooms.sort((a, b) => String(a.id).localeCompare(String(b.id)));
});

// --- 4. ACTION FUNCTIONS ---

function getRoomNameFromBooking(b: any) {
  const val = b?.[actualRoomField.value];
  if (typeof val === 'object') return val?.[props.roomNameField] || val?.nom || 'Chambre';
  const found = roomsData.value.find(r => r.id == val);
  return found ? found[props.roomNameField] : 'Chambre';
}

function getRoomIdFromBooking(b: any) {
  const val = b?.[actualRoomField.value];
  return typeof val === 'object' ? val?.id : val;
}

function getRoomColor(b: any) {
  const name = getRoomNameFromBooking(b);
  const found = visibleRooms.value.find(r => r.name === name);
  return found ? found.color : '#ccc';
}

function getClientName(b: any) {
  if (normalizeStatus(b[props.statusField]) === 'indisponible') return 'Indisponible';
  const client = b[props.clientField];
  if (typeof client === 'object' && client !== null) return client.nom || client.name || 'Client';
  return 'Client';
}

function getClientEmail(b: any) { return b?.[props.clientField]?.email || ''; }

function toggleSelectionMode() {
  isSelectionMode.value = !isSelectionMode.value;
  cancelSelection();
}

function handleDayClick(day: any) {
  if (isSelectionMode.value) {
    if (!selectionStart.value) {
      selectionStart.value = day.date;
    } else if (!selectionEnd.value) {
      if (isBefore(day.date, selectionStart.value)) {
        selectionEnd.value = selectionStart.value;
        selectionStart.value = day.date;
      } else {
        selectionEnd.value = day.date;
      }
      openBlockModal();
    } else {
      selectionStart.value = day.date;
      selectionEnd.value = null;
    }
  } else {
    if (day.bookings.length > 0) {
      selectedDay.value = day;
    } else {
      selectedDay.value = null;
    }
  }
}

function isDaySelected(date: Date) {
  if (!selectionStart.value) return false;
  return isSameDay(date, selectionStart.value) || (selectionEnd.value && isSameDay(date, selectionEnd.value));
}

function isInSelectionRange(date: Date) {
  if (!selectionStart.value || !selectionEnd.value) return false;
  return isWithinInterval(date, { start: selectionStart.value, end: selectionEnd.value });
}

function openBlockModal() {
  // If we have a room filter, default the modal to that room
  if (props.roomFilter) {
    const r = visibleRooms.value.find(r => r.name.toLowerCase().includes(props.roomFilter.toLowerCase()));
    if (r) {
      blockRoomId.value = r.id;
    } else {
      blockRoomId.value = 'all';
    }
  } else {
    // Default to 'all' for combined view
    blockRoomId.value = 'all';
  }
  showBlockModal.value = true;
}

function cancelSelection() {
  selectionStart.value = null;
  selectionEnd.value = null;
  showBlockModal.value = false;
  blockRoomId.value = 'all';
}

function openInDirectus(id: any) {
  if(!collectionName.value) return;
  window.open(`/admin/content/${collectionName.value}/${id}`, '_blank');
}

function changeMonth(delta: number) { viewDate.value = addMonths(viewDate.value, delta); }
function goToToday() { viewDate.value = new Date(); }

// --- 5. GRID LOGIC ---

function getCalendarDays(baseDate: Date) {
  const start = startOfWeek(startOfMonth(baseDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(baseDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return days.map(date => {
    // 1. Get all bookings relevant to this day
    const dayBookings = bookings.value.filter(b => {
      const bStart = parseISO(b[props.startDateField]);
      const bEnd = parseISO(b[props.endDateField]);
      return isWithinInterval(date, { start: bStart, end: bEnd });
    });

    // 2. Generate lanes for each room
    const lanes = visibleRooms.value.map(room => {
      const roomBookings = dayBookings.filter(b => getRoomIdFromBooking(b) == room.id);

      const segments: any[] = [];

      roomBookings.forEach(booking => {
        const bStart = parseISO(booking[props.startDateField]);
        const bEnd = parseISO(booking[props.endDateField]);

        const isArrival = isSameDay(date, bStart);
        const isDeparture = isSameDay(date, bEnd);
        const isStayOver = isAfter(date, bStart) && isBefore(date, bEnd);

        if (isStayOver) {
          segments.push({
            id: booking.id,
            type: 'full',
            color: room.color,
            status: normalizeStatus(booking[props.statusField]),
            label: getClientName(booking),
            showLabel: date.getDay() === 1 || isSameDay(date, addDays(bStart, 1)),
            connectLeft: true,
            connectRight: true
          });
        } else if (isArrival) {
          segments.push({
            id: booking.id,
            type: 'check-in',
            color: room.color,
            status: normalizeStatus(booking[props.statusField]),
            label: getClientName(booking),
            showLabel: true,
            connectLeft: false,
            connectRight: !isDeparture
          });
        } else if (isDeparture) {
          segments.push({
            id: booking.id,
            type: 'check-out',
            color: room.color,
            status: normalizeStatus(booking[props.statusField]),
            label: getClientName(booking),
            showLabel: false,
            connectLeft: true,
            connectRight: false
          });
        }
      });

      segments.sort((a, b) => (a.type === 'check-out' ? -1 : 1));

      return { roomId: room.id, segments };
    });

    return {
      date,
      iso: date.toISOString(),
      number: format(date, 'd'),
      isPadding: !isSameMonth(date, baseDate),
      isToday: isSameDay(date, new Date()),
      bookings: dayBookings,
      lanes
    };
  });
}

// --- 6. API CALLS ---

async function fetchData() {
  if (!collectionName.value || !roomCollectionName.value) return;
  loading.value = true;
  try {
    const roomsRes = await api.get(`/items/${roomCollectionName.value}`, { params: { limit: -1 } });
    roomsData.value = roomsRes.data.data;

    const start = format(subMonths(startOfMonth(viewDate.value), 1), 'yyyy-MM-dd');
    const end = format(addMonths(endOfMonth(viewDate.value), 2), 'yyyy-MM-dd');

    const bookingsRes = await api.get(`/items/${collectionName.value}`, {
      params: {
        limit: -1,
        fields: ['*', `${actualRoomField.value}.*`, `${props.clientField}.*`],
        filter: {
          _and: [
            { [props.endDateField]: { _gte: start } },
            { [props.startDateField]: { _lte: end } }
          ]
        }
      }
    });
    bookings.value = bookingsRes.data.data;
  } catch (err: any) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function confirmBlockDates() {
  if (!selectionStart.value || !selectionEnd.value || !blockRoomId.value) return;
  submitting.value = true;
  try {
    const startDateStr = format(selectionStart.value, 'yyyy-MM-dd');
    const endDateStr = format(selectionEnd.value, 'yyyy-MM-dd');

    // Determine which rooms to block
    const roomIdsToBlock = blockRoomId.value === 'all'
        ? visibleRooms.value.map(r => r.id)
        : [blockRoomId.value];

    // Create the payload for bulk insertion
    const payloads = roomIdsToBlock.map(id => ({
      [props.startDateField]: startDateStr,
      [props.endDateField]: endDateStr,
      [actualRoomField.value]: id,
      [props.statusField]: 'indisponible',
    }));

    // Perform the bulk creation
    // Directus supports passing an array to the create items endpoint
    await api.post(`/items/${collectionName.value}`, payloads.length === 1 ? payloads[0] : payloads);

    await fetchData();
    cancelSelection();
    isSelectionMode.value = false;
  } catch (e: any) {
    console.error(e);
  } finally { submitting.value = false; }
}

async function updateBookingStatus(booking: any, newStatus: string) {
  const old = booking[props.statusField];
  booking[props.statusField] = newStatus;
  try {
    await api.patch(`/items/${collectionName.value}/${booking.id}`, { [props.statusField]: newStatus });
    await fetchData();
  } catch { booking[props.statusField] = old; }
}

async function deleteBooking(booking: any) {
  if (!confirm("Voulez-vous vraiment supprimer cette réservation ?")) return;
  try {
    await api.delete(`/items/${collectionName.value}/${booking.id}`);
    selectedDay.value = null;
    await fetchData();
  } catch (e) { console.error(e); }
}

watch(() => [collectionName.value, roomCollectionName.value, viewDate.value, isDoubleView.value], fetchData);

onMounted(() => {
  fetchData();
  if (containerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) { containerWidth.value = entry.contentRect.width; }
    });
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => { if (resizeObserver) resizeObserver.disconnect(); });
</script>

<style scoped>
.calendar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--theme--background);
  color: var(--theme--foreground);
  font-family: var(--family-sans);
  overflow: hidden;
  position: relative;
}

.calendar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow: hidden;
}

.view-title h1 { margin: 0; font-size: 1.6rem; font-weight: 900; text-align: center; margin-bottom: 24px; color: var(--theme--primary); }

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.nav-controls { display: flex; align-items: center; gap: 10px; }

.nav-btn {
  background: var(--theme--background-accent);
  border: 1px solid var(--theme--border-color-subdued);
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 10px;
  color: var(--theme--foreground);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-btn:hover { background: var(--theme--background-subdued); transform: scale(1.02); }
.text-btn { padding: 0 16px; font-weight: 700; font-size: 0.9rem; }
.mode-btn.active { background: var(--theme--primary); color: white; border-color: var(--theme--primary); }

.month-label { font-size: 1.1rem; font-weight: 800; margin: 0; text-transform: capitalize; }

.legend { display: flex; gap: 16px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 700; }
.dot { width: 10px; height: 10px; border-radius: 50%; }

.calendars-row { display: flex; flex: 1; gap: 32px; min-height: 0; }
.single-calendar { flex: 1; display: flex; flex-direction: column; min-height: 0; }

.weekdays-row { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 12px; }
.weekday-header { text-align: center; font-weight: 800; color: var(--theme--foreground-subdued); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: 1fr;
  flex: 1;
  border-top: 1px solid var(--theme--border-color-subdued);
  border-left: 1px solid var(--theme--border-color-subdued);
}

.day-cell {
  border-right: 1px solid var(--theme--border-color-subdued);
  border-bottom: 1px solid var(--theme--border-color-subdued);
  padding: 6px 0;
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: pointer;
  background: var(--theme--background);
  transition: background 0.15s;
}
.day-cell:hover { background: var(--theme--background-subdued); }
.day-cell.is-padding { opacity: 0.35; background: var(--theme--background-accent); }

.day-header { padding: 0 10px; display: flex; justify-content: flex-end; margin-bottom: 4px; z-index: 10; }
.day-number { font-size: 0.8rem; font-weight: 700; opacity: 0.5; }
.is-today .day-number { color: var(--theme--primary); opacity: 1; font-weight: 900; transform: scale(1.1); }

.day-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px; /* Vertical spacing between rooms */
  justify-content: center;
}

/* Lane Management */
.room-lane {
  height: 34px; /* Significantly thicker bars for combined view */
  display: flex;
  position: relative;
  gap: 0;
  margin: 0;
  width: 100%;
}

/* Expand lane when filtered (Single Room View) */
.day-cell.has-filter .room-lane {
  height: 64px;
}

/* Segment Logic */
.booking-segment {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 10px;
  position: relative;
  z-index: 5;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2);
  overflow: hidden;
  transition: all 0.2s ease;
  background-image: linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.08) 100%);
}

/* Correcting connection and border hiding */
.booking-segment.connect-left {
  margin-left: -1px; /* Overlap the cell border on the left */
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
}
.booking-segment.connect-right {
  margin-right: -1px; /* Overlap the cell border on the right */
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
  z-index: 6; /* Slightly higher to hide overlap line */
}

/* Segment widths and transition gaps */
.booking-segment.full {
  width: calc(100% - 6px);
  margin: 0 3px;
  border-radius: 6px;
}
.booking-segment.full.connect-left { margin-left: -1px; width: calc(100% - 3px + 1px); }
.booking-segment.full.connect-right { margin-right: -1px; width: calc(100% - 3px + 1px); }
.booking-segment.full.connect-left.connect-right { margin-left: -1px; margin-right: -1px; width: calc(100% + 2px); }

/* Transition positions with larger 12px gap in the middle */
.booking-segment.check-out {
  width: calc(50% - 6px); /* Half cell minus half of the gap */
  margin-left: 3px;
  border-radius: 6px 0 0 6px;
}
.booking-segment.check-out.connect-left {
  margin-left: -1px;
  width: calc(50% - 6px + 1px);
}

.booking-segment.check-in {
  width: calc(50% - 6px);
  margin-right: 3px;
  border-radius: 0 6px 6px 0;
  margin-left: auto; /* Push to the right side of the lane */
}
.booking-segment.check-in.connect-right {
  margin-right: -1px;
  width: calc(50% - 6px + 1px);
}

.booking-segment.is-blocked { background: #1a1a1a !important; }

.segment-label {
  font-size: 0.7rem;
  font-weight: 800;
  color: white;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  pointer-events: none;
  letter-spacing: 0.02em;
}

.day-cell.has-filter .segment-label {
  font-size: 0.85rem;
}

/* Selection Mode */
.day-cell.is-selected { background: var(--theme--primary-subdued); box-shadow: inset 0 0 0 2px var(--theme--primary); }
.day-cell.in-selection-range { background: rgba(var(--primary-rgb), 0.1); }

/* Side Drawer & UI Components */
.side-drawer { position: absolute; top: 0; right: 0; bottom: 0; width: 440px; background: var(--theme--background); z-index: 100; border-left: 1px solid var(--theme--border-color); display: flex; flex-direction: column; box-shadow: -15px 0 45px rgba(0,0,0,0.15); }
.drawer-header { padding: 24px; border-bottom: 1px solid var(--theme--border-color-subdued); display: flex; justify-content: space-between; align-items: center; }
.close-btn { background: none; border: none; font-size: 2rem; cursor: pointer; color: var(--theme--foreground-subdued); line-height: 1; }
.drawer-content { flex: 1; overflow-y: auto; padding: 24px; background: var(--theme--background-subdued); }

.booking-card { background: var(--theme--background); border-radius: 14px; border: 1px solid var(--theme--border-color-subdued); margin-bottom: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.card-header { padding: 16px 20px; border-left: 6px solid #ccc; display: flex; justify-content: space-between; align-items: center; background: var(--theme--background); }
.room-name { font-weight: 800; font-size: 1rem; }
.status-badge { font-size: 0.7rem; padding: 4px 12px; border-radius: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; }
.status-badge.confirmee { background: #e6f4ea; color: #1e8e3e; }
.status-badge.indisponible { background: #1a1a1a; color: white; }

.card-body { padding: 20px; }
.client-info { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.client-icon { width: 40px; height: 40px; background: var(--theme--background-accent); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--theme--primary); }
.client-text .name { font-weight: 800; font-size: 1.1rem; }
.client-text .email { font-size: 0.85rem; color: var(--theme--foreground-subdued); }

.dates-info { background: var(--theme--background-subdued); padding: 16px; border-radius: 12px; font-size: 0.9rem; border: 1px solid var(--theme--border-color-subdued); }
.date-row { display: flex; justify-content: space-between; margin-bottom: 6px; }

.status-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.status-pill-btn { border: 1px solid var(--theme--border-color); background: none; font-size: 0.8rem; padding: 6px 14px; border-radius: 20px; cursor: pointer; font-weight: 700; transition: all 0.2s; }
.status-pill-btn.active { background: var(--theme--primary); color: white; border-color: var(--theme--primary); box-shadow: 0 4px 8px var(--theme--primary-subdued); }

.card-footer { padding: 16px 20px; border-top: 1px solid var(--theme--border-color-subdued); display: flex; justify-content: space-between; background: var(--theme--background-subdued); }
.btn-link { background: none; border: none; color: var(--theme--primary); font-size: 0.85rem; font-weight: 800; cursor: pointer; text-decoration: none; }
.btn-link.delete { color: var(--theme--danger); }

.modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal-card { background: var(--theme--background); padding: 32px; border-radius: 20px; width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.modal-select { width: 100%; padding: 12px; border-radius: 10px; margin-top: 12px; border: 1px solid var(--theme--border-color); font-weight: 600; background: var(--theme--background); color: var(--theme--foreground); }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.btn-confirm { background: var(--theme--primary); color: white; border: none; padding: 10px 24px; border-radius: 10px; cursor: pointer; font-weight: 800; }

.loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.8); z-index: 300; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
.spinner { width: 40px; height: 40px; border: 4px solid #eee; border-top-color: var(--theme--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.slide-enter-active, .slide-leave-active { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>