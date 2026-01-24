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

    // Global Minimum Date: Today + 3 days buffer
    const minDate = today(getLocalTimeZone()).add({ days: 3 });

    const toDateValue = (d: any): DateValue | undefined => d ? (d as DateValue) : undefined;

    let value = $state<DateRange>({
        start: toDateValue(booking.roomSelection.date_arrivee),
        end: toDateValue(booking.roomSelection.date_depart)
    });

    // --- INITIALIZATION LOGIC FOR PLACEHOLDER ---
    let placeholder = $state<DateValue>(
        untrack(() => {
            if (value.start) return value.start;
            const now = today(getLocalTimeZone());
            const startOfNextMonth = now.set({ day: 1 }).add({ months: 1 });
            const endOfMonth = startOfNextMonth.subtract({ days: 1 });
            const daysRemaining = endOfMonth.day - now.day;

            if (daysRemaining < 14) {
                return startOfNextMonth;
            }
            return now;
        })
    );

    // --- CAPACITÉ & CONTRAINTES ---
    let activeRoom = $derived(
        selectedRoomId !== 'any' ? rooms.find(r => r.id === selectedRoomId) : null
    );

    // Maximum adults allowed individually
    let maxAdults = $derived.by(() => {
        if (activeRoom) return activeRoom.capacite_adultes ?? 2;
        return rooms.length > 0 ? Math.max(...rooms.map(r => r.capacite_adultes ?? 2)) : 2;
    });

    // Maximum children allowed individually
    let maxChildren = $derived.by(() => {
        if (activeRoom) return activeRoom.capacite_enfants ?? 0;
        return rooms.length > 0 ? Math.max(...rooms.map(r => r.capacite_enfants ?? 0)) : 0;
    });

    // Maximum TOTAL capacity (Adults + Children)
    let totalCapacity = $derived.by(() => {
        if (activeRoom) {
            return (activeRoom.capacite_adultes ?? 2) + (activeRoom.capacite_enfants ?? 0);
        }
        // If "any" room is selected, find the room with the largest combined capacity
        if (rooms.length > 0) {
            return Math.max(...rooms.map(r => (r.capacite_adultes ?? 2) + (r.capacite_enfants ?? 0)));
        }
        return 2;
    });

    $effect(() => {
        // Enforce individual limits
        if (adults > maxAdults) adults = maxAdults;
        if (children > maxChildren) children = maxChildren;

        // Enforce total capacity limit
        if (adults + children > totalCapacity) {
            // Prioritize adults, reduce children if needed, then reduce adults
            if (adults > totalCapacity) {
                adults = totalCapacity;
                children = 0;
            } else {
                children = totalCapacity - adults;
            }
        }
    });

    // --- PRICING CALCULATIONS ---

    // 1. Calculate TRUE room prices per night (Average)
    const roomPrices = $derived.by(() => {
        const prices: Record<string | number, number> = {};

        const simStart = value.start ? (value.start as CalendarDate) : today(getLocalTimeZone()).add({days: 3});
        const simEnd = (value.start && value.end) ? (value.end as CalendarDate) : simStart.add({days: 1});

        rooms.forEach(room => {
            const result = calculateStayPrice(
                Number(room.prix_nuit),
                simStart,
                simEnd,
                pricingRules,
                {
                    adults: adults,
                    children: children,
                    parking: false,
                    roomId: room.id
                }
            );

            const nights = Math.max(1, result.details.length);
            prices[room.id] = Math.round(result.total / nights);
        });
        return prices;
    });

    // 2. Calculate Parking Price
    const parkingDetails = $derived.by(() => {
        let days = 0;
        if (value.start && value.end) {
            const d1 = value.start.toDate(getLocalTimeZone());
            const d2 = value.end.toDate(getLocalTimeZone());
            const diffTime = Math.abs(d2.getTime() - d1.getTime());
            days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        // For rate calculation, assume at least 1 day if selection is incomplete
        const durationForCalc = Math.max(1, days);

        // Find all rules that apply to parking for this duration
        let activeRules = pricingRules.filter(r => {
            const types = Array.isArray(r.type) ? r.type : [r.type];
            if (!types.includes('parking')) return false;

            // Check duration constraints
            if (r.duree_min && durationForCalc < r.duree_min) return false;
            if (r.duree_max && durationForCalc > r.duree_max) return false;

            return true;
        });

        // Handle overrides (If a rule is a parent of another selected rule, remove the parent)
        activeRules = activeRules.filter(parent => {
            const isOverridden = activeRules.some(child => {
                const pId = (typeof child.parent === 'object' && child.parent) ? (child.parent as any).id : child.parent;
                return pId == parent.id;
            });
            return !isOverridden;
        });

        // Sum up the values (e.g. Base 15 + Discount -5 = 10)
        const dailyRate = activeRules.reduce((sum, r) => sum + Number(r.valeur), 0);

        return {
            dailyRate,
            total: days > 0 ? dailyRate * days : dailyRate,
            nights: days
        };
    });

    // 3. Total Estimate
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
        if (date.compare(minDate) < 0) return true;

        if (!value.start) {
            return isFull(date);
        }

        const barriers = validationBarriers;

        if (date.compare(value.start) > 0) {
            if (barriers.max && date.compare(barriers.max) > 0) return true;
            return false;
        }

        if (date.compare(value.start) < 0) {
            if (barriers.min && date.compare(barriers.min) < 0) return true;
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

    function handleDateClick(date: DateValue, currentMonth: DateValue) {
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

    // --- STYLING LOGIC ---
    let hoveredDate = $state<DateValue | null>(null);

    const cellStyles = $derived.by(() => {
        const styles: Record<string, string> = {};
        const {start, end} = value;
        const now = today(getLocalTimeZone());
        const barriers = validationBarriers;
        const maxBarrier = barriers.max;
        const minBarrier = barriers.min;

        if (!placeholder) return {};

        let firstDayOfMonth = new CalendarDate(placeholder.year, placeholder.month, 1);
        let dayOfWeek = getDayOfWeek(firstDayOfMonth, 'fr-FR');
        let offset = (dayOfWeek) % 7;
        let currentDate = firstDayOfMonth.subtract({days: offset});

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

            const isBarrierDate = start && !end && (
                (maxBarrier && isSameDay(currentDate, maxBarrier)) ||
                (minBarrier && isSameDay(currentDate, minBarrier))
            );

            if (isRestricted) {
                textColor = '#787579';
                textDecor = 'line-through';
                decorColor = '#787579';
                cursor = 'not-allowed';
                bg = 'none';
            }
            else if (isStart || isEnd) {
                bg = 'none';
                baseBg = '#f55677';
                textColor = 'white';
                textureOpacity = '0';
                if (isStart && !end) {
                    cursor = 'pointer';
                }
            }
            else if (isBlockedByBarrier) {
                textColor = '#d1d5db';
                bg = 'transparent';
                textureOpacity = '0';
                cursor = 'not-allowed';
                baseBg = 'rgba(0,0,0,0.03)';
            }
            else if ((isSelected || isHoverRange)) {
                baseBg = 'rgba(245, 86, 119, 0.15)';
                textColor = '#f55677';
            }
            else if (isBarrierDate) {
                cursor = 'pointer';
            }
            else {
                if (selectedRoomId === 'any' && rooms.length >= 2) {
                    const bookedCount = rooms.reduce((acc, room) => {
                        const isBooked = bookedDatesCache[room.id]?.has(dateStr);
                        const isCheckIn = checkInDates[room.id]?.has(dateStr);

                        if (start && !end && currentDate.compare(start) > 0) {
                            if (isBooked && isCheckIn) return acc;
                        }
                        return acc + (isBooked ? 1 : 0);
                    }, 0);

                    if (bookedCount > 0 && bookedCount < rooms.length) {
                        bg = "rgba(254, 243, 199, 1)";
                        textureOpacity = '1';
                    }
                }

                if (full) {
                    if (selectedRoomId === 'any') {
                        textColor = '#b91c1c';
                        textDecor = 'line-through';
                        decorColor = '#fca5a5';
                        cursor = 'not-allowed';
                        bg = 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(245, 86, 119, 0.1) 5px, rgba(245, 86, 119, 0.1) 10px)';
                        textureOpacity = '1';
                    } else {
                        bg = currentDate.month !== placeholder.month
                            ? 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(245, 86, 119, 0.05) 5px, rgba(245, 86, 119, 0.05) 10px)'
                            : 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(245, 86, 119, 0.1) 5px, rgba(245, 86, 119, 0.1) 10px)';
                        textureOpacity = '1';
                        textColor = '#b91c1c';
                        textDecor = 'line-through';
                        decorColor = '#fca5a5';
                        cursor = 'not-allowed';
                    }
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
                minValue={minDate}
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
            <span class="text-xs font-bold text-primary tracking-widest uppercase">Étape 2</span>
            <h3 class="text-xl font-bold text-iron dark:text-limestone-50">La chambre idéale</h3>
        </div>

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
        />

        <PriceEstimator
                priceEstimate={priceEstimate}
                adults={adults}
                children={children}
                isRoomSelected={!!booking.roomSelection.chambre && booking.roomSelection.chambre !== 'any'}
        />
    </div>
</div>