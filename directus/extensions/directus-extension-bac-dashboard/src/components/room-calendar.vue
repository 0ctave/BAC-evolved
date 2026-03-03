<template>
  <div class="calendar-container" ref="containerRef" @click="selectedDay = null">
    <div class="calendar-wrapper">
      <div class="view-title" v-if="title">
        <h2>{{ title }}</h2>
      </div>

      <div class="calendar-header">
        <div class="nav-controls">
          <button class="nav-btn icon-btn" @click="changeMonth(-1)" title="Précédent">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button class="nav-btn icon-btn" @click="changeMonth(1)" title="Suivant">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <button class="nav-btn text-btn mobile-hide" @click="goToToday">Aujourd'hui</button>
        </div>

        <div class="mode-controls">
          <button
              class="nav-btn text-btn mode-btn"
              :class="{ active: isSelectionMode }"
              @click.stop="toggleSelectionMode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span class="mobile-hide ml-2">{{ isSelectionMode ? 'Mode Blocage' : 'Bloquer Dates' }}</span>
          </button>
        </div>

        <h3 class="month-label" v-if="!isDoubleView">{{ formatMonthTitle(monthsToDisplay[0]) }}</h3>

        <div class="legend" v-if="!roomFilter">
          <div v-for="room in visibleRooms" :key="room.id" class="legend-item">
            <span class="dot" :style="{ background: room.color }"></span>
            <span class="mobile-hide">{{ room.name }}</span>
          </div>
        </div>
      </div>

      <div class="calendar-scroll-area">
        <div class="calendars-row" :class="{ 'is-double': isDoubleView }">
          <div
              v-for="monthDate in monthsToDisplay"
              :key="monthDate.toISOString()"
              class="single-calendar"
          >
            <h4 class="calendar-month-title" v-if="isDoubleView">
              {{ formatMonthTitle(monthDate) }}
            </h4>

            <div class="weekdays-row">
              <div v-for="dayName in weekDays" :key="dayName" class="weekday-header">
                <span class="desktop-day">{{ dayName.substring(0, 3) }}</span>
                <span class="mobile-day">{{ dayName.substring(0, 1) }}</span>
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
              <div class="status-badge" :class="normalizeStatus(booking[config.statusField])">
                {{ getStatusLabel(booking[config.statusField]) }}
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
                  <span class="value">{{ formatDateShort(booking[config.roomStartDateField]) }}</span>
                </div>
                <div class="date-row">
                  <span class="label">Départ</span>
                  <span class="value">{{ formatDateShort(booking[config.roomEndDateField]) }}</span>
                </div>
              </div>

              <div class="status-actions">
                <span class="label">Modifier le statut :</span>
                <div class="status-pills">
                  <button
                      v-for="opt in statusOptions"
                      :key="opt.value"
                      class="status-pill-btn"
                      :class="[opt.value, { active: normalizeStatus(booking[config.statusField]) === opt.value }]"
                      @click="updateBookingStatus(booking, opt.value)"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <button class="btn-link delete" @click="deleteBooking(booking)">
                Supprimer
              </button>
              <button class="btn-link" @click="openInDirectus(booking.id)">
                Voir la fiche
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
          <div class="form-group" v-if="!roomFilter">
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

    <div v-if="loading" class="loading-overlay"><div class="spinner"></div></div>
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
import { config, getRoomHexColor } from '../config';

const props = defineProps({
  title: { type: String, default: '' },
  roomFilter: { type: String, default: '' }
});

const api = useApi();
const loading = ref(false);
const submitting = ref(false);
const bookings = ref<any[]>([]);
const roomsData = ref<any[]>([]);
const viewDate = ref(new Date());
const selectedDay = ref<any | null>(null);

const isSelectionMode = ref(false);
const selectionStart = ref<Date | null>(null);
const selectionEnd = ref<Date | null>(null);
const showBlockModal = ref(false);
const blockRoomId = ref<any>('all');

const containerRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);
let resizeObserver: ResizeObserver | null = null;
const isDoubleView = computed(() => containerWidth.value > 900 && !props.roomFilter);

const statusOptions = [
  { value: 'en_attente', label: 'En Attente' },
  { value: 'confirmee', label: 'Confirmée' },
  { value: 'annulee', label: 'Annulée' },
  { value: 'indisponible', label: 'Indisponible' },
];
const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// --- Helpers ---
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
function formatFullDate(d: Date) { return d ? format(d, 'EEEE d MMMM yyyy', { locale: fr }) : ''; }
function formatMonthTitle(d: Date) { return d ? format(d, 'MMMM yyyy', { locale: fr }) : ''; }

const monthsToDisplay = computed(() => {
  const months = [viewDate.value];
  if (isDoubleView.value) months.push(addMonths(viewDate.value, 1));
  return months;
});

const visibleRooms = computed(() => {
  let rooms = roomsData.value.map(r => ({
    id: r.id,
    name: r[config.roomNameField] || `Room ${r.id}`,
    color: getRoomHexColor(r[config.roomColorField])
  }));
  if (props.roomFilter) {
    rooms = rooms.filter(r => r.name.toLowerCase() === props.roomFilter.toLowerCase());
  }
  return rooms.sort((a, b) => String(a.id).localeCompare(String(b.id)));
});

function getRoomNameFromBooking(b: any) {
  const val = b?.[config.roomRelationField];
  if (typeof val === 'object') return val?.[config.roomNameField] || 'Chambre';
  const found = roomsData.value.find(r => r.id == val);
  return found ? found[config.roomNameField] : 'Chambre';
}
function getRoomIdFromBooking(b: any) {
  const val = b?.[config.roomRelationField];
  return typeof val === 'object' ? val?.id : val;
}
function getRoomColor(b: any) {
  const name = getRoomNameFromBooking(b);
  const found = visibleRooms.value.find(r => r.name === name);
  return found ? found.color : '#ccc';
}
function getClientName(b: any) {
  if (normalizeStatus(b[config.statusField]) === 'indisponible') return 'Indisponible';
  const client = b[config.clientField];
  if (typeof client === 'object' && client !== null) return client.nom ? `${client.prenom || ''} ${client.nom}` : 'Client';
  return 'Client';
}
function getClientEmail(b: any) { return b?.[config.clientField]?.email || ''; }

function toggleSelectionMode() {
  isSelectionMode.value = !isSelectionMode.value;
  cancelSelection();
}
function handleDayClick(day: any) {
  if (isSelectionMode.value) {
    if (!selectionStart.value) { selectionStart.value = day.date; }
    else if (!selectionEnd.value) {
      if (isBefore(day.date, selectionStart.value)) {
        selectionEnd.value = selectionStart.value;
        selectionStart.value = day.date;
      } else { selectionEnd.value = day.date; }
      openBlockModal();
    } else {
      selectionStart.value = day.date;
      selectionEnd.value = null;
    }
  } else {
    selectedDay.value = day.bookings.length > 0 ? day : null;
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
  if (props.roomFilter) {
    const r = visibleRooms.value[0];
    blockRoomId.value = r ? r.id : 'all';
  } else { blockRoomId.value = 'all'; }
  showBlockModal.value = true;
}
function cancelSelection() {
  selectionStart.value = null;
  selectionEnd.value = null;
  showBlockModal.value = false;
  blockRoomId.value = 'all';
}
function openInDirectus(id: any) { window.open(`/admin/content/${config.roomBookingsCollection}/${id}`, '_blank'); }
function changeMonth(delta: number) { viewDate.value = addMonths(viewDate.value, delta); }
function goToToday() { viewDate.value = new Date(); }

function getCalendarDays(baseDate: Date) {
  const start = startOfWeek(startOfMonth(baseDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(baseDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return days.map(date => {
    const dayBookings = bookings.value.filter(b => {
      const bStart = parseISO(b[config.roomStartDateField]);
      const bEnd = parseISO(b[config.roomEndDateField]);
      return isWithinInterval(date, { start: bStart, end: bEnd });
    });

    const lanes = visibleRooms.value.map(room => {
      const roomBookings = dayBookings.filter(b => getRoomIdFromBooking(b) == room.id);
      const segments: any[] = [];

      roomBookings.forEach(booking => {
        const bStart = parseISO(booking[config.roomStartDateField]);
        const bEnd = parseISO(booking[config.roomEndDateField]);
        const isArrival = isSameDay(date, bStart);
        const isDeparture = isSameDay(date, bEnd);
        const isStayOver = isAfter(date, bStart) && isBefore(date, bEnd);

        if (isStayOver) {
          segments.push({ id: booking.id, type: 'full', color: room.color, status: normalizeStatus(booking[config.statusField]), label: getClientName(booking), showLabel: date.getDay() === 1 || isSameDay(date, addDays(bStart, 1)), connectLeft: true, connectRight: true });
        } else if (isArrival) {
          segments.push({ id: booking.id, type: 'check-in', color: room.color, status: normalizeStatus(booking[config.statusField]), label: getClientName(booking), showLabel: true, connectLeft: false, connectRight: !isDeparture });
        } else if (isDeparture) {
          segments.push({ id: booking.id, type: 'check-out', color: room.color, status: normalizeStatus(booking[config.statusField]), label: getClientName(booking), showLabel: false, connectLeft: true, connectRight: false });
        }
      });
      segments.sort((a, b) => (a.type === 'check-out' ? -1 : 1));
      return { roomId: room.id, segments };
    });

    return { date, iso: date.toISOString(), number: format(date, 'd'), isPadding: !isSameMonth(date, baseDate), isToday: isSameDay(date, new Date()), bookings: dayBookings, lanes };
  });
}

async function fetchData() {
  loading.value = true;
  try {
    const roomsRes = await api.get(`/items/${config.roomsCollection}`, { params: { limit: -1 } });
    roomsData.value = roomsRes.data.data;

    const start = format(subMonths(startOfMonth(viewDate.value), 1), 'yyyy-MM-dd');
    const end = format(addMonths(endOfMonth(viewDate.value), 2), 'yyyy-MM-dd');

    const bookingsRes = await api.get(`/items/${config.roomBookingsCollection}`, {
      params: {
        limit: -1,
        fields: ['*', `${config.roomRelationField}.*`, `${config.clientField}.*`],
        filter: { _and: [{ [config.roomEndDateField]: { _gte: start } }, { [config.roomStartDateField]: { _lte: end } }] }
      }
    });
    bookings.value = bookingsRes.data.data;
  } catch (err: any) { console.error(err); } finally { loading.value = false; }
}

async function confirmBlockDates() {
  if (!selectionStart.value || !selectionEnd.value || !blockRoomId.value) return;
  submitting.value = true;
  try {
    const startDateStr = format(selectionStart.value, 'yyyy-MM-dd');
    const endDateStr = format(selectionEnd.value, 'yyyy-MM-dd');
    const roomIdsToBlock = blockRoomId.value === 'all' ? visibleRooms.value.map(r => r.id) : [blockRoomId.value];
    const payloads = roomIdsToBlock.map(id => ({
      [config.roomStartDateField]: startDateStr, [config.roomEndDateField]: endDateStr,
      [config.roomRelationField]: id, [config.statusField]: 'indisponible',
    }));
    await api.post(`/items/${config.roomBookingsCollection}`, payloads.length === 1 ? payloads[0] : payloads);
    await fetchData();
    cancelSelection();
    isSelectionMode.value = false;
    window.dispatchEvent(new Event('hotel-booking-updated'));
  } catch (e: any) { console.error(e); } finally { submitting.value = false; }
}

async function updateBookingStatus(booking: any, newStatus: string) {
  const old = booking[config.statusField];
  booking[config.statusField] = newStatus;
  try {
    await api.patch(`/items/${config.roomBookingsCollection}/${booking.id}`, { [config.statusField]: newStatus });
    await fetchData();
    window.dispatchEvent(new Event('hotel-booking-updated'));
  } catch { booking[config.statusField] = old; }
}

async function deleteBooking(booking: any) {
  if (!confirm("Voulez-vous vraiment supprimer cette réservation ?")) return;
  try {
    await api.delete(`/items/${config.roomBookingsCollection}/${booking.id}`);
    selectedDay.value = null;
    await fetchData();
    window.dispatchEvent(new Event('hotel-booking-updated'));
  } catch (e) { console.error(e); }
}

function handleGlobalUpdate() { fetchData(); }

watch(() => [viewDate.value, isDoubleView.value], fetchData);

onMounted(() => {
  fetchData();
  window.addEventListener('hotel-booking-updated', handleGlobalUpdate);
  if (containerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) { containerWidth.value = entry.contentRect.width; }
    });
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  window.removeEventListener('hotel-booking-updated', handleGlobalUpdate);
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style scoped>
/* === RESETS ET CONTENEUR PRINCIPAL === */
.calendar-container, .calendar-container * {
  box-sizing: border-box;
}

.calendar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.calendar-wrapper {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-width: 0;
}

/* === EN-TÊTE DU CALENDRIER === */
.view-title h2 { margin: 0 0 20px 0; font-size: 1.2rem; font-weight: 800; color: var(--theme--foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; width: 100%; }

.nav-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.nav-btn { background: var(--theme--background-accent); border: 1px solid var(--theme--border-color-subdued); height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 8px; color: var(--theme--foreground); transition: all 0.2s; flex-shrink: 0; }
.nav-btn:hover { background: var(--theme--background-subdued); }
.icon-btn { width: 36px; padding: 0; }
.text-btn { padding: 0 16px; font-weight: 700; font-size: 0.85rem; }

.mode-btn.active { background: var(--theme--primary); color: white; border-color: var(--theme--primary); }

.month-label { font-size: 1rem; font-weight: 800; margin: 0; text-transform: capitalize; white-space: nowrap; }

.legend { display: flex; gap: 12px; flex-wrap: wrap; width: 100%; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 700; white-space: nowrap; }
.dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

/* === ZONE DE GRILLE === */
.calendar-scroll-area {
  flex: 1;
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid var(--theme--border-color-subdued);
  background: var(--theme--background);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.calendars-row {
  display: flex;
  gap: 16px;
  height: 100%;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}
@media (min-width: 900px) {
  .calendars-row { flex-direction: row; gap: 24px; }
}

.single-calendar {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
}

.calendar-month-title { padding: 12px; margin: 0; text-transform: capitalize; font-weight: 800; text-align: center; border-bottom: 1px solid var(--theme--border-color-subdued); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* En-tête des jours */
.weekdays-row { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); background: var(--theme--background-subdued); width: 100%; }
.weekday-header { text-align: center; padding: 10px 0; font-weight: 800; color: var(--theme--foreground-subdued); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--theme--border-color-subdued); border-right: 1px solid var(--theme--border-color-subdued); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.desktop-day { display: inline; }
.mobile-day { display: none; }

/* Grille principale */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-auto-rows: minmax(70px, 1fr);
  flex: 1;
  width: 100%;
  min-width: 0;
}

.day-cell { border-right: 1px solid var(--theme--border-color-subdued); border-bottom: 1px solid var(--theme--border-color-subdued); padding: 4px; display: flex; flex-direction: column; position: relative; cursor: pointer; background: var(--theme--background); transition: background 0.15s; overflow: hidden; min-width: 0; }
.day-cell:hover { background: var(--theme--background-subdued); }
.day-cell.is-padding { opacity: 0.4; background: var(--theme--background-accent); }

.day-header { display: flex; justify-content: flex-end; margin-bottom: 4px; z-index: 10; }
.day-number { font-size: 0.8rem; font-weight: 700; opacity: 0.5; line-height: 1; }
.is-today .day-number { color: var(--theme--primary); opacity: 1; font-weight: 900; background: var(--theme--primary-subdued); padding: 4px 6px; border-radius: 12px; }

.day-content { flex: 1; display: flex; flex-direction: column; gap: 4px; justify-content: center; min-width: 0; width: 100%; }

/* Barres de réservation */
.room-lane { height: 26px; display: flex; position: relative; width: 100%; min-width: 0; }
.day-cell.has-filter .room-lane { height: 36px; }

.booking-segment {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 6px;
  position: relative;
  z-index: 5;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
  background-image: linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(0,0,0,0.08));
  overflow: hidden;
  min-width: 0;
}

.booking-segment.connect-left { margin-left: -1px; border-top-left-radius: 0 !important; border-bottom-left-radius: 0 !important; }
.booking-segment.connect-right { margin-right: -1px; border-top-right-radius: 0 !important; border-bottom-right-radius: 0 !important; z-index: 6; }
.booking-segment.full { width: calc(100% - 4px); margin: 0 2px; border-radius: 4px; }
.booking-segment.full.connect-left { width: calc(100% - 2px + 1px); }
.booking-segment.full.connect-right { width: calc(100% - 2px + 1px); }
.booking-segment.full.connect-left.connect-right { width: calc(100% + 2px); }
.booking-segment.check-out { width: calc(50% - 2px); margin-left: 2px; border-radius: 4px 0 0 4px; }
.booking-segment.check-out.connect-left { width: calc(50% + 1px); margin-left: -1px; }
.booking-segment.check-in { width: calc(50% - 2px); margin-right: 2px; border-radius: 0 4px 4px 0; margin-left: auto; }
.booking-segment.check-in.connect-right { width: calc(50% + 1px); margin-right: -1px; }
.booking-segment.is-blocked { background: #1a1a1a !important; }

.segment-label {
  font-size: 0.65rem;
  font-weight: 800;
  color: white;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  max-width: 100%;
}
.day-cell.has-filter .segment-label { font-size: 0.75rem; }

.day-cell.is-selected { background: var(--theme--primary-subdued); box-shadow: inset 0 0 0 2px var(--theme--primary); }
.day-cell.in-selection-range { background: rgba(var(--primary-rgb), 0.1); }

/* === DRAWER ET MODAL === */
.side-drawer { position: absolute; top: 0; right: 0; bottom: 0; width: 440px; max-width: 100%; background: var(--theme--background); z-index: 100; border-left: 1px solid var(--theme--border-color); display: flex; flex-direction: column; box-shadow: -15px 0 45px rgba(0,0,0,0.15); }
.drawer-header { padding: 24px; border-bottom: 1px solid var(--theme--border-color-subdued); display: flex; justify-content: space-between; align-items: center; }
.close-btn { background: none; border: none; font-size: 2rem; cursor: pointer; color: var(--theme--foreground-subdued); }
.drawer-content { flex: 1; overflow-y: auto; padding: 24px; background: var(--theme--background-subdued); }

.booking-card { background: var(--theme--background); border-radius: 12px; margin-bottom: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.card-header { padding: 16px; border-left: 6px solid #ccc; display: flex; justify-content: space-between; align-items: center; }
.room-name { font-weight: 800; }
.status-badge { font-size: 0.7rem; padding: 4px 10px; border-radius: 20px; font-weight: 800; text-transform: uppercase; }
.status-badge.confirmee { background: #e6f4ea; color: #1e8e3e; }
.status-badge.indisponible { background: #1a1a1a; color: white; }

.card-body { padding: 16px; }
.client-info { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.client-icon { width: 36px; height: 36px; background: var(--theme--background-accent); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--theme--primary); flex-shrink: 0; }
.client-text { min-width: 0; }
.client-text .name { font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.client-text .email { font-size: 0.85rem; color: var(--theme--foreground-subdued); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.dates-info { background: var(--theme--background-subdued); padding: 12px; border-radius: 8px; font-size: 0.85rem; }
.date-row { display: flex; justify-content: space-between; margin-bottom: 4px; gap: 8px; }
.status-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.status-pill-btn { border: 1px solid var(--theme--border-color); background: none; font-size: 0.8rem; padding: 4px 12px; border-radius: 16px; cursor: pointer; font-weight: 700; flex: 1; min-width: 100px; text-align: center; }
.status-pill-btn.active { background: var(--theme--primary); color: white; border-color: var(--theme--primary); }
.card-footer { padding: 12px 16px; border-top: 1px solid var(--theme--border-color-subdued); display: flex; justify-content: space-between; background: var(--theme--background-subdued); gap: 8px; }
.btn-link { background: none; border: none; color: var(--theme--primary); font-size: 0.85rem; font-weight: 800; cursor: pointer; white-space: nowrap; }
.btn-link.delete { color: var(--theme--danger); }

.modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 16px; }
.modal-card { background: var(--theme--background); padding: 24px; border-radius: 16px; width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.modal-select { width: 100%; padding: 12px; border-radius: 8px; margin-top: 12px; border: 1px solid var(--theme--border-color); background: var(--theme--background); color: var(--theme--foreground); }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; flex-wrap: wrap; }
.btn-confirm { background: var(--theme--primary); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 800; width: 100%; }
.btn-cancel { width: 100%; padding: 10px; background: none; border: 1px solid var(--theme--border-color); border-radius: 8px; cursor: pointer; font-weight: 700; }
@media (min-width: 400px) {
  .btn-confirm { width: auto; }
  .btn-cancel { width: auto; }
}

.loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.7); z-index: 300; display: flex; align-items: center; justify-content: center; }
.spinner { width: 40px; height: 40px; border: 4px solid #eee; border-top-color: var(--theme--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* === MOBILE RESPONSIVENESS ULTRA STRICTE === */
@media (max-width: 768px) {
  .mobile-hide { display: none !important; }

  /* Compression de l'espace global */
  .calendar-wrapper { padding: 12px 6px; }

  /* En-tête calendrier compact */
  .calendar-header { margin-bottom: 12px; gap: 8px; }
  .nav-controls { gap: 4px; }
  .nav-btn { height: 32px; border-radius: 6px; }
  .icon-btn { width: 32px; }
  .view-title h2 { font-size: 1.1rem; margin-bottom: 12px; }

  /* Labels des jours courts */
  .desktop-day { display: none; }
  .mobile-day { display: inline; font-size: 0.75rem; font-weight: 900; }
  .weekday-header { font-size: 0.7rem; padding: 6px 0; }

  /* Grille compressée */
  .calendar-grid { grid-auto-rows: minmax(45px, 1fr); }
  .day-cell { padding: 2px; }

  /* En-tête des cellules */
  .day-header { justify-content: center; padding: 0; margin-bottom: 2px; }
  .day-number { font-size: 0.75rem; }
  .is-today .day-number { padding: 2px 4px; }

  /* Barres d'indicateurs extra fines */
  .room-lane { height: 6px; margin-bottom: 2px; }
  .day-cell.has-filter .room-lane { height: 8px; }

  /* Suppression de l'arrondi et du padding sur les barres */
  .booking-segment { border-radius: 2px !important; padding: 0 !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; }
  .booking-segment.check-out { width: 50% !important; margin-left: 0 !important; }
  .booking-segment.check-in { width: 50% !important; margin-right: 0 !important; margin-left: auto !important; }

  /* Cacher le texte dans les barres */
  .segment-label { display: none !important; }

  /* Drawer pleine largeur */
  .side-drawer { width: 100%; border-left: none; }
  .drawer-header { padding: 16px; }
  .drawer-content { padding: 16px; }
}

.slide-enter-active, .slide-leave-active { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style><template>
  <div class="calendar-container" ref="containerRef" @click="selectedDay = null">
    <div class="calendar-wrapper">
      <div class="view-title" v-if="title">
        <h2>{{ title }}</h2>
      </div>

      <div class="calendar-header">
        <div class="nav-controls">
          <button class="nav-btn icon-btn" @click="changeMonth(-1)" title="Précédent">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button class="nav-btn icon-btn" @click="changeMonth(1)" title="Suivant">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <button class="nav-btn text-btn mobile-hide" @click="goToToday">Aujourd'hui</button>
        </div>

        <div class="mode-controls">
          <button
              class="nav-btn text-btn mode-btn"
              :class="{ active: isSelectionMode }"
              @click.stop="toggleSelectionMode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span class="mobile-hide ml-2">{{ isSelectionMode ? 'Mode Blocage' : 'Bloquer Dates' }}</span>
          </button>
        </div>

        <h3 class="month-label" v-if="!isDoubleView">{{ formatMonthTitle(monthsToDisplay[0]) }}</h3>

        <div class="legend" v-if="!roomFilter">
          <div v-for="room in visibleRooms" :key="room.id" class="legend-item">
            <span class="dot" :style="{ background: room.color }"></span>
            <span class="mobile-hide">{{ room.name }}</span>
          </div>
        </div>
      </div>

      <div class="calendar-scroll-area">
        <div class="calendars-row" :class="{ 'is-double': isDoubleView }">
          <div
              v-for="monthDate in monthsToDisplay"
              :key="monthDate.toISOString()"
              class="single-calendar"
          >
            <h4 class="calendar-month-title" v-if="isDoubleView">
              {{ formatMonthTitle(monthDate) }}
            </h4>

            <div class="weekdays-row">
              <div v-for="dayName in weekDays" :key="dayName" class="weekday-header">
                <span class="desktop-day">{{ dayName.substring(0, 3) }}</span>
                <span class="mobile-day">{{ dayName.substring(0, 1) }}</span>
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
              <div class="status-badge" :class="normalizeStatus(booking[config.statusField])">
                {{ getStatusLabel(booking[config.statusField]) }}
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
                  <span class="value">{{ formatDateShort(booking[config.roomStartDateField]) }}</span>
                </div>
                <div class="date-row">
                  <span class="label">Départ</span>
                  <span class="value">{{ formatDateShort(booking[config.roomEndDateField]) }}</span>
                </div>
              </div>

              <div class="status-actions">
                <span class="label">Modifier le statut :</span>
                <div class="status-pills">
                  <button
                      v-for="opt in statusOptions"
                      :key="opt.value"
                      class="status-pill-btn"
                      :class="[opt.value, { active: normalizeStatus(booking[config.statusField]) === opt.value }]"
                      @click="updateBookingStatus(booking, opt.value)"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <button class="btn-link delete" @click="deleteBooking(booking)">
                Supprimer
              </button>
              <button class="btn-link" @click="openInDirectus(booking.id)">
                Voir la fiche
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
          <div class="form-group" v-if="!roomFilter">
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

    <div v-if="loading" class="loading-overlay"><div class="spinner"></div></div>
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
import { config, getRoomHexColor } from '../config';

const props = defineProps({
  title: { type: String, default: '' },
  roomFilter: { type: String, default: '' }
});

const api = useApi();
const loading = ref(false);
const submitting = ref(false);
const bookings = ref<any[]>([]);
const roomsData = ref<any[]>([]);
const viewDate = ref(new Date());
const selectedDay = ref<any | null>(null);

const isSelectionMode = ref(false);
const selectionStart = ref<Date | null>(null);
const selectionEnd = ref<Date | null>(null);
const showBlockModal = ref(false);
const blockRoomId = ref<any>('all');

const containerRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);
let resizeObserver: ResizeObserver | null = null;
const isDoubleView = computed(() => containerWidth.value > 900 && !props.roomFilter);

const statusOptions = [
  { value: 'en_attente', label: 'En Attente' },
  { value: 'confirmee', label: 'Confirmée' },
  { value: 'annulee', label: 'Annulée' },
  { value: 'indisponible', label: 'Indisponible' },
];
const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// --- Helpers ---
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
function formatFullDate(d: Date) { return d ? format(d, 'EEEE d MMMM yyyy', { locale: fr }) : ''; }
function formatMonthTitle(d: Date) { return d ? format(d, 'MMMM yyyy', { locale: fr }) : ''; }

const monthsToDisplay = computed(() => {
  const months = [viewDate.value];
  if (isDoubleView.value) months.push(addMonths(viewDate.value, 1));
  return months;
});

const visibleRooms = computed(() => {
  let rooms = roomsData.value.map(r => ({
    id: r.id,
    name: r[config.roomNameField] || `Room ${r.id}`,
    color: getRoomHexColor(r[config.roomColorField])
  }));
  if (props.roomFilter) {
    rooms = rooms.filter(r => r.name.toLowerCase() === props.roomFilter.toLowerCase());
  }
  return rooms.sort((a, b) => String(a.id).localeCompare(String(b.id)));
});

function getRoomNameFromBooking(b: any) {
  const val = b?.[config.roomRelationField];
  if (typeof val === 'object') return val?.[config.roomNameField] || 'Chambre';
  const found = roomsData.value.find(r => r.id == val);
  return found ? found[config.roomNameField] : 'Chambre';
}
function getRoomIdFromBooking(b: any) {
  const val = b?.[config.roomRelationField];
  return typeof val === 'object' ? val?.id : val;
}
function getRoomColor(b: any) {
  const name = getRoomNameFromBooking(b);
  const found = visibleRooms.value.find(r => r.name === name);
  return found ? found.color : '#ccc';
}
function getClientName(b: any) {
  if (normalizeStatus(b[config.statusField]) === 'indisponible') return 'Indisponible';
  const client = b[config.clientField];
  if (typeof client === 'object' && client !== null) return client.nom ? `${client.prenom || ''} ${client.nom}` : 'Client';
  return 'Client';
}
function getClientEmail(b: any) { return b?.[config.clientField]?.email || ''; }

function toggleSelectionMode() {
  isSelectionMode.value = !isSelectionMode.value;
  cancelSelection();
}
function handleDayClick(day: any) {
  if (isSelectionMode.value) {
    if (!selectionStart.value) { selectionStart.value = day.date; }
    else if (!selectionEnd.value) {
      if (isBefore(day.date, selectionStart.value)) {
        selectionEnd.value = selectionStart.value;
        selectionStart.value = day.date;
      } else { selectionEnd.value = day.date; }
      openBlockModal();
    } else {
      selectionStart.value = day.date;
      selectionEnd.value = null;
    }
  } else {
    selectedDay.value = day.bookings.length > 0 ? day : null;
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
  if (props.roomFilter) {
    const r = visibleRooms.value[0];
    blockRoomId.value = r ? r.id : 'all';
  } else { blockRoomId.value = 'all'; }
  showBlockModal.value = true;
}
function cancelSelection() {
  selectionStart.value = null;
  selectionEnd.value = null;
  showBlockModal.value = false;
  blockRoomId.value = 'all';
}
function openInDirectus(id: any) { window.open(`/admin/content/${config.roomBookingsCollection}/${id}`, '_blank'); }
function changeMonth(delta: number) { viewDate.value = addMonths(viewDate.value, delta); }
function goToToday() { viewDate.value = new Date(); }

function getCalendarDays(baseDate: Date) {
  const start = startOfWeek(startOfMonth(baseDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(baseDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return days.map(date => {
    const dayBookings = bookings.value.filter(b => {
      const bStart = parseISO(b[config.roomStartDateField]);
      const bEnd = parseISO(b[config.roomEndDateField]);
      return isWithinInterval(date, { start: bStart, end: bEnd });
    });

    const lanes = visibleRooms.value.map(room => {
      const roomBookings = dayBookings.filter(b => getRoomIdFromBooking(b) == room.id);
      const segments: any[] = [];

      roomBookings.forEach(booking => {
        const bStart = parseISO(booking[config.roomStartDateField]);
        const bEnd = parseISO(booking[config.roomEndDateField]);
        const isArrival = isSameDay(date, bStart);
        const isDeparture = isSameDay(date, bEnd);
        const isStayOver = isAfter(date, bStart) && isBefore(date, bEnd);

        if (isStayOver) {
          segments.push({ id: booking.id, type: 'full', color: room.color, status: normalizeStatus(booking[config.statusField]), label: getClientName(booking), showLabel: date.getDay() === 1 || isSameDay(date, addDays(bStart, 1)), connectLeft: true, connectRight: true });
        } else if (isArrival) {
          segments.push({ id: booking.id, type: 'check-in', color: room.color, status: normalizeStatus(booking[config.statusField]), label: getClientName(booking), showLabel: true, connectLeft: false, connectRight: !isDeparture });
        } else if (isDeparture) {
          segments.push({ id: booking.id, type: 'check-out', color: room.color, status: normalizeStatus(booking[config.statusField]), label: getClientName(booking), showLabel: false, connectLeft: true, connectRight: false });
        }
      });
      segments.sort((a, b) => (a.type === 'check-out' ? -1 : 1));
      return { roomId: room.id, segments };
    });

    return { date, iso: date.toISOString(), number: format(date, 'd'), isPadding: !isSameMonth(date, baseDate), isToday: isSameDay(date, new Date()), bookings: dayBookings, lanes };
  });
}

async function fetchData() {
  loading.value = true;
  try {
    const roomsRes = await api.get(`/items/${config.roomsCollection}`, { params: { limit: -1 } });
    roomsData.value = roomsRes.data.data;

    const start = format(subMonths(startOfMonth(viewDate.value), 1), 'yyyy-MM-dd');
    const end = format(addMonths(endOfMonth(viewDate.value), 2), 'yyyy-MM-dd');

    const bookingsRes = await api.get(`/items/${config.roomBookingsCollection}`, {
      params: {
        limit: -1,
        fields: ['*', `${config.roomRelationField}.*`, `${config.clientField}.*`],
        filter: { _and: [{ [config.roomEndDateField]: { _gte: start } }, { [config.roomStartDateField]: { _lte: end } }] }
      }
    });
    bookings.value = bookingsRes.data.data;
  } catch (err: any) { console.error(err); } finally { loading.value = false; }
}

async function confirmBlockDates() {
  if (!selectionStart.value || !selectionEnd.value || !blockRoomId.value) return;
  submitting.value = true;
  try {
    const startDateStr = format(selectionStart.value, 'yyyy-MM-dd');
    const endDateStr = format(selectionEnd.value, 'yyyy-MM-dd');
    const roomIdsToBlock = blockRoomId.value === 'all' ? visibleRooms.value.map(r => r.id) : [blockRoomId.value];
    const payloads = roomIdsToBlock.map(id => ({
      [config.roomStartDateField]: startDateStr, [config.roomEndDateField]: endDateStr,
      [config.roomRelationField]: id, [config.statusField]: 'indisponible',
    }));
    await api.post(`/items/${config.roomBookingsCollection}`, payloads.length === 1 ? payloads[0] : payloads);
    await fetchData();
    cancelSelection();
    isSelectionMode.value = false;
    window.dispatchEvent(new Event('hotel-booking-updated'));
  } catch (e: any) { console.error(e); } finally { submitting.value = false; }
}

async function updateBookingStatus(booking: any, newStatus: string) {
  const old = booking[config.statusField];
  booking[config.statusField] = newStatus;
  try {
    await api.patch(`/items/${config.roomBookingsCollection}/${booking.id}`, { [config.statusField]: newStatus });
    await fetchData();
    window.dispatchEvent(new Event('hotel-booking-updated'));
  } catch { booking[config.statusField] = old; }
}

async function deleteBooking(booking: any) {
  if (!confirm("Voulez-vous vraiment supprimer cette réservation ?")) return;
  try {
    await api.delete(`/items/${config.roomBookingsCollection}/${booking.id}`);
    selectedDay.value = null;
    await fetchData();
    window.dispatchEvent(new Event('hotel-booking-updated'));
  } catch (e) { console.error(e); }
}

function handleGlobalUpdate() { fetchData(); }

watch(() => [viewDate.value, isDoubleView.value], fetchData);

onMounted(() => {
  fetchData();
  window.addEventListener('hotel-booking-updated', handleGlobalUpdate);
  if (containerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) { containerWidth.value = entry.contentRect.width; }
    });
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  window.removeEventListener('hotel-booking-updated', handleGlobalUpdate);
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style scoped>
/* === RESETS ET CONTENEUR PRINCIPAL === */
.calendar-container, .calendar-container * {
  box-sizing: border-box;
}

.calendar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.calendar-wrapper {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-width: 0;
}

/* === EN-TÊTE DU CALENDRIER === */
.view-title h2 { margin: 0 0 20px 0; font-size: 1.2rem; font-weight: 800; color: var(--theme--foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; width: 100%; }

.nav-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.nav-btn { background: var(--theme--background-accent); border: 1px solid var(--theme--border-color-subdued); height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 8px; color: var(--theme--foreground); transition: all 0.2s; flex-shrink: 0; }
.nav-btn:hover { background: var(--theme--background-subdued); }
.icon-btn { width: 36px; padding: 0; }
.text-btn { padding: 0 16px; font-weight: 700; font-size: 0.85rem; }

.mode-btn.active { background: var(--theme--primary); color: white; border-color: var(--theme--primary); }

.month-label { font-size: 1rem; font-weight: 800; margin: 0; text-transform: capitalize; white-space: nowrap; }

.legend { display: flex; gap: 12px; flex-wrap: wrap; width: 100%; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 700; white-space: nowrap; }
.dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

/* === ZONE DE GRILLE === */
.calendar-scroll-area {
  flex: 1;
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid var(--theme--border-color-subdued);
  background: var(--theme--background);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.calendars-row {
  display: flex;
  gap: 16px;
  height: 100%;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}
@media (min-width: 900px) {
  .calendars-row { flex-direction: row; gap: 24px; }
}

.single-calendar {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
}

.calendar-month-title { padding: 12px; margin: 0; text-transform: capitalize; font-weight: 800; text-align: center; border-bottom: 1px solid var(--theme--border-color-subdued); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* En-tête des jours */
.weekdays-row { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); background: var(--theme--background-subdued); width: 100%; }
.weekday-header { text-align: center; padding: 10px 0; font-weight: 800; color: var(--theme--foreground-subdued); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--theme--border-color-subdued); border-right: 1px solid var(--theme--border-color-subdued); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.desktop-day { display: inline; }
.mobile-day { display: none; }

/* Grille principale */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-auto-rows: minmax(70px, 1fr);
  flex: 1;
  width: 100%;
  min-width: 0;
}

.day-cell { border-right: 1px solid var(--theme--border-color-subdued); border-bottom: 1px solid var(--theme--border-color-subdued); padding: 4px; display: flex; flex-direction: column; position: relative; cursor: pointer; background: var(--theme--background); transition: background 0.15s; overflow: hidden; min-width: 0; }
.day-cell:hover { background: var(--theme--background-subdued); }
.day-cell.is-padding { opacity: 0.4; background: var(--theme--background-accent); }

.day-header { display: flex; justify-content: flex-end; margin-bottom: 4px; z-index: 10; }
.day-number { font-size: 0.8rem; font-weight: 700; opacity: 0.5; line-height: 1; }
.is-today .day-number { color: var(--theme--primary); opacity: 1; font-weight: 900; background: var(--theme--primary-subdued); padding: 4px 6px; border-radius: 12px; }

.day-content { flex: 1; display: flex; flex-direction: column; gap: 4px; justify-content: center; min-width: 0; width: 100%; }

/* Barres de réservation */
.room-lane { height: 26px; display: flex; position: relative; width: 100%; min-width: 0; }
.day-cell.has-filter .room-lane { height: 36px; }

.booking-segment {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 6px;
  position: relative;
  z-index: 5;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
  background-image: linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(0,0,0,0.08));
  overflow: hidden;
  min-width: 0;
}

.booking-segment.connect-left { margin-left: -1px; border-top-left-radius: 0 !important; border-bottom-left-radius: 0 !important; }
.booking-segment.connect-right { margin-right: -1px; border-top-right-radius: 0 !important; border-bottom-right-radius: 0 !important; z-index: 6; }
.booking-segment.full { width: calc(100% - 4px); margin: 0 2px; border-radius: 4px; }
.booking-segment.full.connect-left { width: calc(100% - 2px + 1px); }
.booking-segment.full.connect-right { width: calc(100% - 2px + 1px); }
.booking-segment.full.connect-left.connect-right { width: calc(100% + 2px); }
.booking-segment.check-out { width: calc(50% - 2px); margin-left: 2px; border-radius: 4px 0 0 4px; }
.booking-segment.check-out.connect-left { width: calc(50% + 1px); margin-left: -1px; }
.booking-segment.check-in { width: calc(50% - 2px); margin-right: 2px; border-radius: 0 4px 4px 0; margin-left: auto; }
.booking-segment.check-in.connect-right { width: calc(50% + 1px); margin-right: -1px; }
.booking-segment.is-blocked { background: #1a1a1a !important; }

.segment-label {
  font-size: 0.65rem;
  font-weight: 800;
  color: white;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  max-width: 100%;
}
.day-cell.has-filter .segment-label { font-size: 0.75rem; }

.day-cell.is-selected { background: var(--theme--primary-subdued); box-shadow: inset 0 0 0 2px var(--theme--primary); }
.day-cell.in-selection-range { background: rgba(var(--primary-rgb), 0.1); }

/* === DRAWER ET MODAL === */
.side-drawer { position: absolute; top: 0; right: 0; bottom: 0; width: 440px; max-width: 100%; background: var(--theme--background); z-index: 100; border-left: 1px solid var(--theme--border-color); display: flex; flex-direction: column; box-shadow: -15px 0 45px rgba(0,0,0,0.15); }
.drawer-header { padding: 24px; border-bottom: 1px solid var(--theme--border-color-subdued); display: flex; justify-content: space-between; align-items: center; }
.close-btn { background: none; border: none; font-size: 2rem; cursor: pointer; color: var(--theme--foreground-subdued); }
.drawer-content { flex: 1; overflow-y: auto; padding: 24px; background: var(--theme--background-subdued); }

.booking-card { background: var(--theme--background); border-radius: 12px; margin-bottom: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.card-header { padding: 16px; border-left: 6px solid #ccc; display: flex; justify-content: space-between; align-items: center; }
.room-name { font-weight: 800; }
.status-badge { font-size: 0.7rem; padding: 4px 10px; border-radius: 20px; font-weight: 800; text-transform: uppercase; }
.status-badge.confirmee { background: #e6f4ea; color: #1e8e3e; }
.status-badge.indisponible { background: #1a1a1a; color: white; }

.card-body { padding: 16px; }
.client-info { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.client-icon { width: 36px; height: 36px; background: var(--theme--background-accent); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--theme--primary); flex-shrink: 0; }
.client-text { min-width: 0; }
.client-text .name { font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.client-text .email { font-size: 0.85rem; color: var(--theme--foreground-subdued); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.dates-info { background: var(--theme--background-subdued); padding: 12px; border-radius: 8px; font-size: 0.85rem; }
.date-row { display: flex; justify-content: space-between; margin-bottom: 4px; gap: 8px; }
.status-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.status-pill-btn { border: 1px solid var(--theme--border-color); background: none; font-size: 0.8rem; padding: 4px 12px; border-radius: 16px; cursor: pointer; font-weight: 700; flex: 1; min-width: 100px; text-align: center; }
.status-pill-btn.active { background: var(--theme--primary); color: white; border-color: var(--theme--primary); }
.card-footer { padding: 12px 16px; border-top: 1px solid var(--theme--border-color-subdued); display: flex; justify-content: space-between; background: var(--theme--background-subdued); gap: 8px; }
.btn-link { background: none; border: none; color: var(--theme--primary); font-size: 0.85rem; font-weight: 800; cursor: pointer; white-space: nowrap; }
.btn-link.delete { color: var(--theme--danger); }

.modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 16px; }
.modal-card { background: var(--theme--background); padding: 24px; border-radius: 16px; width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.modal-select { width: 100%; padding: 12px; border-radius: 8px; margin-top: 12px; border: 1px solid var(--theme--border-color); background: var(--theme--background); color: var(--theme--foreground); }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; flex-wrap: wrap; }
.btn-confirm { background: var(--theme--primary); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 800; width: 100%; }
.btn-cancel { width: 100%; padding: 10px; background: none; border: 1px solid var(--theme--border-color); border-radius: 8px; cursor: pointer; font-weight: 700; }
@media (min-width: 400px) {
  .btn-confirm { width: auto; }
  .btn-cancel { width: auto; }
}

.loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.7); z-index: 300; display: flex; align-items: center; justify-content: center; }
.spinner { width: 40px; height: 40px; border: 4px solid #eee; border-top-color: var(--theme--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* === MOBILE RESPONSIVENESS ULTRA STRICTE === */
@media (max-width: 768px) {
  .mobile-hide { display: none !important; }

  /* Compression de l'espace global */
  .calendar-wrapper { padding: 12px 6px; }

  /* En-tête calendrier compact */
  .calendar-header { margin-bottom: 12px; gap: 8px; }
  .nav-controls { gap: 4px; }
  .nav-btn { height: 32px; border-radius: 6px; }
  .icon-btn { width: 32px; }
  .view-title h2 { font-size: 1.1rem; margin-bottom: 12px; }

  /* Labels des jours courts */
  .desktop-day { display: none; }
  .mobile-day { display: inline; font-size: 0.75rem; font-weight: 900; }
  .weekday-header { font-size: 0.7rem; padding: 6px 0; }

  /* Grille compressée */
  .calendar-grid { grid-auto-rows: minmax(45px, 1fr); }
  .day-cell { padding: 2px; }

  /* En-tête des cellules */
  .day-header { justify-content: center; padding: 0; margin-bottom: 2px; }
  .day-number { font-size: 0.75rem; }
  .is-today .day-number { padding: 2px 4px; }

  /* Barres d'indicateurs extra fines */
  .room-lane { height: 6px; margin-bottom: 2px; }
  .day-cell.has-filter .room-lane { height: 8px; }

  /* Suppression de l'arrondi et du padding sur les barres */
  .booking-segment { border-radius: 2px !important; padding: 0 !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; }
  .booking-segment.check-out { width: 50% !important; margin-left: 0 !important; }
  .booking-segment.check-in { width: 50% !important; margin-right: 0 !important; margin-left: auto !important; }

  /* Cacher le texte dans les barres */
  .segment-label { display: none !important; }

  /* Drawer pleine largeur */
  .side-drawer { width: 100%; border-left: none; }
  .drawer-header { padding: 16px; }
  .drawer-content { padding: 16px; }
}

.slide-enter-active, .slide-leave-active { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>