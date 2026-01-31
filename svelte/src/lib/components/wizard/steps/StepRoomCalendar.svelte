<script lang="ts">
    import {booking} from '$lib/logic/booking.svelte';
    import {fetchPricingRules, fetchRoomReservations, fetchRooms} from '$lib/directus/booking-fetchers';
    import {getDirectusAssetURL} from '$lib/directus/directus-utils';
    import {
        CalendarDate,
        type DateValue,
        getDayOfWeek,
        getLocalTimeZone,
        isSameDay,
        parseDate,
        today
    } from "@internationalized/date";
    import {onMount, untrack} from 'svelte';
    import {calculateStayPrice, type PricingResult} from '$lib/logic/pricing';
    import {SvelteSet} from "svelte/reactivity";
    import { slide, fade } from 'svelte/transition';
    import type {DateRange} from "bits-ui";

    import CalendarView from "./calendar/CalendarView.svelte";
    import TravelersSelector from "./calendar/TravelersSelector.svelte";
    import RoomList from "./calendar/RoomList.svelte";
    import PriceEstimator from "./calendar/PriceEstimator.svelte";
    import OptionSelector from "./calendar/OptionSelector.svelte";

    let rooms = $state<any[]>([]);
    let pricingRules = $state<any[]>([]);
    let loading = $state(true);
    let error = $state("");

    // Translations from global store
    const l = $derived(booking.labels);

    let selectedRoomId = $state<string | number>('any');
    let bookedDatesCache = $state<Record<string | number, Set<string>>>({});
    let checkInDates = $state<Record<string | number, Set<string>>>({});
    let occupancy = $state<Record<string, number>>({});

    // --- VOYAGEURS STATE ---
    let adults = $state(1);
    let children = $state(0);
    let showValidation = $state(false);
    let totalRooms = $derived(rooms.length);
    const minDate = today(getLocalTimeZone()).add({days: 3});
    const toDateValue = (d: any): DateValue | undefined => d ? (d as DateValue) : undefined;
    let value = $state<DateRange>({
        start: toDateValue(booking.roomSelection.date_arrivee),
        end: toDateValue(booking.roomSelection.date_depart)
    });
    let placeholder = $state<DateValue>(
        untrack(() => {
            if (value.start) return value.start;
            const now = today(getLocalTimeZone());
            const startOfNextMonth = now.set({day: 1}).add({months: 1});
            const endOfMonth = startOfNextMonth.subtract({days: 1});
            const daysRemaining = endOfMonth.day - now.day;
            if (daysRemaining < 14) return startOfNextMonth;
            return now;
        })
    );
    $effect(() => { if (booking.validationTrigger > 0) showValidation = true; });
    $effect(() => { if (booking.resetTrigger > 0) showValidation = false; });
    let activeRoom = $derived(selectedRoomId !== 'any' ? rooms.find(r => r.id === selectedRoomId) : null);
    let maxAdults = $derived.by(() => {
        if (activeRoom) return activeRoom.capacite_adultes ?? 2;
        return rooms.length > 0 ? Math.max(...rooms.map(r => r.capacite_adultes ?? 2)) : 2;
    });
    let maxChildren = $derived.by(() => {
        if (activeRoom) return activeRoom.capacite_enfants ?? 0;
        return rooms.length > 0 ? Math.max(...rooms.map(r => r.capacite_enfants ?? 0)) : 0;
    });
    let totalCapacity = $derived.by(() => {
        if (activeRoom) return (activeRoom.capacite_adultes ?? 2) + (activeRoom.capacite_enfants ?? 0);
        if (rooms.length > 0) return Math.max(...rooms.map(r => (r.capacite_adultes ?? 2) + (r.capacite_enfants ?? 0)));
        return 2;
    });
    $effect(() => {
        if (adults > maxAdults) adults = maxAdults;
        if (children > maxChildren) children = maxChildren;
        if (adults + children > totalCapacity) {
            if (adults > totalCapacity) { adults = totalCapacity; children = 0; } else { children = totalCapacity - adults; }
        }
    });
    const roomPrices = $derived.by(() => {
        const prices: Record<string | number, number> = {};
        const now = today(getLocalTimeZone());
        let simStart: CalendarDate;
        let simEnd: CalendarDate;
        let isSimulatedBestPrice = false;
        if (value.start && value.end) {
            simStart = value.start as CalendarDate;
            simEnd = value.end as CalendarDate;
        } else if (value.start && hoveredDate) {
            const s = value.start as CalendarDate;
            const h = hoveredDate as CalendarDate;
            if (h.compare(s) >= 0) { simStart = s; simEnd = h; if (simEnd.compare(simStart) === 0) simEnd = simStart.add({days: 1}); } else { simStart = h; simEnd = s; }
        } else {
            isSimulatedBestPrice = true;
            simStart = now.add({days: 3});
            simEnd = simStart.add({days: 1});
        }
        rooms.forEach(room => {
            if (isSimulatedBestPrice) {
                const durationsToTest = [1, 2, 3, 7];
                let bestNightlyRate = Infinity;
                durationsToTest.forEach(nights => {
                    const testEnd = simStart.add({days: nights});
                    const result = calculateStayPrice(Number(room.prix_nuit), simStart, testEnd, pricingRules, { adults: adults, children: children, parking: false, roomId: room.id });
                    const nightly = result.total / nights;
                    if (nightly < bestNightlyRate) bestNightlyRate = nightly;
                });
                prices[room.id] = Math.round(bestNightlyRate);
            } else {
                const result = calculateStayPrice(Number(room.prix_nuit), simStart, simEnd, pricingRules, { adults: adults, children: children, parking: false, roomId: room.id });
                const d1 = simStart.toDate(getLocalTimeZone());
                const d2 = simEnd.toDate(getLocalTimeZone());
                const diffTime = Math.abs(d2.getTime() - d1.getTime());
                const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                prices[room.id] = Math.round(result.total / nights);
            }
        });
        return prices;
    });
    const parkingDetails = $derived.by(() => {
        let days = 0;
        if (value.start && value.end) {
            const d1 = value.start.toDate(getLocalTimeZone());
            const d2 = value.end.toDate(getLocalTimeZone());
            const diffTime = Math.abs(d2.getTime() - d1.getTime());
            days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        const durationForCalc = Math.max(1, days);
        let activeRules = pricingRules.filter(r => {
            const types = Array.isArray(r.type) ? r.type : [r.type];
            if (!types.includes('parking')) return false;
            if (r.duree_min && durationForCalc < r.duree_min) return false;
            if (r.duree_max && durationForCalc > r.duree_max) return false;
            return true;
        });
        activeRules = activeRules.filter(parent => {
            const isOverridden = activeRules.some(child => {
                const pId = (typeof child.parent === 'object' && child.parent) ? (child.parent as any).id : child.parent;
                return pId == parent.id;
            });
            return !isOverridden;
        });
        const dailyRate = activeRules.reduce((sum, r) => sum + Number(r.valeur), 0);
        return { dailyRate, total: days > 0 ? dailyRate * days : dailyRate, nights: days };
    });
    let priceEstimate = $derived.by<PricingResult | null>(() => {
        if (!value.start || !value.end || selectedRoomId === 'any' || !booking.roomSelection.chambre) return null;
        const room = rooms.find(r => r.id === booking.roomSelection.chambre);
        if (!room) return null;
        return calculateStayPrice(room.prix_nuit, value.start as CalendarDate, value.end as CalendarDate, pricingRules, { adults: adults, children: children, parking: booking.roomSelection.parking, roomId: booking.roomSelection.chambre });
    });
    let isRoomSelected = $derived(!!booking.roomSelection.chambre && booking.roomSelection.chambre !== 'any');
    let isDateInvalid = $derived(showValidation && !!booking.errors.room.dates);
    let isRoomInvalid = $derived(showValidation && !booking.errors.room.dates && !!booking.errors.room.chambre);
    let validationBarriers = $derived.by(() => {
        if (!value.start || value.end) return {min: null, max: null};
        const start = value.start;
        let max: DateValue | null = null;
        let min: DateValue | null = null;
        const getRoomBarriers = (roomId: string | number) => {
            const cache = bookedDatesCache[roomId];
            if (!cache) return {rMin: null, rMax: null};
            let rMax: DateValue | null = null;
            let rMin: DateValue | null = null;
            let curr = start.add({days: 1});
            for (let i = 0; i < 90; i++) { if (cache.has(curr.toString())) { rMax = curr; break; } curr = curr.add({days: 1}); }
            curr = start.subtract({days: 1});
            for (let i = 0; i < 90; i++) { if (cache.has(curr.toString())) { rMin = curr.add({days: 1}); break; } curr = curr.subtract({days: 1}); }
            return {rMax, rMin};
        };
        if (selectedRoomId !== 'any') {
            const {rMax, rMin} = getRoomBarriers(selectedRoomId);
            max = rMax;
            min = rMin;
        } else {
            const validRooms = rooms.filter(r => !bookedDatesCache[r.id]?.has(start.toString()) || checkInDates[r.id]?.has(start.toString()));
            if (validRooms.length > 0) {
                const barriers = validRooms.map(r => getRoomBarriers(r.id));
                if (barriers.some(b => b.rMax === null)) { max = null; } else { max = barriers.reduce((acc, curr) => (!acc || (curr.rMax && curr.rMax.compare(acc) > 0)) ? curr.rMax : acc, null as DateValue | null); }
                if (barriers.some(b => b.rMin === null)) { min = null; } else { min = barriers.reduce((acc, curr) => (!acc || (curr.rMin && curr.rMin.compare(acc) < 0)) ? curr.rMin : acc, null as DateValue | null); }
            } else { max = start; min = start; }
        }
        return {min, max};
    });
    function isFull(date: DateValue) {
        const key = date.toString();
        if (selectedRoomId === 'any') { const count = occupancy[key] || 0; return totalRooms > 0 && count >= totalRooms; }
        return bookedDatesCache[selectedRoomId]?.has(key) || false;
    }
    function isRoomAvailableRange(roomId: string | number, start: DateValue, end: DateValue) {
        const cache = bookedDatesCache[roomId];
        if (!cache) return true;
        let current = start;
        while (current.compare(end) < 0) { if (cache.has(current.toString())) return false; current = current.add({days: 1}); }
        return true;
    }
    function isDateUnavailable(date: DateValue) {
        if (date.compare(minDate) < 0) return true;
        if (!value.start) { return isFull(date); }
        const barriers = validationBarriers;
        if (date.compare(value.start) > 0) { if (barriers.max && date.compare(barriers.max) > 0) return true; return false; }
        if (date.compare(value.start) < 0) { if (barriers.min && date.compare(barriers.min) < 0) return true; return false; }
        return false;
    }
    function resetDates() { value = {start: undefined, end: undefined}; }
    function resolveRoomImage(room: any) { if (room.image) return getDirectusAssetURL(room.image); return null; }
    function handleDateClick(date: DateValue, currentMonth: DateValue) { if (date.month !== currentMonth.month) { placeholder = date; } }
    $effect(() => {
        const start = value.start;
        const end = value.end;
        if (start && end) {
            let valid = false;
            let forcedRoomId: string | number | null = null;
            if (selectedRoomId === 'any') {
                const validRooms = rooms.filter(r => isRoomAvailableRange(r.id, start, end));
                if (validRooms.length > 0) { valid = true; if (validRooms.length === 1 && rooms.length > 1) { forcedRoomId = validRooms[0].id; } }
            } else { if (isRoomAvailableRange(selectedRoomId, start, end)) { valid = true; } }
            if (!valid) { untrack(() => resetDates()); } else if (forcedRoomId) { untrack(() => handleRoomSelect(forcedRoomId)); }
        }
        booking.roomSelection.date_arrivee = value.start ? (value.start as unknown as CalendarDate) : null;
        booking.roomSelection.date_depart = value.end ? (value.end as unknown as CalendarDate) : null;
    });
    async function loadReservations(roomId: string | number) {
        const roomIds = roomId === 'any' ? rooms.map(r => r.id) : [roomId];
        const results = await Promise.all(roomIds.map(id => fetchRoomReservations(id, fetch)));
        const newNights: Record<string | number, Set<string>> = {...untrack(() => bookedDatesCache)};
        const newCheckIns: Record<string | number, Set<string>> = {...untrack(() => checkInDates)};
        const newOccupancy: Record<string, number> = {};
        results.forEach((res, index) => {
            const currentId = roomIds[index];
            const checkInSet = new SvelteSet<string>();
            res.forEach((r: any) => {
                let curr = parseDate(r.date_arrivee.split('T')[0]);
                const end = parseDate(r.date_depart.split('T')[0]);
                checkInSet.add(curr.toString());
                while (curr.compare(end) < 0) {
                    const k = curr.toString();
                    if (!newNights[currentId]) newNights[currentId] = new SvelteSet();
                    newNights[currentId].add(k);
                    newOccupancy[k] = (newOccupancy[k] || 0) + 1;
                    curr = curr.add({days: 1});
                }
            });
            newCheckIns[currentId] = checkInSet;
        });
        bookedDatesCache = newNights;
        checkInDates = newCheckIns;
        occupancy = newOccupancy;
    }
    onMount(async () => {
        try {
            const [roomsData, rulesData] = await Promise.all([ fetchRooms(fetch), fetchPricingRules(fetch) ]);
            rooms = roomsData;
            pricingRules = rulesData.map((rule: any) => {
                let val = Number(rule.valeur);
                const types = Array.isArray(rule.type) ? rule.type : [rule.type];
                const isFixed = types.includes('fix_nuit') || types.includes('fixe_sejour');
                if (isFixed && val > 500) { val = val / 100; }
                return {...rule, valeur: val};
            });
            selectedRoomId = booking.roomSelection.chambre || 'any';
            await loadReservations(selectedRoomId);
        } catch (e) { error = "Erreur de chargement."; console.error(e); } finally { loading = false; }
    });
    async function handleRoomSelect(roomId: any) {
        if (selectedRoomId === roomId) return;
        if (roomId === 'any') { resetDates(); }
        selectedRoomId = roomId;
        booking.roomSelection.chambre = roomId === 'any' ? null : roomId;
        await loadReservations(roomId);
        if (value.start && value.end) { if (roomId !== 'any' && !isRoomAvailableRange(roomId, value.start, value.end)) { resetDates(); } }
    }
    let hoveredDate = $state<DateValue | null>(null);
    const cellClasses = $derived.by(() => {
        const classes: Record<string, string> = {};
        const {start, end} = value;
        const barriers = validationBarriers;
        const maxBarrier = barriers.max;
        const minBarrier = barriers.min;
        if (!placeholder) return {};
        let firstDayOfMonth = new CalendarDate(placeholder.year, placeholder.month, 1);
        let dayOfWeek = getDayOfWeek(firstDayOfMonth, 'fr-FR');
        let offset = (dayOfWeek) % 7;
        let currentDate = firstDayOfMonth.subtract({days: offset});
        const bookedStripes = 'linear-gradient(45deg, rgba(220, 38, 38, 0.15) 25%, transparent 25%, transparent 50%, rgba(220, 38, 38, 0.15) 50%, rgba(245, 86, 119, 0.15) 75%, transparent 75%, transparent)';
        for (let i = 0; i < 42; i++) {
            const dateStr = currentDate.toString();
            const isRestricted = currentDate.compare(minDate) < 0;
            const full = isFull(currentDate);
            const isStart = start && isSameDay(currentDate, start);
            const isEnd = end && isSameDay(currentDate, end);
            const isSelected = start && end && currentDate.compare(start) >= 0 && currentDate.compare(end) <= 0;
            let isBlockedByBarrier = false;
            if (start && !end) {
                if (maxBarrier && currentDate.compare(maxBarrier) > 0) isBlockedByBarrier = true;
                if (minBarrier && currentDate.compare(minBarrier) < 0) isBlockedByBarrier = true;
            }
            let isHoverRange = false;
            if (start && !end && hoveredDate) {
                const compareStart = currentDate.compare(start);
                const compareHover = currentDate.compare(hoveredDate);
                if ((compareStart > 0 && compareHover <= 0) || (compareStart < 0 && compareHover >= 0)) { isHoverRange = true; }
            }
            let isCheckoutCandidate = false;
            if (start && !end && barriers.max && isSameDay(currentDate, barriers.max)) { isCheckoutCandidate = true; }
            if (start && end && isSameDay(currentDate, end)) { isCheckoutCandidate = true; }
            const visualFull = full && !isCheckoutCandidate;
            let assignedClass = '';
            if (isRestricted) { assignedClass = 'cal-day-restricted'; }
            else if (isStart || isEnd) { assignedClass = 'cal-day-selected-endpoint'; }
            else if (isBlockedByBarrier) { assignedClass = 'cal-day-blocked'; }
            else if ((isSelected || isHoverRange)) {
                if (visualFull) { assignedClass = 'cal-day-invalid-selection'; } else { assignedClass = 'cal-day-selected-range'; }
            }
            else {
                if (visualFull) { assignedClass = 'cal-day-booked'; } else if (selectedRoomId === 'any' && rooms.length >= 2) {
                    const bookedCount = rooms.reduce((acc, room) => {
                        const isBooked = bookedDatesCache[room.id]?.has(dateStr);
                        const isCheckIn = checkInDates[room.id]?.has(dateStr);
                        if (start && !end && currentDate.compare(start) > 0) { if (isBooked && isCheckIn) return acc; }
                        return acc + (isBooked ? 1 : 0);
                    }, 0);
                    if (bookedCount > 0 && bookedCount < rooms.length) { assignedClass = 'cal-day-partial'; }
                }
            }
            if (currentDate.month !== placeholder.month && !(isStart || isEnd)) { assignedClass += ' cal-day-dimmed'; }
            classes[dateStr] = assignedClass;
            currentDate = currentDate.add({days: 1});
        }
        return classes;
    });
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
    <!-- LEFT COLUMN: Calendar & Filters -->
    <div class="space-y-8">

        <!-- DATE VALIDATION ERROR -->
        {#if isDateInvalid}
            <div transition:slide={{ duration: 300 }} class="p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-md flex items-center gap-3 shadow-sm">
                <svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-sm font-medium text-red-800 dark:text-red-200">
                    {booking.errors.room.dates}
                </p>
            </div>
        {/if}

        <CalendarView
                bind:value={value}
                bind:placeholder={placeholder}
                bind:hoveredDate={hoveredDate}
                minValue={minDate}
                isDateUnavailable={isDateUnavailable}
                cellClasses={cellClasses}
                onReset={resetDates}
                selectedRoomId={selectedRoomId}
                onDateClick={handleDateClick}
                isInvalid={isDateInvalid}
        />

        <TravelersSelector
                bind:adults={adults}
                bind:children={children}
                maxAdults={maxAdults}
                maxChildren={maxChildren}
                totalCapacity={totalCapacity}
        />

        <OptionSelector
                bind:parking={booking.roomSelection.parking}
                parkingDetails={parkingDetails}
        />
    </div>

    <!-- RIGHT COLUMN: Rooms & Price -->
    <div class="flex flex-col h-full space-y-6">
        <div>
            <span class="text-xs font-bold text-primary tracking-widest uppercase">{l.step_calendar_step_label}</span>
            <h3 class="text-xl font-bold text-iron dark:text-limestone-50">{l.step_calendar_title}</h3>
        </div>

        <!-- ROOM VALIDATION ERROR (Only if dates valid but no room) -->
        {#if isRoomInvalid}
            <div transition:slide={{ duration: 300 }} class="p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-md flex items-center gap-3 shadow-sm">
                <svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <p class="text-sm font-medium text-red-800 dark:text-red-200">
                    {booking.errors.room.chambre}
                </p>
            </div>
        {/if}

        <RoomList
                rooms={rooms}
                loading={loading}
                selectedRoomId={selectedRoomId}
                value={value}
                hoveredDate={hoveredDate}
                onSelect={handleRoomSelect}
                isRoomAvailableRange={isRoomAvailableRange}
                getRoomImage={resolveRoomImage}
                roomPrices={roomPrices}
                adults={adults}
                children={children}
                isInvalid={isRoomInvalid}
        />

        <PriceEstimator
                priceEstimate={priceEstimate}
                adults={adults}
                children={children}
                isRoomSelected={isRoomSelected}
                hasDates={!!(value.start && value.end)}
        />
    </div>
</div>