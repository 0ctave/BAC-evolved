<script lang="ts">
    import { RangeCalendar } from "bits-ui";
    import { type DateValue, type DateRange } from "bits-ui";
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
    <div class="select-none relative z-10">
        <RangeCalendar.Root
                bind:value
                bind:placeholder
                minValue={minValue}
                isDateUnavailable={isDateUnavailable}
                class="w-full"
                fixedWeeks={false}
                locale="fr-FR"
        >
            {#snippet children({months, weekdays})}
                <RangeCalendar.Header class="flex items-center justify-between pb-8 pt-2">
                    <RangeCalendar.PrevButton
                            class="w-9 h-9 rounded-full flex items-center justify-center border border-iron/20 hover:bg-iron hover:text-white hover:scale-110 active:scale-95 transition-all text-iron dark:text-limestone-300 dark:border-limestone-100/20 dark:hover:bg-limestone-100 dark:hover:text-iron duration-300">
                        <span class="mb-0.5 transform -translate-x-[1px]">←</span>
                    </RangeCalendar.PrevButton>

                    <RangeCalendar.Heading class="text-xl font-heading font-bold text-iron dark:text-limestone-50 capitalize select-none tabular-nums"/>

                    <RangeCalendar.NextButton
                            class="w-9 h-9 rounded-full flex items-center justify-center border border-iron/20 hover:bg-iron hover:text-white hover:scale-110 active:scale-95 transition-all text-iron dark:text-limestone-300 dark:border-limestone-100/20 dark:hover:bg-limestone-100 dark:hover:text-iron duration-300">
                        <span class="mb-0.5 transform translate-x-[1px]">→</span>
                    </RangeCalendar.NextButton>
                </RangeCalendar.Header>

                <RangeCalendar.Grid class="w-full border-collapse">
                    <RangeCalendar.GridHead>
                        <RangeCalendar.GridRow class="flex w-full justify-between mb-4">
                            {#each weekdays as day, i}
                                <RangeCalendar.HeadCell
                                        class="w-10 text-[10px] uppercase tracking-widest font-bold text-center select-none {i >= 5 ? 'text-primary' : 'text-iron/40 dark:text-limestone-400'}">
                                    {day.slice(0, 2)}
                                </RangeCalendar.HeadCell>
                            {/each}
                        </RangeCalendar.GridRow>
                    </RangeCalendar.GridHead>
                    <RangeCalendar.GridBody>
                        {#each months as month}
                            {#each month.weeks as week}
                                <RangeCalendar.GridRow class="flex w-full justify-between mt-2">
                                    {#each week as date}
                                        <RangeCalendar.Cell {date} month={month.value} class="relative p-0 m-0">
                                            <RangeCalendar.Day
                                                    {date}
                                                    month={month.value}
                                                    onclick={(e) => handleDayClick(e, date, month.value)}
                                                    style={cellStyles[date.toString()] || ''}
                                                    onmouseenter={() => hoveredDate = date}
                                                    onmouseleave={() => hoveredDate = null}
                                                    class="day-cell-animated w-10 h-10 flex items-center justify-center text-sm font-medium transition-all duration-300 relative z-10 font-sans group"
                                            >
                                            </RangeCalendar.Day>
                                        </RangeCalendar.Cell>
                                    {/each}
                                </RangeCalendar.GridRow>
                            {/each}
                        {/each}
                    </RangeCalendar.GridBody>
                </RangeCalendar.Grid>
            {/snippet}
        </RangeCalendar.Root>
    </div>

    {#if value.start && value.end && value.start.toString() !== value.end.toString()}
        <!-- FIX: Moving spacing to the transition wrapper (pt-2) prevents margin collapse jump -->
        <div transition:slide={{ duration: 300, easing: quintOut, axis: 'y' }} class="pt-2">
            <div class="flex items-center gap-4 p-4 border-l-4 border-primary bg-primary/5 dark:bg-primary/10 rounded-r-lg">
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

<style>
    :global(.day-cell-animated) {
        position: relative;
        overflow: hidden;
        border-radius: 8px;
        backface-visibility: hidden;
    }

    :global(.day-cell-animated:not([data-disabled]):hover) {
        transform: scale(1.1);
        z-index: 20;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        background-color: var(--background-color);
    }

    :global(.day-cell-animated:active) {
        transform: scale(0.95);
        transition-duration: 0.1s;
    }

    :global(.day-cell-animated::before) {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -1;
        background: var(--cell-bg, none);
        opacity: var(--cell-opacity, 0);
        transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: inherit;
        pointer-events: none;
    }
</style>