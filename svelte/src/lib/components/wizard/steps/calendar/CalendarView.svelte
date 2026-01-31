<script lang="ts">
    import { RangeCalendar, type DateValue, type DateRange } from "bits-ui";
    import { getLocalTimeZone, today, isSameDay, DateFormatter } from "@internationalized/date";
    import { slide, scale, fade } from 'svelte/transition';
    import { quintOut, cubicOut } from 'svelte/easing';
    import { page } from "$app/state";
    import { defaultLocale } from "$lib/i18n";
    import { booking } from '$lib/logic/booking.svelte';

    interface Props {
        value: DateRange;
        placeholder: DateValue;
        hoveredDate: DateValue | null;
        minValue: DateValue;
        isDateUnavailable: (date: DateValue) => boolean;
        cellClasses: Record<string, string>;
        onReset: () => void;
        selectedRoomId: string | number;
        onDateClick: (date: DateValue, currentMonth: DateValue) => void;
        isInvalid?: boolean;
    }

    let {
        value = $bindable(),
        placeholder = $bindable(),
        hoveredDate = $bindable(),
        minValue,
        isDateUnavailable,
        cellClasses,
        onReset,
        selectedRoomId,
        onDateClick,
        isInvalid = false
    }: Props = $props();

    // Translations from global store
    const l = $derived(booking.labels);

    const now = today(getLocalTimeZone());
    const minBookableDate = now.add({ days: 3 });

    // Localized date formatter
    const df = $derived(new DateFormatter(page.data.locale || defaultLocale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }));

    const isRestrictedDate = (date: DateValue) => date.compare(minBookableDate) < 0;

    function handleDayClick(e: MouseEvent | undefined, date: DateValue, month: DateValue) {
        const { start, end } = value;

        // --- 1. TOGGLE LOGIC (Clicking Start or End clears selection) ---
        // Case A: Clicking the exact Start Date (when only Start exists)
        if (start && !end && isSameDay(start, date)) {
            e?.preventDefault();   // Stop library from re-selecting
            e?.stopPropagation();
            value = { start: undefined, end: undefined };
            onDateClick(date, month);
            return;
        }

        // Case B: Clicking the exact End Date (when Range exists)
        if (start && end && isSameDay(end, date)) {
            e?.preventDefault();
            e?.stopPropagation();
            value = { start: undefined, end: undefined };
            onDateClick(date, month);
            return;
        }

        // Case C: Clicking Start Date (when Range exists) -> Also clear for UX consistency?
        // Let's implement your specific request: "clear the selection when you click the first day of the selection even if no second day is selected"
        // This is covered by Case A.
        // If a range exists (Start & End), clicking Start usually starts a new range in most datepickers.
        // If you strictly want it to CLEAR, we add this:
        if (start && end && isSameDay(start, date)) {
            e?.preventDefault();
            e?.stopPropagation();
            value = { start: undefined, end: undefined };
            onDateClick(date, month);
            return;
        }


        // --- 2. BACKWARD SELECTION LOGIC ---
        // If start exists (no end) and click is BEFORE start -> Swap them
        if (start && !end && date.compare(start) < 0) {
            e?.preventDefault();
            e?.stopPropagation();
            // Manually set the range in correct order
            value = { start: date, end: start };
            onDateClick(date, month);
            return;
        }

        // --- 3. DEFAULT BEHAVIOR ---
        // If none of the above, let bits-ui handle the new selection step
        onDateClick(date, month);
    }
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between border-b-2 border-iron/10 dark:border-limestone-100/10 pb-4 h-14">
        <h3 class="text-2xl font-heading font-bold text-iron dark:text-limestone-50">{l.cal_dates_title}</h3>
        {#if value.start || value.end}
            <button
                    onclick={onReset}
                    transition:scale={{ duration: 200, start: 0.8, easing: cubicOut }}
                    class="text-xs font-bold text-primary uppercase tracking-wider hover:underline decoration-2 underline-offset-4"
            >
                {l.cal_btn_clear}
            </button>
        {/if}
    </div>

    <div class="calendar-container transition-all duration-300 rounded-xl p-2 {isInvalid ? 'ring-2 ring-red-500 bg-red-50/30' : ''}">
        <RangeCalendar.Root
                bind:value
                bind:placeholder
                minValue={minValue}
                isDateUnavailable={(d) => isRestrictedDate(d) || isDateUnavailable(d)}
                class="w-full"
                locale={page.data.locale}
        >
            {#snippet children({ months, weekdays })}
                <RangeCalendar.Header class="calendar-header-row">
                    <RangeCalendar.PrevButton class="calendar-nav-btn">←</RangeCalendar.PrevButton>
                    <RangeCalendar.Heading class="calendar-heading" />
                    <RangeCalendar.NextButton class="calendar-nav-btn">→</RangeCalendar.NextButton>
                </RangeCalendar.Header>

                <RangeCalendar.Grid class="calendar-grid">
                    <RangeCalendar.GridHead>
                        <RangeCalendar.GridRow class="flex w-full justify-between mb-4">
                            {#each weekdays as day, i}
                                <RangeCalendar.HeadCell
                                        class="calendar-weekday-header {i >= 5 ? 'text-primary' : 'text-iron/40 dark:text-limestone-400'}"
                                >
                                    {day.slice(0, 2)}
                                </RangeCalendar.HeadCell>
                            {/each}
                        </RangeCalendar.GridRow>
                    </RangeCalendar.GridHead>
                    <RangeCalendar.GridBody>
                        {#each months as month (month.value.toString())}
                            {#each month.weeks as week}
                                <RangeCalendar.GridRow class="flex w-full justify-between mt-2">
                                    {#each week as date}
                                        <RangeCalendar.Cell {date} month={month.value} class="calendar-day-wrapper">
                                            <RangeCalendar.Day
                                                    {date}
                                                    month={month.value}
                                                    onclick={(e) => handleDayClick(e, date, month.value)}
                                                    onmouseenter={() => hoveredDate = date}
                                                    onmouseleave={() => hoveredDate = null}
                                                    class="group calendar-day {cellClasses[date.toString()] || ''}"
                                            />
                                        </RangeCalendar.Cell>
                                    {/each}
                                </RangeCalendar.GridRow>
                            {/each}
                        {/each}
                    </RangeCalendar.GridBody>
                </RangeCalendar.Grid>
            {/snippet}
        </RangeCalendar.Root>

        <div class="calendar-legend">
            <div class="calendar-legend-item">
                <div class="legend-indicator available"></div>
                <span>{l.cal_legend_available}</span>
            </div>
            {#if selectedRoomId === 'any'}
                <div class="calendar-legend-item">
                    <div class="legend-indicator partial"></div>
                    <span>{l.cal_legend_partial}</span>
                </div>
            {/if}
            <div class="calendar-legend-item">
                <div class="legend-indicator booked"></div>
                <span>{l.cal_legend_full}</span>
            </div>
            <div class="calendar-legend-item">
                <div class="legend-indicator past"></div>
                <span>{l.cal_legend_unavailable}</span>
            </div>
        </div>
    </div>

    <!-- Selection Summary Block -->
    {#if value.start}
        <div transition:slide={{ duration: 400, easing: quintOut }} class="pt-2">
            <div class="relative overflow-hidden rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 p-5 flex items-center gap-4 group">
                <!-- Decorative background pulse -->
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-white dark:bg-iron flex items-center justify-center text-primary shadow-sm border border-primary/10">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
                    </svg>
                </div>

                <div class="flex-1 min-w-0">
                    <span class="block text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">{l.cal_selection_dates_label}</span>
                    <div class="flex flex-wrap items-baseline gap-x-2">
                        <span class="text-iron dark:text-limestone-100 font-heading font-bold text-lg leading-tight">
                            {df.format(value.start.toDate(getLocalTimeZone()))}
                        </span>
                        {#if value.end && !isSameDay(value.start, value.end)}
                            <span class="text-primary font-serif italic text-sm">{l.cal_selection_to}</span>
                            <span class="text-iron dark:text-limestone-100 font-heading font-bold text-lg leading-tight">
                                {df.format(value.end.toDate(getLocalTimeZone()))}
                            </span>
                        {:else}
                            <span class="text-primary/60 font-serif italic text-sm animate-pulse">{l.cal_selection_placeholder_start}</span>
                        {/if}
                    </div>
                </div>

                {#if value.start && value.end && !isSameDay(value.start, value.end)}
                    <div in:fade={{ delay: 200 }} class="hidden sm:flex flex-col items-center justify-center px-4 py-2 bg-primary text-white rounded-lg shadow-retro-primary border border-iron-dark">
                        <span class="text-xl font-bold leading-none">
                            {Math.round((value.end.toDate(getLocalTimeZone()).getTime() - value.start.toDate(getLocalTimeZone()).getTime()) / 86400000)}
                        </span>
                        <span class="text-[8px] font-bold uppercase tracking-tighter">{l.cal_nights_unit}</span>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>