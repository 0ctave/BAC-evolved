<script lang="ts">
    import { booking } from '$lib/logic/booking.svelte';
    import { submitBooking } from '$lib/logic/submit';
    import StepSelector from './steps/StepSelector.svelte';
    import StepRoomCalendar from './steps/StepRoomCalendar.svelte';
    import StepCustomerDetails from './steps/StepCustomerDetails.svelte';
    import StepSummary from './steps/StepSummary.svelte';
    import { fade, fly, scale, slide } from 'svelte/transition';
    import { backOut, cubicOut, cubicIn } from 'svelte/easing';
    import Button from "$lib/components/blocks/Button.svelte";
    import { onMount } from 'svelte';
    import { defaultLocale } from "$lib/i18n";
    import { page } from "$app/state";

    interface Props {
        data: any; // We accept any structure since it contains dynamic labels
    }

    let { data }: Props = $props();

    let loading = $state(false);
    let error = $state("");
    let success = $state(false);
    let isLoaded = $state(false);

    let contentHeight = $state<number>(300);
    let headerHeight = $state<number>(0);
    let footerHeight = $state<number>(0);
    let successHeight = $state<number>(0);
    let direction = $state(1);

    // Sync labels from prop data to store
    $effect(() => {
        if (data) {
            booking.setLabels(data);
        }
    });

    // Use local alias for template
    const l = $derived(booking.labels);

    const stepsLabels = $derived([
        l.step_1_label,
        l.step_2_label,
        l.step_3_label,
        l.step_4_label
    ]);

    onMount(() => {
        isLoaded = true;
        return () => {
            booking.step = 0;
            if (typeof booking.reset === 'function') booking.reset();
        };
    });

    function goNext() {
        if (booking.canGoNext) {
            direction = 1;
            booking.nextStep();
        } else {
            booking.triggerValidation();
        }
    }

    function goPrev() {
        direction = -1;
        booking.prevStep();
    }

    function jumpToStep(i: number) {
        if (booking.step === i) return;
        direction = i > booking.step ? 1 : -1;
        if (booking.step > i) booking.step = i;
    }

    async function onFinalize() {
        loading = true;
        error = "";
        try {
            await submitBooking();
            success = true;
        } catch (e: any) {
            error = e.message || l.wizard_error_generic;
        } finally {
            loading = false;
        }
    }

    function handleGlobalClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (target.closest('button, input, select, textarea, a, label, [role="button"], .interactive')) return;
        booking.clearValidation();
    }

    let totalHeight = $derived.by(() => {
        if (success) return (successHeight || 400);
        const h = (headerHeight || 0) + (contentHeight || 0) + (footerHeight || 0);
        return h > 0 ? h : 400;
    });

    function slideFade(node: Element, { duration = 500, delay = 0, xDir = 1, easing = cubicOut }) {
        return {
            duration,
            delay,
            css: (t: number) => {
                const eased = easing(t);
                return `transform: translate3d(${(1 - eased) * 100 * xDir}%, 0, 0); opacity: ${t};`;
            }
        };
    }

    const currentSlug = $derived(page.data.langSlug || defaultLocale);

</script>

<svelte:window onclick={handleGlobalClick} />

<div class="w-full relative flex flex-col transition-all duration-500">
    {#if !isLoaded}
        <div class="absolute inset-0 flex items-center justify-center z-50 min-h-[400px]" out:fade={{ duration: 200 }}>
            <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
    {:else}
        <div class="w-full surface-atelier overflow-hidden relative flex flex-col transition-[height] duration-500 will-change-[height]"
             style="height: {totalHeight}px; transition-timing-function: cubic-bezier(0.25, 1, 0.5, 1);"
             in:fly|global={{ y: 30, duration: 600, delay: 100, easing: cubicOut }}>

            <div class="absolute top-0 left-0 right-0 h-1.5 bg-primary z-20"></div>

            {#if success}
                <div class="absolute top-0 left-0 w-full z-50 flex flex-col items-center justify-center py-12 px-6 text-center bg-[var(--background-color)]"
                     in:fade={{ duration: 300, delay: 100 }}
                     bind:clientHeight={successHeight}>
                    <div class="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center mb-8 shadow-retro-primary border-2 border-iron"
                         in:scale={{ duration: 400, delay: 0, easing: backOut, start: 0.5 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                    </div>
                    <h2 class="text-5xl font-heading text-iron dark:text-limestone-50 mb-6 italic" in:fly={{ y: 20, duration: 400, delay: 100 }}>
                        {l.wizard_success_title}
                    </h2>
                    <p class="text-body text-xl mb-12 font-light max-w-md mx-auto" in:fly={{ y: 20, duration: 400, delay: 200 }}>
                        {(l.wizard_success_desc || '').replace('{name}', booking.customer.prenom)}
                    </p>
                    <div in:fly={{ y: 20, duration: 400, delay: 300 }}>
                        <Button url={currentSlug === defaultLocale ? '/' : `/${currentSlug}`} variant="outline" label={l.wizard_btn_home} id="home" />
                    </div>
                </div>
            {:else}
                <div class="flex flex-col w-full h-full" out:fade={{ duration: 200 }}>
                    <div class="bg-limestone-50/50 dark:bg-[#2a292b] border-b-2 border-iron/5 dark:border-iron-light/30 pt-10 pb-6 px-4 sm:px-10 z-20 relative"
                         bind:clientHeight={headerHeight}>
                        <div class="flex justify-between items-center relative max-w-3xl mx-auto">
                            <div class="absolute top-1/2 left-0 w-full h-[2px] bg-iron/10 dark:bg-iron-light -z-0"></div>
                            {#each stepsLabels as label, i (i)}
                                <button class="relative z-10 flex flex-col items-center group focus:outline-none disabled:cursor-not-allowed"
                                        onclick={() => jumpToStep(i)}
                                        disabled={booking.step < i}>
                                    <div class="step-indicator transition-all duration-300 ease-out relative {booking.step === i ? 'active' : ''} {booking.step > i ? 'completed' : ''} {booking.step < i ? 'inactive' : ''}">
                                        {#if booking.step > i}
                                            <span in:scale={{ duration: 200, start: 0.5 }}>✓</span>
                                        {:else}
                                            <span>{i + 1}</span>
                                        {/if}
                                    </div>
                                    <span class="absolute -bottom-8 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-300 font-heading whitespace-nowrap {booking.step >= i ? 'text-iron dark:text-limestone-100 opacity-100' : 'text-iron/30 dark:text-iron-muted opacity-60'}">
                                        {label}
                                    </span>
                                </button>
                            {/each}
                        </div>
                        <div class="h-6"></div>
                    </div>

                    {#if error}
                        <div in:slide={{ axis: 'y' }} class="m-6 p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 text-red-800 dark:text-red-300 text-sm font-medium flex items-center gap-3">
                            <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                            {error}
                        </div>
                    {/if}

                    <div class="relative w-full overflow-hidden flex-1" style="height: {contentHeight}px; transition: height 500ms cubic-bezier(0.25, 1, 0.5, 1);">
                        {#key booking.step}
                            <div class="absolute top-0 left-0 w-full"
                                 in:slideFade={{ duration: 500, xDir: direction, easing: cubicOut }}
                                 out:slideFade={{ duration: 500, xDir: -direction, easing: cubicIn }}>
                                <div class="p-6 sm:p-12" bind:clientHeight={contentHeight}>
                                    {#if booking.step === 0} <StepSelector />
                                    {:else if booking.step === 1} <StepRoomCalendar/>
                                    {:else if booking.step === 2} <StepCustomerDetails/>
                                    {:else if booking.step === 3} <StepSummary/>
                                    {/if}
                                </div>
                            </div>
                        {/key}
                    </div>

                    <div class="mt-auto p-8 bg-limestone-50/50 dark:bg-[#2a292b] border-t-2 border-iron/5 dark:border-iron-light/30 flex justify-between items-center gap-4 z-20"
                         bind:clientHeight={footerHeight}>
                        <Button onClick={goPrev} disabled={booking.step === 0 || loading} variant="ghost" label={l.wizard_btn_back} icon="arrow_left" id="back" />

                        {#if booking.step > 0 && booking.step < 3}
                            <div in:fly={{ x: 10, duration: 300 }}>
                                <Button
                                        id="continuer"
                                        onClick={goNext}
                                        disabled={false}
                                        label={l.wizard_btn_continue}
                                        variant="dark"
                                        class={!booking.canGoNext ? "!bg-iron/20 !text-iron/40 dark:!bg-limestone-50/10 dark:!text-limestone-50/40 !shadow-none hover:!translate-y-0 hover:!shadow-none cursor-not-allowed" : ""}
                                />
                            </div>
                        {:else if booking.step === 3}
                            <button onclick={onFinalize} disabled={loading} class="btn-atelier-primary group relative overflow-hidden disabled:opacity-50">
                                {#if loading}
                                 <span class="flex items-center gap-2 relative z-10">
                                     <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                     {l.wizard_loading_validation}
                                 </span>
                                {:else}
                                    <span class="relative z-10">{l.wizard_btn_confirm}</span>
                                {/if}
                            </button>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>