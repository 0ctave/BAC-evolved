<script lang="ts">
    import { Calendar } from "bits-ui";
    import { getLocalTimeZone, today, isSameDay, DateFormatter, CalendarDate, getDayOfWeek } from "@internationalized/date";
    import type { DateValue } from "@internationalized/date";
    import { scale, fade, slide } from 'svelte/transition';
    import { quintOut, cubicOut } from 'svelte/easing';
    import { page } from "$app/state";
    import { defaultLocale } from "$lib/i18n";
    import { booking } from '$lib/logic/booking.svelte';

    interface Props {
        value: DateValue | undefined;
        placeholder: DateValue;
        availableDates: Set<string>;
        onReset: () => void;
        isInvalid?: boolean;
    }

    let {
        value = $bindable(),
        placeholder = $bindable(),
        availableDates = new Set(),
        onReset,
        isInvalid = false
    }: Props = $props();

    const l = $derived(booking.labels);
    const now = today(getLocalTimeZone());
    const tz = getLocalTimeZone();

    const df = $derived(new DateFormatter(page.data.locale || defaultLocale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }));

    const cellClasses = $derived.by(() => {
        const classes: Record<string, string> = {};
        if (!placeholder) return {};

        let firstDayOfMonth = new CalendarDate(placeholder.year, placeholder.month, 1);
        let dayOfWeek = getDayOfWeek(firstDayOfMonth, 'fr-FR');
        let offset = dayOfWeek % 7;
        let currentDate = firstDayOfMonth.subtract({ days: offset });

        for (let i = 0; i < 42; i++) {
            const dateStr = currentDate.toString();
            const isRestricted = currentDate.compare(now) < 0;
            const isSelected = value && isSameDay(currentDate, value);

            let assignedClass = '';
            if (isRestricted) {
                assignedClass = 'cal-day-restricted';
            } else if (isSelected) {
                assignedClass = 'cal-day-selected-endpoint';
            }

            if (currentDate.month !== placeholder.month && !isSelected) {
                assignedClass += ' cal-day-dimmed';
            }

            classes[dateStr] = assignedClass;
            currentDate = currentDate.add({ days: 1 });
        }
        return classes;
    });

    function handleDayClick(e: MouseEvent, date: DateValue) {
        e.preventDefault();
        e.stopPropagation();
        if (value && date.toString() === value.toString()) {
            value = undefined;
        } else {
            value = date;
        }
    }
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between border-b-2 border-iron/10 dark:border-limestone-100/10 pb-4 h-14">
        <h3 class="text-2xl font-heading font-bold text-iron dark:text-limestone-50">{l.cal_tour_title || 'Date de visite'}</h3>
        {#if value}
            <button
                    onclick={onReset}
                    transition:scale={{ duration: 200, start: 0.8, easing: cubicOut }}
                    type="button"
                    class="text-xs font-bold text-primary uppercase tracking-wider hover:underline decoration-2 underline-offset-4"
            >
                {l.cal_btn_clear || 'Effacer'}
            </button>
        {/if}
    </div>

    <div class="calendar-container transition-all duration-300 rounded-xl p-2 bg-white dark:bg-iron/5 border border-iron/5 {isInvalid ? 'ring-2 ring-red-500 bg-red-50/30' : ''}">
        <Calendar.Root
                value={value}
                bind:placeholder
                minValue={now}
                class="w-full"
                locale={page.data.locale || defaultLocale}
        >
            {#snippet children({ months, weekdays })}
                <Calendar.Header class="calendar-header-row">
                    <Calendar.PrevButton class="calendar-nav-btn">←</Calendar.PrevButton>
                    <Calendar.Heading class="calendar-heading" />
                    <Calendar.NextButton class="calendar-nav-btn">→</Calendar.NextButton>
                </Calendar.Header>

                <Calendar.Grid class="calendar-grid">
                    <Calendar.GridHead>
                        <Calendar.GridRow class="flex w-full justify-between mb-4">
                            {#each weekdays as day, i}
                                <Calendar.HeadCell
                                        class="calendar-weekday-header {i >= 5 ? 'text-primary' : 'text-iron/40 dark:text-limestone-400'}"
                                >
                                    {day.slice(0, 2)}
                                </Calendar.HeadCell>
                            {/each}
                        </Calendar.GridRow>
                    </Calendar.GridHead>
                    <Calendar.GridBody>
                        {#each months as month}
                            {#each month.weeks as week}
                                <Calendar.GridRow class="flex w-full justify-between mt-2">
                                    {#each week as date}
                                        {@const hasActivity = availableDates.has(date.toString())}
                                        {@const isToday = isSameDay(date, now)}
                                        {@const isSelected = value && isSameDay(date, value)}

                                        <Calendar.Cell {date} month={month.value} class="calendar-day-wrapper">
                                            <Calendar.Day
                                                    {date}
                                                    month={month.value}
                                                    onclick={(e) => handleDayClick(e, date)}
                                                    class="group calendar-day relative transition-all duration-300 {cellClasses[date.toString()] || ''}"
                                            >
                                                <div class="w-full h-full flex items-center justify-center relative">
                                                    <span class="z-10 text-sm font-bold transition-transform group-hover:scale-110 {isSelected ? 'text-white' : ''}">
                                                        {date.day}
                                                    </span>

                                                    {#if hasActivity}
                                                        <div class="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-all
                                                            {isSelected ? 'bg-white' : 'bg-primary'}
                                                            group-hover:scale-150"
                                                        ></div>
                                                    {/if}
                                                </div>
                                            </Calendar.Day>
                                        </Calendar.Cell>
                                    {/each}
                                </Calendar.GridRow>
                            {/each}
                        {/each}
                    </Calendar.GridBody>
                </Calendar.Grid>
            {/snippet}
        </Calendar.Root>
    </div>

    <!-- Selection Summary Block -->
    {#if value && typeof value.toDate === 'function'}
        <div transition:slide={{ duration: 400, easing: quintOut }} class="pt-2">
            <div class="relative overflow-hidden rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 p-5 flex items-center gap-4 group">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-white dark:bg-iron flex items-center justify-center text-primary shadow-sm border border-primary/10">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>

                <div class="flex-1 min-w-0">
                    <span class="block text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">{l.cal_selection_dates_label || 'Date de visite'}</span>
                    <span class="text-iron dark:text-limestone-100 font-heading font-bold text-lg leading-tight uppercase">
                        {df.format(value.toDate(tz))}
                    </span>
                </div>
            </div>
        </div>
    {/if}
</div>