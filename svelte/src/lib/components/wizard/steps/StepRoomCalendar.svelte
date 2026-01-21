<script lang="ts">
    import {booking} from '$lib/logic/booking.svelte';
    import {fetchRooms, fetchRoomReservations, fetchPricingRules} from '$lib/directus/booking-fetchers';
    import {getDirectusAssetURL} from '$lib/directus/directus-utils';
    import {
        today,
        getLocalTimeZone,
        CalendarDate,
        type DateValue,
        parseDate,
        isSameDay, getDayOfWeek
    } from "@internationalized/date";
    import {onMount, untrack} from 'svelte';
    import {calculateStayPrice, type PricingResult} from '$lib/logic/pricing';
    import {SvelteSet} from "svelte/reactivity";
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

    let selectedRoomId = $state<string | number>('any');
    let bookedDatesCache = $state<Record<string | number, Set<string>>>({});
    let checkInDates = $state<Record<string | number, Set<string>>>({});
    let occupancy = $state<Record<string, number>>({});

    // --- VOYAGEURS STATE ---
    let adults = $state(2);
    let children = $state(0);

    let totalRooms = $derived(rooms.length);

    const toDateValue = (d: any): DateValue | undefined => d ? (d as DateValue) : undefined;

    let value = $state<DateRange>({
        start: toDateValue(booking.roomSelection.date_arrivee),
        end: toDateValue(booking.roomSelection.date_depart)
    });

    let placeholder = $state<DateValue>(
        value.start ?? today(getLocalTimeZone())
    );

    // --- CAPACITÉ & CONTRAINTES ---
    let activeRoom = $derived(
        selectedRoomId !== 'any' ? rooms.find(r => r.id === selectedRoomId) : null
    );

    let maxAdults = $derived.by(() => {
        if (activeRoom) return activeRoom.capacite_adultes ?? 2;
        return rooms.length > 0 ? Math.max(...rooms.map(r => r.capacite_adultes ?? 2)) : 2;
    });

    let maxChildren = $derived.by(() => {
        if (activeRoom) return activeRoom.capacite_enfants ?? 0;
        return rooms.length > 0 ? Math.max(...rooms.map(r => r.capacite_enfants ?? 0)) : 0;
    });

    $effect(() => {
        if (adults > maxAdults) adults = maxAdults;
        if (children > maxChildren) children = maxChildren;
    });

    // --- ESTIMATION DE PRIX ---
    let priceEstimate = $derived.by<PricingResult | null>(() => {
        if (!value.start || !value.end || selectedRoomId === 'any' || !booking.roomSelection.chambre) {
            return null;
        }

        const room = rooms.find(r => r.id === booking.roomSelection.chambre);
        if (!room) return null;

        return calculateStayPrice(
            room.prix_nuit,
            value.start as CalendarDate,
            value.end as CalendarDate,
            pricingRules,
            {
                adults: adults,
                children: children,
                parking: booking.roomSelection.parking,
                roomId: booking.roomSelection.chambre
            }
        );
    });

    // --- LOGIQUE DE BARRIÈRE (Bidirectionnelle) ---
    let validationBarriers = $derived.by(() => {
        if (!value.start || value.end) return { min: null, max: null };

        const start = value.start;
        let max: DateValue | null = null;
        let min: DateValue | null = null;

        const getRoomBarriers = (roomId: string | number) => {
            const cache = bookedDatesCache[roomId];
            if (!cache) return { rMin: null, rMax: null };

            let rMax: DateValue | null = null;
            let rMin: DateValue | null = null;

            // Barrière Avant (Futur)
            let curr = start.add({days: 1});
            for(let i=0; i<90; i++) {
                if (cache.has(curr.toString())) {
                    rMax = curr;
                    break;
                }
                curr = curr.add({days: 1});
            }

            // Barrière Arrière (Passé)
            curr = start.subtract({days: 1});
            for(let i=0; i<90; i++) {
                if (cache.has(curr.toString())) {
                    rMin = curr.add({days: 1});
                    break;
                }
                curr = curr.subtract({days: 1});
            }
            return { rMax, rMin };
        };

        if (selectedRoomId !== 'any') {
            const { rMax, rMin } = getRoomBarriers(selectedRoomId);
            max = rMax;
            min = rMin;
        } else {
            const validRooms = rooms.filter(r =>
                !bookedDatesCache[r.id]?.has(start.toString()) ||
                checkInDates[r.id]?.has(start.toString())
            );

            if (validRooms.length > 0) {
                const barriers = validRooms.map(r => getRoomBarriers(r.id));

                if (barriers.some(b => b.rMax === null)) {
                    max = null;
                } else {
                    // @ts-ignore
                    max = barriers.reduce((acc, curr) => (!acc || (curr.rMax && curr.rMax.compare(acc) > 0)) ? curr.rMax : acc, null as DateValue | null);
                }

                if (barriers.some(b => b.rMin === null)) {
                    min = null;
                } else {
                    // @ts-ignore
                    min = barriers.reduce((acc, curr) => (!acc || (curr.rMin && curr.rMin.compare(acc) < 0)) ? curr.rMin : acc, null as DateValue | null);
                }
            } else {
                max = start;
                min = start;
            }
        }

        return { min, max };
    });


    // --- UTILITAIRES ---

    function isFull(date: DateValue) {
        const key = date.toString();
        if (selectedRoomId === 'any') {
            const count = occupancy[key] || 0;
            return totalRooms > 0 && count >= totalRooms;
        }
        return bookedDatesCache[selectedRoomId]?.has(key) || false;
    }

    function isRoomAvailableRange(roomId: string | number, start: DateValue, end: DateValue) {
        const cache = bookedDatesCache[roomId];
        if (!cache) return true;
        let current = start;
        while (current.compare(end) < 0) {
            if (cache.has(current.toString())) return false;
            current = current.add({days: 1});
        }
        return true;
    }

    // --- LOGIQUE DE VALIDATION ---
    function isDateUnavailable(date: DateValue) {
        const now = today(getLocalTimeZone());
        if (date.compare(now) < 0) return true;

        if (!value.start) {
            return isFull(date);
        }

        const barriers = validationBarriers;

        // Selection End Date (Forward)
        if (date.compare(value.start) > 0) {
            if (barriers.max && date.compare(barriers.max) > 0) return true;
            return false;
        }

        // Selection Start Date (Backward - Reverse)
        if (date.compare(value.start) < 0) {
            if (barriers.min && date.compare(barriers.min) < 0) return true;
            if (isFull(date)) return true;
            return false;
        }

        return false;
    }

    function resetDates() {
        value = {start: undefined, end: undefined};
    }

    function resolveRoomImage(room: any) {
        if (room.image) return getDirectusAssetURL(room.image);
        return null;
    }

    // --- INTERACTION ---
    function handleDateClick(date: DateValue, currentMonth: DateValue) {
        // La gestion des clics (Désélection, Inversion) est déléguée à CalendarView
        // Ici on gère juste le changement de mois visuel si nécessaire
        if (date.month !== currentMonth.month) {
            placeholder = date;
        }
    }

    // --- SYNCHRONISATION ---
    $effect(() => {
        const start = value.start;
        const end = value.end;

        if (start && end) {
            let valid = false;
            let forcedRoomId: string | number | null = null;

            if (selectedRoomId === 'any') {
                const validRooms = rooms.filter(r => isRoomAvailableRange(r.id, start, end));
                if (validRooms.length > 0) {
                    valid = true;
                    if (validRooms.length === 1 && rooms.length > 1) {
                        forcedRoomId = validRooms[0].id;
                    }
                }
            } else {
                if (isRoomAvailableRange(selectedRoomId, start, end)) {
                    valid = true;
                }
            }

            if (!valid) {
                untrack(() => resetDates());
            } else if (forcedRoomId) {
                untrack(() => handleRoomSelect(forcedRoomId));
            }
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
            const nightsSet = new SvelteSet<string>();
            const checkInSet = new SvelteSet<string>();

            res.forEach((r: any) => {
                let curr = parseDate(r.date_arrivee.split('T')[0]);
                const end = parseDate(r.date_depart.split('T')[0]);

                checkInSet.add(curr.toString());

                while (curr.compare(end) < 0) {
                    const k = curr.toString();
                    nightsSet.add(k);
                    newOccupancy[k] = (newOccupancy[k] || 0) + 1;
                    curr = curr.add({days: 1});
                }
            });
            newNights[currentId] = nightsSet;
            newCheckIns[currentId] = checkInSet;
        });

        bookedDatesCache = newNights;
        checkInDates = newCheckIns;
        occupancy = newOccupancy;
    }

    onMount(async () => {
        try {
            const [roomsData, rulesData] = await Promise.all([
                fetchRooms(fetch),
                fetchPricingRules(fetch)
            ]);

            rooms = roomsData;
            pricingRules = rulesData.map((rule: any) => {
                let val = Number(rule.valeur);
                const types = Array.isArray(rule.type) ? rule.type : [rule.type];
                const isFixed = types.includes('fix_nuit') || types.includes('fixe_sejour');
                if (isFixed && val > 500) {
                    val = val / 100;
                }
                return {...rule, valeur: val};
            });

            selectedRoomId = booking.roomSelection.chambre || 'any';
            await loadReservations(selectedRoomId);
        } catch (e) {
            error = "Erreur de chargement.";
            console.error(e);
        } finally {
            loading = false;
        }
    });

    async function handleRoomSelect(roomId: any) {
        if (selectedRoomId === roomId) return;
        if (roomId === 'any') {
            resetDates();
        }
        selectedRoomId = roomId;
        booking.roomSelection.chambre = roomId === 'any' ? null : roomId;
        await loadReservations(roomId);
        if (value.start && value.end) {
            if (roomId !== 'any' && !isRoomAvailableRange(roomId, value.start, value.end)) {
                resetDates();
            }
        }
    }

    // --- STYLING LOGIC (OPTIMISÉ) ---
    let hoveredDate = $state<DateValue | null>(null);

    const cellStyles = $derived.by(() => {
        const styles: Record<string, string> = {};
        const {start, end} = value;
        const now = today(getLocalTimeZone());
        const barriers = validationBarriers;
        const maxBarrier = barriers.max;
        const minBarrier = barriers.min;

        // Préparation des barrières (hors boucle principale)
        const selectionLimits: Record<string|number, DateValue | null> = {};
        if (start && !end && selectedRoomId === 'any') {
            for (const room of rooms) {
                const cache = bookedDatesCache[room.id];
                if (!cache) { selectionLimits[room.id] = null; continue; }
                let rMax: DateValue | null = null;
                let curr = start.add({days: 0});
                for(let i=0; i<90; i++) {
                    if (cache.has(curr.toString())) {
                        rMax = curr;
                        break;
                    }
                    curr = curr.add({days: 1});
                }
                selectionLimits[room.id] = rMax;
            }
        }

        if (!placeholder) return {};

        let firstDayOfMonth = new CalendarDate(placeholder.year, placeholder.month, 1);
        let dayOfWeek = getDayOfWeek(firstDayOfMonth, 'fr-FR');
        let offset = (dayOfWeek) % 7;
        let currentDate = firstDayOfMonth.subtract({days: offset});

        for (let i = 0; i < 42; i++) {
            const dateStr = currentDate.toString();
            const isPast = currentDate.compare(now) < 0;

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
                if ((compareStart > 0 && compareHover <= 0) || (compareStart < 0 && compareHover >= 0)) {
                    isHoverRange = true;
                }
            }

            let baseBg = 'transparent';
            let textColor = 'inherit';
            let cursor = 'pointer';
            let textureOpacity = '0';
            let textDecor = 'none';
            let decorColor = 'transparent';
            let bg = 'none';

            if (selectedRoomId === 'any' && rooms.length >= 2) {
                const r1Id = rooms[0].id;
                const r2Id = rooms[1].id;
                const r3Id = rooms[2]?.id;

                let r1Limit = start && !end ? selectionLimits[r1Id] : null;
                let r2Limit = start && !end ? selectionLimits[r2Id] : null;
                let r3Limit = start && !end && r3Id ? selectionLimits[r3Id] : null;

                const r1Masked = r1Limit && isSameDay(currentDate, r1Limit);
                const r2Masked = r2Limit && isSameDay(currentDate, r2Limit);
                const r3Masked = r3Limit && r3Id && isSameDay(currentDate, r3Limit);

                const r1Real = bookedDatesCache[r1Id]?.has(dateStr);
                const r2Real = bookedDatesCache[r2Id]?.has(dateStr);
                const r3Real = r3Id && bookedDatesCache[r3Id]?.has(dateStr);

                const r1Booked = r1Real && !r1Masked;
                const r2Booked = r2Real && !r2Masked;
                const r3Booked = r3Real && !r3Masked;

                if (rooms.length >= 3) {
                    if (r1Booked || r2Booked || r3Booked) {
                        const c1 = r1Booked ? 'rgba(245, 86, 119, 0.1)' : 'transparent';
                        const c2 = r2Booked ? 'rgba(245, 86, 119, 0.1)' : 'transparent';
                        const c3 = r3Booked ? 'rgba(245, 86, 119, 0.1)' : 'transparent';
                        bg = `conic-gradient(from 330deg, ${c1} 0deg 120deg, ${c2} 120deg 240deg, ${c3} 240deg 360deg)`;
                        textureOpacity = '1';
                    }
                } else {
                    if (r1Booked && r2Booked) {
                        bg = 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(245, 86, 119, 0.1) 5px, rgba(245, 86, 119, 0.1) 10px)';
                        textureOpacity = '1';
                    } else if (r1Booked) {
                        bg = "linear-gradient(135deg, rgba(245, 86, 119, 0.1) 50%, transparent 50%)";
                        textureOpacity = '1';
                    } else if (r2Booked) {
                        bg = "linear-gradient(135deg, transparent 50%, rgba(245, 86, 119, 0.1) 50%)";
                        textureOpacity = '1';
                    }
                }
            } else if (full) {
                let isBarrier = false;
                if (start && !end) {
                    if (maxBarrier && isSameDay(currentDate, maxBarrier)) isBarrier = true;
                    if (minBarrier && isSameDay(currentDate, minBarrier)) isBarrier = true;
                }

                if (!isBarrier) {
                    bg = currentDate.month !== placeholder.month
                        ? 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(245, 86, 119, 0.05) 5px, rgba(245, 86, 119, 0.05) 10px)'
                        : 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(245, 86, 119, 0.1) 5px, rgba(245, 86, 119, 0.1) 10px)';
                    textureOpacity = '1';
                }
            }

            const isBarrierDate = start && !end && (
                (maxBarrier && isSameDay(currentDate, maxBarrier)) ||
                (minBarrier && isSameDay(currentDate, minBarrier))
            );

            if (isPast) {
                textColor = '#787579';
                textDecor = 'line-through';
                decorColor = '#787579';
                cursor = 'not-allowed';
                bg = 'none';
            } else if (isStart || isEnd) {
                bg = 'none';
                baseBg = '#f55677';
                textColor = 'white';
                textureOpacity = '0';
                if (isStart && !end) {
                    cursor = 'pointer'; // Ensure it's clickable for deselection
                }
            } else {
                if ((isSelected || isHoverRange) && !isBlockedByBarrier) {
                    baseBg = 'rgba(245, 86, 119, 0.15)';
                    textColor = '#f55677';
                }

                if (isBarrierDate) {
                    cursor = 'pointer';
                } else if (full) {
                    if (bg !== 'none') {
                        textColor = '#b91c1c';
                        textDecor = 'line-through';
                        decorColor = '#fca5a5';
                        cursor = 'not-allowed';
                    }
                } else if (isBlockedByBarrier) {
                    textColor = '#94a3b8';
                    cursor = 'not-allowed';
                }
            }

            if (currentDate.month !== placeholder.month && !(isStart || isEnd)) {
                textColor = '#94a3b8';
            }

            styles[dateStr] = `
                --cell-bg: ${bg};
                --cell-opacity: ${textureOpacity};
                --base-bg: ${baseBg};
                --base-color: ${textColor};
                --text-decor: ${textDecor};
                --decor-color: ${decorColor};
                background-color: var(--base-bg) !important;
                color: var(--base-color) !important;
                text-decoration: var(--text-decor) !important;
                text-decoration-color: var(--decor-color) !important;
                cursor: ${cursor} !important;
                pointer-events: ${cursor === 'not-allowed' ? 'none' : 'auto'} !important;
            `;

            currentDate = currentDate.add({days: 1});
        }
        return styles;
    });
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
    <!-- LEFT COLUMN: Calendar & Filters -->
    <div class="space-y-8">
        <CalendarView
                bind:value={value}
                bind:placeholder={placeholder}
                bind:hoveredDate={hoveredDate}
                minValue={value.start}
                isDateUnavailable={isDateUnavailable}
                cellStyles={cellStyles}
                onReset={resetDates}
                selectedRoomId={selectedRoomId}
                onDateClick={handleDateClick}
        />

        <TravelersSelector
                bind:adults={adults}
                bind:children={children}
                maxAdults={maxAdults}
                maxChildren={maxChildren}
        />

        <OptionSelector
                bind:parking={booking.roomSelection.parking}
        />
    </div>

    <!-- RIGHT COLUMN: Rooms & Price -->
    <div class="flex flex-col h-full space-y-6">
        <div>
            <span class="text-xs font-bold text-primary tracking-widest uppercase">Étape 2</span>
            <h3 class="text-xl font-bold text-iron dark:text-limestone-50">La chambre idéale</h3>
        </div>

        <RoomList
                rooms={rooms}
                loading={loading}
                selectedRoomId={selectedRoomId}
                value={value}
                onSelect={handleRoomSelect}
                isRoomAvailableRange={isRoomAvailableRange}
                getRoomImage={resolveRoomImage}
        />

        <PriceEstimator
                priceEstimate={priceEstimate}
                adults={adults}
                children={children}
                isRoomSelected={!!booking.roomSelection.chambre && booking.roomSelection.chambre !== 'any'}
        />
    </div>
</div>