<template>
  <div class="calendar-container" ref="containerRef" @click="selectedDay = null">
    <!-- Configuration Needed -->
    <div v-if="!collectionName || !roomCollectionName" class="empty-state">
      <div class="msg-box">
        <span class="icon">settings</span>
        <h3>Configuration Requise</h3>
        <p>Veuillez configurer les collections dans les paramètres du panneau.</p>
      </div>
    </div>

    <!-- Main Calendar UI -->
    <div v-else class="calendar-wrapper">
      <!-- Top Title -->
      <div class="view-title">
        <h1>{{ roomFilter ? roomFilter : 'Vue Combinée des Réservations' }}</h1>
      </div>

      <!-- Header: Navigation & Stats -->
      <div class="calendar-header">
        <div class="nav-controls">
          <button class="nav-btn icon-btn" @click="changeMonth(-1)" title="Précédent">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button class="nav-btn icon-btn" @click="changeMonth(1)" title="Suivant">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <button class="nav-btn text-btn" @click="goToToday">Aujourd'hui</button>
        </div>

        <!-- Mode Switcher -->
        <div class="mode-controls">
          <button
              class="nav-btn text-btn mode-btn"
              :class="{ active: isSelectionMode }"
              @click.stop="toggleSelectionMode"
              title="Bloquer des dates (Indisponible)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            {{ isSelectionMode ? 'Mode Blocage' : 'Bloquer Dates' }}
          </button>
        </div>

        <!-- Central Label -->
        <h2 class="month-label" v-if="!isDoubleView">{{ formatMonthTitle(monthsToDisplay[0]) }}</h2>

        <div class="legend" v-if="!roomFilter">
          <div v-for="room in visibleRooms" :key="room.id" class="legend-item">
            <span class="dot" :style="{ background: room.color }"></span>
            <span>{{ room.name }}</span>
          </div>
        </div>
      </div>

      <!-- Calendars Container -->
      <div class="calendars-row" :class="{ 'is-double': isDoubleView }">
        <div
            v-for="monthDate in monthsToDisplay"
            :key="monthDate.toISOString()"
            class="single-calendar"
        >
          <!-- Month Title (Double view) -->
          <h3 class="calendar-month-title" v-if="isDoubleView">
            {{ formatMonthTitle(monthDate) }}
          </h3>

          <!-- Weekday Headers -->
          <div class="weekdays-row">
            <div v-for="dayName in weekDays" :key="dayName" class="weekday-header">
              {{ dayName }}
            </div>
          </div>

          <!-- Calendar Grid -->
          <div class="calendar-grid">
            <div
                v-for="day in getCalendarDays(monthDate)"
                :key="day.iso"
                class="day-cell"
                :class="{
								'is-padding': day.isPadding,
								'is-today': day.isToday,
								'has-booking': day.bookings.length > 0,
								'connect-left': day.connectLeft,
								'connect-right': day.connectRight,
								'is-selected': isDaySelected(day.date),
								'is-range-start': isRangeStart(day.date),
								'is-range-end': isRangeEnd(day.date),
								'in-selection-range': isInSelectionRange(day.date)
							}"
                :style="getDayStyle(day)"
                @click.stop="handleDayClick(day)"
            >
              <div class="day-header">
                <span class="day-number">{{ day.number }}</span>
              </div>

              <!-- Booking Indicators -->
              <div class="day-content" v-if="day.bookings.length > 0">
                <div v-if="roomFilter && day.showLabel" class="single-mode-info">
									<span class="client-pill" :class="normalizeStatus(day.bookings[0][statusField])">
										{{ getClientName(day.bookings[0]) }}
									</span>
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
                      :title="opt.label"
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

    <!-- Block Date Modal -->
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
            <label>Chambre concernée</label>
            <select v-model="blockRoomId" class="modal-select">
              <option v-for="r in visibleRooms" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Statut</label>
            <div class="status-pill-static">Indisponible</div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelSelection">Annuler</button>
          <button class="btn-confirm" @click="confirmBlockDates" :disabled="!blockRoomId || submitting">
            {{ submitting ? '...' : 'Confirmer l\'indisponibilité' }}
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
  isSameDay, parseISO, isWithinInterval, addDays, isBefore
} from 'date-fns';
import { fr } from 'date-fns/locale';

// --- HELPERS (Defined at top to avoid reference errors) ---

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
  } catch (e) {
    return '-';
  }
}

function formatDateShort(d: string) {
  if (!d) return '-';
  try {
    return format(parseISO(d), 'dd/MM/yyyy');
  } catch (e) { return '-'; }
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

function isLight(color: string) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return ((r * 299) + (g * 587) + (b * 114)) / 1000 > 155;
}

// --- PROPS ---

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

// --- STATE ---

const api = useApi();
const loading = ref(false);
const submitting = ref(false);
const error = ref<string | null>(null);
const bookings = ref<any[]>([]);
const roomsData = ref<any[]>([]);
const viewDate = ref(new Date());
const selectedDay = ref<any | null>(null);

const collectionName = computed(() => props.bookingCollection || props.bookingsCollection);
const roomCollectionName = computed(() => props.roomCollection || props.roomsCollection);
const actualRoomField = computed(() => props.roomRefField || props.roomFieldName);

// Selection Mode State
const isSelectionMode = ref(false);
const selectionStart = ref<Date | null>(null);
const selectionEnd = ref<Date | null>(null);
const showBlockModal = ref(false);
const blockRoomId = ref<any>(null);

// Container sizing
const containerRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);
let resizeObserver: ResizeObserver | null = null;
const isDoubleView = computed(() => containerWidth.value > 900);

const monthsToDisplay = computed(() => {
  const months = [viewDate.value];
  if (isDoubleView.value) months.push(addMonths(viewDate.value, 1));
  return months;
});

// --- HELPER WRAPPERS (Accessing Refs) ---

function getRoomNameFromBooking(b: any) {
  const val = b?.[actualRoomField.value];
  if (typeof val === 'object') return val?.[props.roomNameField] || val?.nom || 'Chambre';
  const found = roomsData.value.find(r => r.id == val);
  return found ? found[props.roomNameField] : 'Chambre';
}

function getRoomColor(b: any) {
  const name = getRoomNameFromBooking(b);
  const found = visibleRooms.value.find(r => r.name === name);
  return found ? found.color : '#ccc';
}

function getClientName(b: any) {
  if (normalizeStatus(b[props.statusField]) === 'indisponible') return 'Indisponible';
  if (!b) return '';
  const client = b[props.clientField];
  if (typeof client === 'object' && client !== null) {
    return client.nom || client.name || client.full_name || 'Client';
  }
  return 'Client';
}

function getClientEmail(b: any) { return b?.[props.clientField]?.email || ''; }

// --- UI LOGIC ---

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
    // New logic: Only open if bookings exist
    if (day.bookings.length > 0) {
      selectDay(day);
    } else {
      selectedDay.value = null; // Close drawer if clicking empty day
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

function isRangeStart(date: Date) { return selectionStart.value && isSameDay(date, selectionStart.value); }
function isRangeEnd(date: Date) { return selectionEnd.value && isSameDay(date, selectionEnd.value); }

function openBlockModal() {
  if (props.roomFilter && typeof props.roomFilter === 'string') {
    const r = visibleRooms.value.find(r => r.name.toLowerCase() === props.roomFilter.toLowerCase());
    if (r) blockRoomId.value = r.id;
  } else {
    blockRoomId.value = visibleRooms.value.length > 0 ? visibleRooms.value[0].id : null;
  }
  showBlockModal.value = true;
}

function cancelSelection() {
  selectionStart.value = null;
  selectionEnd.value = null;
  showBlockModal.value = false;
  blockRoomId.value = null;
}

function openInDirectus(id: any) {
  if(!collectionName.value) return;
  window.open(`/admin/content/${collectionName.value}/${id}`, '_blank');
}

function changeMonth(delta: number) {
  viewDate.value = addMonths(viewDate.value, delta);
}

function goToToday() { viewDate.value = new Date(); }
function selectDay(day: any) { selectedDay.value = day; }

// --- COMPUTED ---

const visibleRooms = computed(() => {
  let rooms = roomsData.value.map(r => ({
    id: r.id,
    name: r[props.roomNameField] || `Room ${r.id}`,
    color: r.color || stringToColor(r[props.roomNameField] || 'room')
  }));
  if (props.roomFilter && typeof props.roomFilter === 'string') {
    rooms = rooms.filter(r => r.name.toLowerCase().includes(props.roomFilter.toLowerCase()));
  }
  return rooms;
});

function getCalendarDays(baseDate: Date) {
  const start = startOfWeek(startOfMonth(baseDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(baseDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const dayObjects = days.map(date => {
    const dayBookings = bookings.value.filter(b => {
      const rName = getRoomNameFromBooking(b);
      if (props.roomFilter && typeof props.roomFilter === 'string' && !rName.toLowerCase().includes(props.roomFilter.toLowerCase())) return false;

      const startD = parseISO(b[props.startDateField]);
      const endD = parseISO(b[props.endDateField]);
      let stayEnd = addDays(endD, -1);
      if (isSameDay(startD, endD)) stayEnd = endD;

      return isWithinInterval(date, { start: startD, end: stayEnd });
    });

    return {
      date,
      iso: date.toISOString(),
      number: format(date, 'd'),
      isPadding: !isSameMonth(date, baseDate),
      isToday: isSameDay(date, new Date()),
      bookings: dayBookings,
      connectLeft: false,
      connectRight: false,
      showLabel: true
    };
  });

  // Band Logic
  dayObjects.forEach((day, index) => {
    if (day.bookings.length === 0) return;

    const isMonday = index % 7 === 0;
    const isSunday = index % 7 === 6;
    const firstBookingId = day.bookings[0].id;

    if (!isMonday && index > 0) {
      const prevDay = dayObjects[index - 1];
      if (prevDay.bookings.length > 0 && prevDay.bookings[0].id === firstBookingId) {
        day.connectLeft = true;
        day.showLabel = false;
      }
    }

    if (!isSunday && index < dayObjects.length - 1) {
      const nextDay = dayObjects[index + 1];
      if (nextDay.bookings.length > 0 && nextDay.bookings[0].id === firstBookingId) {
        day.connectRight = true;
      }
    }
  });

  return dayObjects;
}

function getDayStyle(day: any) {
  if (day.bookings.length === 0) return {};

  const isBlocked = day.bookings.some((b: any) => normalizeStatus(b[props.statusField]) === 'indisponible');
  if (isBlocked) {
    return { backgroundColor: '#333333', color: '#fff' };
  }

  const bookedRooms = [...new Set(day.bookings.map((b: any) => getRoomNameFromBooking(b)))];

  if (bookedRooms.length === 1) {
    const room = visibleRooms.value.find(r => r.name === bookedRooms[0]);
    const color = room ? room.color : '#ccc';
    return { backgroundColor: color, color: isLight(color) ? '#000' : '#fff' };
  }

  if (bookedRooms.length >= 2) {
    const r1 = visibleRooms.value.find(r => r.name === bookedRooms[0]);
    const r2 = visibleRooms.value.find(r => r.name === bookedRooms[1]);
    const c1 = r1?.color || '#ccc';
    const c2 = r2?.color || '#888';
    return {
      background: `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)`,
      color: '#fff',
      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
    };
  }
  return {};
}

// --- API ACTIONS ---

async function confirmBlockDates() {
  if (!selectionStart.value || !selectionEnd.value || !blockRoomId.value) return;
  submitting.value = true;
  try {
    const startDateStr = format(selectionStart.value, 'yyyy-MM-dd');
    const endDateStr = format(addDays(selectionEnd.value, 1), 'yyyy-MM-dd');
    const payload = {
      [props.startDateField]: startDateStr,
      [props.endDateField]: endDateStr,
      [actualRoomField.value]: blockRoomId.value,
      [props.statusField]: 'indisponible',
    };
    await api.post(`/items/${collectionName.value}`, payload);
    window.dispatchEvent(new Event('hotel-booking-updated'));
    await fetchData();
    cancelSelection();
    isSelectionMode.value = false;
  } catch (e: any) {
    alert("Erreur: " + (e.message || "Erreur inconnue"));
  } finally {
    submitting.value = false;
  }
}

async function deleteBooking(booking: any) {
  if (!confirm("Voulez-vous vraiment supprimer cette réservation ?")) return;
  try {
    await api.delete(`/items/${collectionName.value}/${booking.id}`);
    if (selectedDay.value) {
      selectedDay.value.bookings = selectedDay.value.bookings.filter((b: any) => b.id !== booking.id);
      if (selectedDay.value.bookings.length === 0) selectedDay.value = null;
    }
    window.dispatchEvent(new Event('hotel-booking-updated'));
    await fetchData();
  } catch (e: any) {
    alert("Erreur suppression: " + e.message);
  }
}

async function updateBookingStatus(booking: any, newStatus: string) {
  if (normalizeStatus(booking[props.statusField]) === newStatus) return;
  const originalStatus = booking[props.statusField];
  booking[props.statusField] = newStatus;
  try {
    await api.patch(`/items/${collectionName.value}/${booking.id}`, { [props.statusField]: newStatus });
    window.dispatchEvent(new Event('hotel-booking-updated'));
  } catch (err: any) {
    booking[props.statusField] = originalStatus;
  }
}

async function fetchData() {
  if (!collectionName.value || !roomCollectionName.value) return;
  loading.value = true;
  try {
    const roomsRes = await api.get(`/items/${roomCollectionName.value}`, { params: { limit: -1 } });
    roomsData.value = roomsRes.data.data;

    const monthsToShow = isDoubleView.value ? 2 : 1;
    const start = format(subMonths(startOfMonth(viewDate.value), 1), 'yyyy-MM-dd');
    const end = format(addMonths(endOfMonth(viewDate.value), monthsToShow), 'yyyy-MM-dd');

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
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

watch(() => [collectionName.value, roomCollectionName.value, viewDate.value, isDoubleView.value], fetchData);

onMounted(() => {
  fetchData();
  window.addEventListener('hotel-booking-updated', fetchData);
  if (containerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width;
      }
    });
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  window.removeEventListener('hotel-booking-updated', fetchData);
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style scoped>
/* Main Container */
.calendar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--theme--background);
  color: var(--theme--foreground);
  font-family: var(--family-sans);
  overflow: hidden;
  position: relative;
  --primary-alpha: rgba(var(--primary-rgb), 0.1);
}

.calendar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  height: 100%;
  overflow: hidden;
}

/* Titles */
.view-title { text-align: center; margin-bottom: 10px; }
.view-title h1 { margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--theme--foreground); text-transform: capitalize; }

/* Header */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--theme--background-accent);
  padding: 4px;
  border-radius: 12px;
  border: 1px solid var(--theme--border-color-subdued);
}

.mode-controls { margin-left: auto; margin-right: 16px; }

.nav-btn {
  background: transparent;
  border: none;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--theme--foreground);
  border-radius: 8px;
  transition: background 0.2s;
}
.nav-btn:hover { background: var(--theme--background-subdued); }

.text-btn { width: auto; padding: 0 16px; font-weight: 600; font-size: 0.9rem; }

.mode-btn { border: 1px solid var(--theme--border-color-subdued); background: var(--theme--background); display: flex; align-items: center; }
.mode-btn.active { background: var(--theme--primary); color: white; border-color: var(--theme--primary); }
.mr-2 { margin-right: 8px; }

.month-label { font-size: 1.1rem; font-weight: 700; text-transform: capitalize; min-width: 180px; text-align: center; margin: 0; }

.legend { display: flex; gap: 16px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 500; }
.dot { width: 10px; height: 10px; border-radius: 3px; }

/* Calendars Layout */
.calendars-row { display: flex; flex: 1; gap: 24px; min-height: 0; }
.single-calendar { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.calendar-month-title { text-align: center; font-size: 1.1rem; font-weight: 700; margin: 0 0 12px 0; text-transform: capitalize; color: var(--theme--primary); }

/* Grid Structure */
.weekdays-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0; margin-bottom: 8px; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: 1fr; gap: 0; flex: 1; min-height: 0; overflow-y: auto; }
.weekday-header { text-align: center; font-weight: 700; color: var(--theme--foreground-subdued); padding-bottom: 8px; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }

/* Day Cells */
.day-cell {
  background: var(--theme--background);
  padding: 4px;
  position: relative;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--theme--border-color-subdued);
  transition: all 0.2s;
  min-height: 60px;
  border-radius: 4px;
  margin: 1px;
  overflow: hidden; /* Fix grid resizing issue */
}

/* Band / Connection Logic */
.day-cell.connect-left {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: none;
  margin-left: -1px;
  z-index: 1;
}
.day-cell.connect-right {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
  margin-right: -1px;
  z-index: 1;
}

.day-cell:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.08); border-color: var(--theme--primary); z-index: 5; }
.day-cell.is-padding { opacity: 0.3; background: transparent; border: 1px dashed var(--theme--border-color-subdued); box-shadow: none; z-index: 0; }
.day-cell.is-today { border: 2px solid var(--primary); z-index: 3; }

/* Selection Mode Styles */
.day-cell.is-selected { background: var(--theme--primary-subdued); border-color: var(--primary); }
.day-cell.in-selection-range { background: rgba(var(--primary-rgb), 0.1); border-color: var(--primary); }
.day-cell.is-range-start { background: var(--primary); color: white; border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
.day-cell.is-range-end { background: var(--primary); color: white; border-top-right-radius: 12px; border-bottom-right-radius: 12px; }

.day-header { display: flex; justify-content: flex-end; margin-bottom: 2px; }
.day-number { font-size: 0.8rem; font-weight: 600; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 50%; opacity: 0.7; }
.is-today .day-number { background: var(--primary); color: white; opacity: 1; }
.day-content { flex: 1; display: flex; justify-content: center; align-items: center; }

.client-pill { background: rgba(255,255,255,0.9); color: #1d2127; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
.client-pill.indisponible { background: #333; color: white; }

/* Modal */
.modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); z-index: 60; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(2px); }
.modal-card { background: var(--theme--background); width: 400px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.modal-card h3 { margin: 0; font-size: 1.25rem; }
.modal-body { display: flex; flex-direction: column; gap: 16px; }
.form-group label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--theme--foreground-subdued); margin-bottom: 6px; text-transform: uppercase; }
.date-display { font-size: 1.1rem; font-weight: 600; padding: 10px; background: var(--theme--background-subdued); border-radius: 8px; }
.modal-select { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--theme--border-color); background: var(--theme--background); color: var(--theme--foreground); font-size: 1rem; }
.status-pill-static { background: #333; color: white; padding: 6px 12px; border-radius: 20px; display: inline-block; font-weight: 700; font-size: 0.85rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px; }
.btn-cancel { background: transparent; border: 1px solid var(--theme--border-color); padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; color: var(--theme--foreground); }
.btn-confirm { background: var(--primary); border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; color: white; }
.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

/* Side Drawer */
.side-drawer { position: absolute; top: 0; right: 0; bottom: 0; width: 420px; background: var(--theme--background); box-shadow: -10px 0 40px rgba(0,0,0,0.1); z-index: 50; display: flex; flex-direction: column; border-left: 1px solid var(--theme--border-color); }
.drawer-header { padding: 24px; background: var(--theme--background); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--theme--border-color-subdued); }
.drawer-header h3 { margin: 0; text-transform: capitalize; font-size: 1.25rem; }
.close-btn { background: none; border: none; font-size: 2rem; cursor: pointer; color: var(--theme--foreground-subdued); line-height: 0.8; transition: color 0.2s; }
.close-btn:hover { color: var(--danger); }
.drawer-content { padding: 24px; overflow-y: auto; flex: 1; background: var(--theme--background-subdued); }
.no-bookings { text-align: center; color: var(--theme--foreground-subdued); margin-top: 60px; font-weight: 500; }
.booking-card { background: var(--theme--background); border: 1px solid var(--theme--border-color-subdued); border-radius: 12px; margin-bottom: 20px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.card-header { padding: 16px; background: var(--theme--background); display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #ccc; border-bottom: 1px solid var(--theme--border-color-subdued); }
.room-name { font-weight: 700; font-size: 1rem; }
.status-badge { font-size: 0.7rem; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
.status-badge.confirmee { background: #E6F4EA; color: #1E8E3E; }
.status-badge.en_attente { background: #FEF7E0; color: #F9AB00; }
.status-badge.annulee { background: #FCE8E6; color: #D93025; }
.status-badge.indisponible { background: #333; color: #fff; }
.status-badge.checked_in { background: #E8F0FE; color: #1967D2; }
.card-body { padding: 20px; }
.client-info { display: flex; gap: 16px; margin-bottom: 20px; align-items: center; }
.client-icon { background: var(--theme--background-accent); color: var(--theme--foreground-subdued); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.client-text .name { font-weight: 700; font-size: 1.1rem; color: var(--theme--foreground); }
.client-text .email { font-size: 0.9rem; color: var(--theme--foreground-subdued); }
.dates-info { background: var(--theme--background-subdued); padding: 16px; border-radius: 8px; margin-bottom: 20px; }
.date-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; }
.date-row:last-child { margin-bottom: 0; }
.status-actions { margin-top: 20px; }
.status-actions .label { display: block; font-size: 0.8rem; color: var(--theme--foreground-subdued); margin-bottom: 8px; font-weight: 600; }
.status-pills { display: flex; gap: 8px; flex-wrap: wrap; }
.status-pill-btn { border: 1px solid var(--theme--border-color); background: transparent; color: var(--theme--foreground-subdued); padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; cursor: pointer; font-weight: 600; transition: all 0.2s; }
.status-pill-btn:hover { background: var(--theme--background-subdued); }
.status-pill-btn.active { border-color: transparent; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.status-pill-btn.active.confirmee { background: var(--success); }
.status-pill-btn.active.en_attente { background: var(--warning); color: #333; }
.status-pill-btn.active.checked_in { background: var(--primary); }
.status-pill-btn.active.annulee { background: var(--danger); }
.status-pill-btn.active.indisponible { background: #333; }
.card-footer { padding: 12px 20px; background: var(--theme--background-subdued); border-top: 1px solid var(--theme--border-color-subdued); text-align: right; display: flex; justify-content: space-between; }
.btn-link { background: none; border: none; color: var(--primary); font-weight: 600; font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; }
.btn-link.delete { color: var(--danger); }
.btn-link:hover { text-decoration: underline; }
.ml-1 { margin-left: 4px; }
.mr-1 { margin-right: 4px; }

/* Loading */
.loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.8); display: flex; justify-content: center; align-items: center; z-index: 100; backdrop-filter: blur(2px); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--theme--border-color); border-top: 3px solid var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.empty-state { display: flex; justify-content: center; align-items: center; height: 100%; text-align: center; }
.msg-box { background: var(--theme--background-accent); padding: 40px; border-radius: 16px; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }

/* Transitions */
.slide-enter-active, .slide-leave-active { transition: transform 0.3s cubic-bezier(0.2, 0, 0.2, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>