<script lang="ts">
	import { RangeCalendar, type DateRange } from 'bits-ui';
	import {
		getLocalTimeZone,
		today,
		isSameDay,
		type DateValue,
		DateFormatter
	} from '@internationalized/date';
	import { slide, scale, fade } from 'svelte/transition';
	import { quintOut, cubicOut } from 'svelte/easing';
	import { page } from '$app/state';
	import { defaultLocale } from '$lib/i18n';
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
	const df = $derived(
		new DateFormatter(page.data.locale || defaultLocale, {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		})
	);

	const isRestrictedDate = (date: DateValue) => date.compare(minBookableDate) < 0;

	function handleDayClick(e: MouseEvent | undefined, date: DateValue, month: DateValue) {
		const { start, end } = value;

		// --- 1. TOGGLE LOGIC (Clicking Start or End clears selection) ---
		// Case A: Clicking the exact Start Date (when only Start exists)
		if (start && !end && isSameDay(start, date)) {
			e?.preventDefault(); // Stop library from re-selecting
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
	<div
		class="border-iron/10 dark:border-limestone-100/10 flex h-14 items-center justify-between border-b-2 pb-4"
	>
		<h3 class="font-heading text-iron dark:text-limestone-50 text-2xl font-bold">
			{l.cal_dates_title}
		</h3>
		{#if value.start || value.end}
			<button
				onclick={onReset}
				transition:scale={{ duration: 200, start: 0.8, easing: cubicOut }}
				class="text-primary text-xs font-bold tracking-wider uppercase decoration-2 underline-offset-4 hover:underline"
			>
				{l.cal_btn_clear}
			</button>
		{/if}
	</div>

	<div
		class="calendar-container rounded-xl p-2 transition-all duration-300 {isInvalid
			? 'bg-red-50/30 ring-2 ring-red-500'
			: ''}"
	>
		<RangeCalendar.Root
			bind:value
			bind:placeholder
			{minValue}
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
						<RangeCalendar.GridRow class="mb-4 flex w-full justify-between">
							{#each weekdays as day, i (i)}
								<RangeCalendar.HeadCell
									class="calendar-weekday-header {i >= 5
										? 'text-primary'
										: 'text-iron/40 dark:text-limestone-400'}"
								>
									{day.slice(0, 2)}
								</RangeCalendar.HeadCell>
							{/each}
						</RangeCalendar.GridRow>
					</RangeCalendar.GridHead>
					<RangeCalendar.GridBody>
						{#each months as month (month.value.toString())}
							{#each month.weeks as week, i (i)}
								<RangeCalendar.GridRow class="mt-2 flex w-full justify-between">
									{#each week as date (date.toString())}
										<RangeCalendar.Cell {date} month={month.value} class="calendar-day-wrapper">
											<!-- @ts-ignore -->
											<RangeCalendar.Day
												{...{ date }}
												{...{ month: month.value }}
												onclick={(e) => handleDayClick(e, date, month.value)}
												onmouseenter={() => (hoveredDate = date)}
												onmouseleave={() => (hoveredDate = null)}
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
			<div
				class="bg-primary/10 dark:bg-primary/20 border-primary/20 group relative flex items-center gap-4 overflow-hidden rounded-2xl border p-5"
			>
				<!-- Decorative background pulse -->
				<div
					class="bg-primary/5 absolute -top-4 -right-4 h-24 w-24 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150"
				></div>

				<div
					class="dark:bg-iron text-primary border-primary/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border bg-white shadow-sm"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z"
						/>
					</svg>
				</div>

				<div class="min-w-0 flex-1">
					<span class="text-primary mb-0.5 block text-[10px] font-bold tracking-widest uppercase"
						>{l.cal_selection_dates_label}</span
					>
					<div class="flex flex-wrap items-baseline gap-x-2">
						<span
							class="text-iron dark:text-limestone-100 font-heading text-lg leading-tight font-bold"
						>
							{df.format(value.start.toDate(getLocalTimeZone()))}
						</span>
						{#if value.end && !isSameDay(value.start, value.end)}
							<span class="text-primary font-serif text-sm italic">{l.cal_selection_to}</span>
							<span
								class="text-iron dark:text-limestone-100 font-heading text-lg leading-tight font-bold"
							>
								{df.format(value.end.toDate(getLocalTimeZone()))}
							</span>
						{:else}
							<span class="text-primary/60 animate-pulse font-serif text-sm italic"
								>{l.cal_selection_placeholder_start}</span
							>
						{/if}
					</div>
				</div>

				{#if value.start && value.end && !isSameDay(value.start, value.end)}
					<div
						in:fade={{ delay: 200 }}
						class="bg-primary shadow-retro-primary border-iron-dark hidden flex-col items-center justify-center rounded-lg border px-4 py-2 text-white sm:flex"
					>
						<span class="text-xl leading-none font-bold">
							{Math.round(
								(value.end.toDate(getLocalTimeZone()).getTime() -
									value.start.toDate(getLocalTimeZone()).getTime()) /
									86400000
							)}
						</span>
						<span class="text-[8px] font-bold tracking-tighter uppercase">{l.cal_nights_unit}</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
