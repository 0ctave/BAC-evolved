<script lang="ts">
	import { Calendar } from 'bits-ui';
	import {
		getLocalTimeZone,
		today,
		isSameDay,
		DateFormatter,
		CalendarDate,
		getDayOfWeek
	} from '@internationalized/date';
	import type { DateValue } from '@internationalized/date';
	import { scale, slide } from 'svelte/transition';
	import { quintOut, cubicOut } from 'svelte/easing';
	import { page } from '$app/state';
	import { defaultLocale } from '$lib/i18n';
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

	const df = $derived(
		new DateFormatter(page.data.locale || defaultLocale, {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		})
	);

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
	<div
		class="border-iron/10 dark:border-limestone-100/10 flex h-14 items-center justify-between border-b-2 pb-4"
	>
		<h3 class="font-heading text-iron dark:text-limestone-50 text-2xl font-bold">
			{l.cal_tour_title || 'Date de visite'}
		</h3>
		{#if value}
			<button
				onclick={onReset}
				transition:scale={{ duration: 200, start: 0.8, easing: cubicOut }}
				type="button"
				class="text-primary text-xs font-bold tracking-wider uppercase decoration-2 underline-offset-4 hover:underline"
			>
				{l.cal_btn_clear || 'Effacer'}
			</button>
		{/if}
	</div>

	<div
		class="calendar-container dark:bg-iron/5 border-iron/5 rounded-xl border bg-white p-2 transition-all duration-300 {isInvalid
			? 'bg-red-50/30 ring-2 ring-red-500'
			: ''}"
	>
		<!-- @ts-ignore -->
		<Calendar.Root
			{...{ value }}
			{...{ type: 'single' }}
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
						<Calendar.GridRow class="mb-4 flex w-full justify-between">
							{#each weekdays as day, i (i)}
								<Calendar.HeadCell
									class="calendar-weekday-header {i >= 5
										? 'text-primary'
										: 'text-iron/40 dark:text-limestone-400'}"
								>
									{day.slice(0, 2)}
								</Calendar.HeadCell>
							{/each}
						</Calendar.GridRow>
					</Calendar.GridHead>
					<Calendar.GridBody>
						{#each months as month (month.value.toString())}
							{#each month.weeks as week, i (i)}
								<Calendar.GridRow class="mt-2 flex w-full justify-between">
									{#each week as date (date.toString())}
										{@const hasActivity = availableDates.has(date.toString())}
										{@const isSelected = value && isSameDay(date, value)}

										<Calendar.Cell {date} month={month.value} class="calendar-day-wrapper">
											<!-- @ts-ignore -->
											<Calendar.Day
												{...{ date }}
												{...{ month: month.value }}
												onclick={(e) => handleDayClick(e, date)}
												class="group calendar-day relative transition-all duration-300 {cellClasses[
													date.toString()
												] || ''}"
											>
												<div class="relative flex h-full w-full items-center justify-center">
													<span
														class="z-10 text-sm font-bold transition-transform group-hover:scale-110 {isSelected
															? 'text-white'
															: ''}"
													>
														{date.day}
													</span>

													{#if hasActivity}
														<div
															class="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full transition-all
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
			<div
				class="bg-primary/10 dark:bg-primary/20 border-primary/20 group relative flex items-center gap-4 overflow-hidden rounded-2xl border p-5"
			>
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
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				</div>

				<div class="min-w-0 flex-1">
					<span class="text-primary mb-0.5 block text-[10px] font-bold tracking-widest uppercase"
						>{l.cal_selection_dates_label || 'Date de visite'}</span
					>
					<span
						class="text-iron dark:text-limestone-100 font-heading text-lg leading-tight font-bold uppercase"
					>
						{df.format(value.toDate(tz))}
					</span>
				</div>
			</div>
		</div>
	{/if}
</div>
