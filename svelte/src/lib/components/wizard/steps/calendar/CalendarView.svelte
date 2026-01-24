<script lang="ts">
    import { RangeCalendar } from "bits-ui";
    import { type DateValue, type DateRange } from "bits-ui";
    import { getLocalTimeZone, today } from "@internationalized/date";
    import { slide, scale } from 'svelte/transition';
    import { quintOut, cubicOut } from 'svelte/easing';

    let {
        value = $bindable(),
        placeholder = $bindable(),
        hoveredDate = $bindable(),
        minValue,
        isDateUnavailable,
        cellStyles,
        onReset,
        selectedRoomId,
        onDateClick
    } = $props<{
        value: DateRange,
        placeholder: DateValue,
        hoveredDate: DateValue | null,
        minValue: DateValue,
        isDateUnavailable: (date: DateValue) => boolean,
        cellStyles: Record<string, string>,
        onReset: () => void,
        selectedRoomId: string | number,
        onDateClick: (date: DateValue, currentMonth: DateValue) => void
    }>();

    const now = today(getLocalTimeZone());
    // Define the buffer period: Today + 2 days = 3 days total unavailable
    const minBookableDate = now.add({ days: 3 });

    // Strict future check (Bookable date onwards)
    const isFutureBookableDate = (date: DateValue) => date.compare(minBookableDate) >= 0;

    // Check if date is in the "grayed out" period (Past, Today, or the next 2 days)
    const isRestrictedDate = (date: DateValue) => date.compare(minBookableDate) < 0;

    // Helper to check if a date is unavailable due to being "booked" (from prop)
    const isBooked = (date: DateValue) => isDateUnavailable ? isDateUnavailable(date) : false;

    // Helper to determine if a date should be disabled in the calendar interaction
    const isDateDisabled = (date: DateValue) => {
        // Disable if it's restricted (past/today+2) OR if it's marked as unavailable/booked
        return isRestrictedDate(date) || isBooked(date);
    };

    // Helper to determine the visual class
    const getDayClass = (date: DateValue) => {
        if (isRestrictedDate(date)) return 'calendar-day-default'; // Will be styled by [data-disabled] in CSS
        if (isBooked(date)) return 'calendar-day-booked';
        return 'calendar-day-future';
    };

    function handleDayClick(e: MouseEvent | undefined, date: DateValue, month: DateValue) {
        const currentStart = value.start;
        const currentEnd = value.end;
        const dateStr = date.toString();

        const isSelectionMode = currentStart && (!currentEnd || currentStart.toString() === currentEnd.toString());

        if (isSelectionMode) {
            if (currentStart.toString() === dateStr) {
                if (e) e.stopPropagation();
                setTimeout(() => { value = { start: undefined, end: undefined }; }, 50);
                onDateClick(date, month);
                return;
            }
            if (date.compare(currentStart) < 0) {
                if (e) e.stopPropagation();
                setTimeout(() => { value = { start: date, end: currentStart }; }, 50);
                onDateClick(date, month);
                return;
            }
        }
        else if (currentStart && currentEnd) {
            if (date.compare(currentStart) < 0) {
                if (e) e.stopPropagation();
                setTimeout(() => { value = { start: date, end: undefined }; }, 50);
                onDateClick(date, month);
                return;
            }
        }
        onDateClick(date, month);
    }
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between border-b-2 border-iron/10 dark:border-limestone-100/10 pb-4 h-14">
        <div>
            <h3 class="text-2xl font-heading font-bold text-iron dark:text-limestone-50">Vos dates</h3>
        </div>
        {#if value.start || value.end}
            <button
                    onclick={onReset}
                    transition:scale={{ duration: 200, start: 0.8, easing: cubicOut }}
                    class="text-xs font-bold text-primary uppercase tracking-wider hover:underline decoration-2 underline-offset-4 transition-all">
                Effacer
            </button>
        {/if}
    </div>

    <!-- Calendar -->
    <div class="calendar-container">
        <RangeCalendar.Root
                bind:value
                bind:placeholder
                minValue={minValue}
                isDateUnavailable={isDateDisabled}
                class="w-full"
                fixedWeeks={false}
                locale="fr-FR"
        >
            {#snippet children({months, weekdays})}
                <RangeCalendar.Header class="calendar-header-row">
                    <RangeCalendar.PrevButton class="calendar-nav-btn">
                        <span class="mb-0.5 transform -translate-x-[1px]">←</span>
                    </RangeCalendar.PrevButton>

                    <RangeCalendar.Heading class="calendar-heading"/>

                    <RangeCalendar.NextButton class="calendar-nav-btn">
                        <span class="mb-0.5 transform translate-x-[1px]">→</span>
                    </RangeCalendar.NextButton>
                </RangeCalendar.Header>

                <RangeCalendar.Grid class="calendar-grid">
                    <RangeCalendar.GridHead>
                        <RangeCalendar.GridRow class="flex w-full justify-between mb-4">
                            {#each weekdays as day, i}
                                <RangeCalendar.HeadCell
                                        class="calendar-weekday-header {i >= 5 ? 'text-primary' : 'text-iron/40 dark:text-limestone-400'}">
                                    {day.slice(0, 2)}
                                </RangeCalendar.HeadCell>
                            {/each}
                        </RangeCalendar.GridRow>
                    </RangeCalendar.GridHead>
                    <RangeCalendar.GridBody>
                        {#key months[0]?.value.toString()}
                            {#each months as month}
                                {#each month.weeks as week}
                                    <RangeCalendar.GridRow class="flex w-full justify-between mt-2">
                                        {#each week as date}
                                            <RangeCalendar.Cell {date} month={month.value} class="calendar-day-wrapper">
                                                <RangeCalendar.Day
                                                        {date}
                                                        month={month.value}
                                                        onclick={(e) => handleDayClick(e, date, month.value)}
                                                        style={cellStyles[date.toString()] || ''}
                                                        onmouseenter={() => hoveredDate = date}
                                                        onmouseleave={() => hoveredDate = null}
                                                        class="group calendar-day {getDayClass(date)}"
                                                >
                                                </RangeCalendar.Day>
                                            </RangeCalendar.Cell>
                                        {/each}
                                    </RangeCalendar.GridRow>
                                {/each}
                            {/each}
                        {/key}
                    </RangeCalendar.GridBody>
                </RangeCalendar.Grid>
            {/snippet}
        </RangeCalendar.Root>

        <!-- Legend -->
        <div class="calendar-legend">
            <div class="calendar-legend-item">
                <div class="legend-indicator available"></div>
                <span>Disponible</span>
            </div>

            <!-- Partial Availability (Amber) - Only in Combined View -->
            {#if selectedRoomId === 'any'}
                <div class="calendar-legend-item">
                    <div class="legend-indicator partial"></div>
                    <!-- Clearer text for users -->
                    <span>Dernière chambre</span>
                </div>
            {/if}

            <!-- Standard booked legend (Red) -->
            <div class="calendar-legend-item">
                <div class="legend-indicator booked"></div>
                <span>Complet</span>
            </div>

            <div class="calendar-legend-item">
                <div class="legend-indicator past"></div>
                <span>Indisponible</span>
            </div>
        </div>
    </div>

    {#if value.start && value.end && value.start.toString() !== value.end.toString()}
        <div transition:slide={{ duration: 300, easing: quintOut, axis: 'y' }} class="pt-2">
            <div class="calendar-info-box">
                <div class="p-2 bg-white dark:bg-iron rounded-full shadow-sm text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                    <span class="block text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">Dates sélectionnées</span>
                    <span class="text-iron dark:text-limestone-100 font-heading font-bold text-lg">Du {value.start} au {value.end}</span>
                </div>
            </div>
        </div>
    {/if}
</div>