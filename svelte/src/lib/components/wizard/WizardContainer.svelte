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

    let loading = $state(false);
    let error = $state("");
    let success = $state(false);
    let isLoaded = $state(false);

    // Height tracking
    let contentHeight = $state<number>(300);
    let headerHeight = $state<number>(0);
    let footerHeight = $state<number>(0);
    let successHeight = $state<number>(0);

    // Navigation Direction: 1 = Next (Right to Left), -1 = Back (Left to Right)
    let direction = $state(1);

    interface Props {
        data: {
            step_1_label: string;
            step_2_label: string;
            step_3_label: string;
            step_4_label: string;
        };
    }

    let { data }: Props = $props();

    const stepsLabels = $derived([
        data.step_1_label,
        data.step_2_label,
        data.step_3_label,
        data.step_4_label
    ]);

    onMount(() => {
        isLoaded = true;

        // Cleanup function: This runs when the component is destroyed (user leaves the page)
        return () => {
            // Reset the step to the beginning
            booking.step = 0;

            // If your booking logic has a reset method for data (dates, customer info), call it here.
            // This ensures the next reservation starts fresh.
            if (typeof booking.reset === 'function') {
                booking.reset();
            }
        };
    });

    // Custom Navigation Wrappers to track Direction
    function goNext() {
        direction = 1;
        booking.nextStep();
    }

    function goPrev() {
        direction = -1;
        booking.prevStep();
    }

    function jumpToStep(i: number) {
        direction = i > booking.step ? 1 : -1;
        if(booking.step > i) booking.step = i;
    }

    async function onFinalize() {
        loading = true;
        error = "";
        try {
            await submitBooking();
            success = true;
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    // Dynamic Total Height Calculation
    // Calculates the exact height the container should be based on what is currently visible
    let totalHeight = $derived.by(() => {
        if (success) {
            // If success, we just need the success message height
            return (successHeight || 400);
        }
        // Otherwise: Header + Content + Footer
        const h = (headerHeight || 0) + (contentHeight || 0) + (footerHeight || 0);
        return h > 0 ? h : 400;
    });

    // Custom Transition: Directional Slide (Carousel Effect)
    // We pass the easing function explicitly to ensure Enter and Exit velocities match perfectly
    function slideFade(node: Element, { duration = 500, delay = 0, xDir = 1, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;

        return {
            duration,
            delay,
            css: (t: number) => {
                // Apply the easing passed in arguments
                const eased = easing(t);

                // xDir=1 (Next): Enter from Right (100% -> 0), Exit to Left (0 -> -100%)
                // xDir=-1 (Prev): Enter from Left (-100% -> 0), Exit to Right (0 -> 100%)
                // We kept opacity: 1 to prevent "ghosting" seams between the two sliding cards
                return `
                    transform: ${transform} translate3d(${(1 - eased) * 100 * xDir}%, 0, 0);
                `;
            }
        };
    }

    const currentSlug = $derived(page.data.langSlug || defaultLocale);
</script>

<div class="w-full relative flex flex-col duration-500 ease-in-out">

    {#if !isLoaded}
        <!-- Loading State -->
        <div class="absolute inset-0 flex items-center justify-center z-50 min-h-[400px]"
             out:fade={{ duration: 200 }}>
            <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    {:else}
        <!--
            Main Container
            Applied 'surface-atelier' to match your design system.
            The height transition here ensures the 'card' resizes smoothly around the content.
        -->
        <div class="w-full surface-atelier overflow-hidden relative flex flex-col transition-[height] duration-500 will-change-[height]"
             style="height: {totalHeight}px; transition-timing-function: cubic-bezier(0.25, 1, 0.5, 1);"
             in:fly|global={{ y: 30, duration: 600, delay: 100, easing: cubicOut }}>

            <!-- Accent Line -->
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-primary z-20"></div>

            {#if success}
                <!-- SUCCESS VIEW -->
                <!--
                   CHANGED: Removed 'inset-0' and replaced with 'top-0 left-0 w-full'.
                   Why? 'inset-0' forces the div to be as tall as the parent.
                   bind:clientHeight then reads that forced height, telling the parent to stay that tall.
                   By using 'top-0 left-0 w-full', this div only takes the height of its content.
                   The parent then reads this smaller height and shrinks to fit.
                -->
                <div class="absolute top-0 left-0 w-full z-50 flex flex-col items-center justify-center py-12 px-6 text-center bg-[var(--background-color)]"
                     in:fade={{ duration: 300, delay: 100 }}
                     bind:clientHeight={successHeight}>

                    <div class="relative">
                        <div class="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-retro-primary border-2 border-iron"
                             in:scale={{ duration: 400, delay: 0, easing: backOut, start: 0.5 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                    </div>


                    <h2 class="text-5xl font-heading text-iron dark:text-limestone-50 mb-6 italic"
                        in:fly={{ y: 20, duration: 400, delay: 100 }}>
                        C'est noté.
                    </h2>

                    <p class="text-body text-xl mb-12 font-light max-w-md mx-auto"
                       in:fly={{ y: 20, duration: 400, delay: 200 }}>
                        Merci <span class="text-primary font-bold">{booking.customer.prenom}</span>, préparez vos valises, Bordeaux vous attend.
                    </p>

                    <div in:fly={{ y: 20, duration: 400, delay: 300 }}>
                        <Button url={currentSlug === defaultLocale ? '/' : `/${currentSlug}`} variant="outline" label="Retour à l'accueil" id="home" />
                    </div>
                </div>
            {:else}

                <!-- CONTENT CONTAINER (Header + Content + Footer) -->
                <div class="flex flex-col w-full h-full" out:fade={{ duration: 200 }}>

                    <!-- Navigation Header -->
                    <div class="bg-limestone-50/50 dark:bg-[#2a292b] border-b-2 border-iron/5 dark:border-iron-light/30 pt-10 pb-6 px-4 sm:px-10 z-20 relative"
                         bind:clientHeight={headerHeight}>
                        <div class="flex justify-between items-center relative max-w-3xl mx-auto">
                            <!-- Background Line -->
                            <div class="absolute top-1/2 left-0 w-full h-[2px] bg-iron/10 dark:bg-iron-light -z-0"></div>

                            {#each stepsLabels as label, i}
                                <button
                                        class="relative z-10 flex flex-col items-center group focus:outline-none"
                                        onclick={() => jumpToStep(i)}
                                        disabled={booking.step < i}
                                >
                                    <!-- Step Circle using your 'step-indicator' class -->
                                    <div class="step-indicator transition-all duration-300 ease-out relative
                                    {booking.step === i ? 'active' : ''}
                                    {booking.step > i ? 'completed' : ''}
                                    {booking.step < i ? 'inactive' : ''}"
                                    >
                                        {#if booking.step > i}
                                            <span in:scale={{ duration: 200, start: 0.5 }}
                                                  class="absolute inset-0 flex items-center justify-center">✓</span>
                                        {:else}
                                            <span class="absolute inset-0 flex items-center justify-center">{i + 1}</span>
                                        {/if}
                                    </div>

                                    <span class="absolute -bottom-8 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-300 font-heading
                                    {booking.step >= i ? 'text-iron dark:text-limestone-100 translate-y-0 opacity-100' : 'text-iron/30 dark:text-iron-muted translate-y-1 opacity-60'}">
                                        {label}
                                    </span>
                                </button>
                            {/each}
                        </div>
                        <div class="h-6"></div>
                    </div>

                    <!-- Error Message -->
                    {#if error}
                        <div in:slide={{ axis: 'y' }}
                             class="m-6 p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 text-red-800 dark:text-red-300 text-sm font-medium flex items-center gap-3">
                            <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                            {error}
                        </div>
                    {/if}

                    <!-- Steps Content Wrapper -->
                    <!-- The wrapper animates its height to match contentHeight (which comes from the active step) -->
                    <div class="relative w-full overflow-hidden flex-1"
                         style="height: {contentHeight}px; transition: height 500ms cubic-bezier(0.25, 1, 0.5, 1);">

                        {#key booking.step}
                            <!--
                                KEY CHANGE:
                                'in' uses cubicOut (Fast arrival)
                                'out' uses cubicIn (Fast departure)
                                This syncs the movement perfectly.
                            -->
                            <div class="absolute top-0 left-0 w-full"
                                 in:slideFade={{ duration: 500, xDir: direction, easing: cubicOut }}
                                 out:slideFade={{ duration: 500, xDir: -direction, easing: cubicIn }}>

                                <div class="p-6 sm:p-12" bind:clientHeight={contentHeight}>
                                    {#if booking.step === 0}
                                        <StepSelector/>
                                    {:else if booking.step === 1}
                                        <StepRoomCalendar/>
                                    {:else if booking.step === 2}
                                        <StepCustomerDetails/>
                                    {:else if booking.step === 3}
                                        <StepSummary/>
                                    {/if}
                                </div>
                            </div>
                        {/key}
                    </div>

                    <!-- Footer Actions -->
                    <div class="mt-auto p-8 bg-limestone-50/50 dark:bg-[#2a292b] border-t-2 border-iron/5 dark:border-iron-light/30 flex justify-between items-center gap-4 z-20"
                         bind:clientHeight={footerHeight}>
                        <Button
                                onClick={goPrev}
                                disabled={booking.step === 0 || loading}
                                variant="ghost"
                                label="Retour"
                                icon="arrow_left"
                                id="back">
                        </Button>
                        {#if booking.step < 3}
                            <div in:fly={{ x: 10, duration: 300 }}>
                                <Button
                                        id="continuer"
                                        onClick={goNext}
                                        disabled={!booking.canGoNext}
                                        label="Continuer"
                                        variant="dark"
                                >
                                </Button>
                            </div>
                        {:else}
                            <button
                                    onclick={onFinalize}
                                    disabled={loading}
                                    class="btn-atelier-primary group relative overflow-hidden"
                            >
                                {#if loading}
                                 <span class="flex items-center gap-2 relative z-10">
                                     <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                     Validation...
                                 </span>
                                {:else}
                                    <span class="relative z-10">Confirmer la réservation</span>
                                {/if}
                            </button>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>