import { CalendarDate, getLocalTimeZone } from '@internationalized/date';
import type { TarifsSpeciaux, TarifsSpeciauxChambre } from '../types/directus-schema';

export interface NightDetail {
	date: string; // ISO
	basePrice: number;
	finalPrice: number;
	adjustments: { name: string; amount: number }[];
}

export interface PricingResult {
	total: number;
	baseTotal: number;
	details: NightDetail[];
	// Returns an array of objects with the total amount per rule for display
	appliedRules: { name: string; amount: number }[];
}

/**
 * Helper to handle parent-child overrides.
 * If both Parent and Child are in the list of candidates, Parent is removed.
 */
function resolveOverrides(candidates: TarifsSpeciaux[]): TarifsSpeciaux[] {
	return candidates.filter((parentRule) => {
		const isOverridden = candidates.some((childRule) => {
			if (!childRule.parent) return false;

			// Handle Directus relation (could be ID or Object)
			const parentId =
				typeof childRule.parent === 'object' && childRule.parent !== null
					? (childRule.parent as any).id
					: childRule.parent;

			// Loose equality to handle number vs string IDs
			return parentId == parentRule.id;
		});

		// Keep the rule only if it is NOT overridden by any other candidate
		return !isOverridden;
	});
}

/**
 * Calcule le prix détaillé d'un séjour en utilisant les règles Directus
 */
export function calculateStayPrice(
	basePricePerNight: number,
	start: CalendarDate,
	end: CalendarDate,
	rules: TarifsSpeciaux[],
	context: {
		adults: number;
		children: number;
		parking: boolean;
		roomId: string | number | null;
	}
): PricingResult {
	let current = start;
	const details: NightDetail[] = [];
	let total = 0;
	let baseTotal = 0;

	// Map to aggregate totals per rule name (e.g. "Long Stay": -50)
	const ruleAggregator = new Map<string, number>();

	const startDateJS = start.toDate(getLocalTimeZone());
	const endDateJS = end.toDate(getLocalTimeZone());

	// Calculate duration in nights (safe calculation)
	const durationInNights = Math.round(
		(endDateJS.getTime() - startDateJS.getTime()) / (1000 * 60 * 60 * 24)
	);

	const totalPeople = context.adults + context.children;

	// Fonction utilitaire pour vérifier si une règle s'applique globalement (hors date)
	const checkGlobalConditions = (rule: TarifsSpeciaux) => {
		// Ensure types is an array (defensive programming, though interface says it is)
		const ruleTypes = Array.isArray(rule.type) ? rule.type : [rule.type];

		// 1. Filtre Parking:
		// Check if 'parking' is in the type array.
		// If it IS a parking rule, but user didn't select parking -> Exclude it.
		if (ruleTypes.includes('parking') && !context.parking) return false;

		// 2. Filtre Durée
		if (rule.duree_min && durationInNights < rule.duree_min) return false;
		if (rule.duree_max && durationInNights > rule.duree_max) return false;

		// 3. Filtre Personnes
		if (rule.personnes_min && totalPeople < rule.personnes_min) return false;
		if (rule.personnes_max && totalPeople > rule.personnes_max) return false;

		// 4. Filtre Chambres Concernées
		if (rule.chambres_concernees && rule.chambres_concernees.length > 0 && context.roomId) {
			const targetId = String(context.roomId);

			// We need to check if the current room ID exists in the intermediate table
			const isIncluded = (rule.chambres_concernees as any[]).some(
				(item: TarifsSpeciauxChambre | string) => {
					// Handle if it's just an ID string (unlikely in M2M but possible in specific setups)
					if (typeof item === 'string' || typeof item === 'number') {
						return String(item) === targetId;
					}

					// Handle object: check intermediate table 'chambres_id'
					if (typeof item === 'object' && item !== null && 'chambres_id' in item) {
						// Handle if 'chambres_id' is expanded object or just ID
						const cId =
							typeof item.chambres_id === 'object' &&
							item.chambres_id !== null &&
							'id' in item.chambres_id
								? (item.chambres_id as any).id
								: item.chambres_id;

						return String(cId) === targetId;
					}
					return false;
				}
			);

			if (!isIncluded) return false;
		}

		return true;
	};

	// Optimization: Pre-filter rules that match global context (Duration, Room, etc.)
	const contextValidRules = rules.filter(checkGlobalConditions);

	// --- 1. Calcul jour par jour ---
	while (current.compare(end) < 0) {
		const isoDate = current.toString();
		const jsDate = current.toDate(getLocalTimeZone());
		let dayOfWeekIndex = jsDate.getDay();
		if (dayOfWeekIndex === 0) dayOfWeekIndex = 7; // 1=Mon, 7=Sun
		const dayOfWeekStr = String(dayOfWeekIndex);

		let nightlyPrice = basePricePerNight;
		const adjustments: { name: string; amount: number }[] = [];

		// Step A: Find all POTENTIAL rules for this specific night
		const nightlyCandidates = contextValidRules.filter((rule) => {
			const ruleTypes = Array.isArray(rule.type) ? rule.type : [rule.type];

			// Include standard modifiers AND specific nightly charges like tax/parking
			const appliesNightly =
				ruleTypes.includes('pourcentage') ||
				ruleTypes.includes('fix_nuit') ||
				// ruleTypes.includes('taxe_sejour') || // Removed: Tax is included in base price
				ruleTypes.includes('parking');

			if (!appliesNightly) return false;

			// Date Range Check
			if (rule.date_debut && rule.date_fin) {
				if (isoDate < rule.date_debut || isoDate > rule.date_fin) return false;
			}

			// Day of Week Check
			if (rule.jours_application) {
				if (Array.isArray(rule.jours_application)) {
					if (!rule.jours_application.includes(dayOfWeekStr as any)) return false;
				} else {
					if (rule.jours_application !== dayOfWeekStr) return false;
				}
			}

			return true;
		});

		// Step B: Resolve Overrides (Remove parents if child is present)
		const activeNightlyRules = resolveOverrides(nightlyCandidates);

		// Step C: Apply Price Changes
		for (const rule of activeNightlyRules) {
			const ruleTypes = Array.isArray(rule.type) ? rule.type : [rule.type];
			let amount = 0;

			// --- Logic for different rule types ---

			// 1. Percentage (e.g. -10% promo)
			if (ruleTypes.includes('pourcentage')) {
				amount += (basePricePerNight * rule.valeur) / 100;
			}

			// 2. Fixed Nightly Amount (e.g. +20€ High Season)
			if (ruleTypes.includes('fix_nuit')) {
				amount += rule.valeur;
			}

			// 3. Tourist Tax (Per Adult / Per Night)
			// REMOVED: Taxe de séjour is included in the base price as per user request.
			/*
			if (ruleTypes.includes('taxe_sejour')) {
				amount += rule.valeur * context.adults;
			}
			*/

			// 4. Parking (Per Night)
			if (ruleTypes.includes('parking')) {
				// Global filter already checked context.parking, so we just add the val
				amount += rule.valeur;
			}

			// Round to 2 decimals to prevent floating point drift
			amount = Math.round(amount * 100) / 100;

			if (amount !== 0) {
				nightlyPrice += amount;
				adjustments.push({ name: rule.nom, amount });

				// Aggregate amount for summary
				const currentTotal = ruleAggregator.get(rule.nom) || 0;
				ruleAggregator.set(rule.nom, currentTotal + amount);
			}
		}

		details.push({
			date: isoDate,
			basePrice: basePricePerNight,
			finalPrice: nightlyPrice,
			adjustments
		});

		baseTotal += basePricePerNight;
		total += nightlyPrice;
		current = current.add({ days: 1 });
	}

	// --- 2. Application des règles "Une fois par séjour" ---

	// Step A: Find potential Stay rules
	const stayCandidates = contextValidRules.filter((rule) => {
		const ruleTypes = Array.isArray(rule.type) ? rule.type : [rule.type];
		if (!ruleTypes.includes('fixe_sejour')) return false;

		// For fixed stay fees with dates, check if START of stay is within range
		if (rule.date_debut && rule.date_fin) {
			const startISO = start.toString();
			if (startISO < rule.date_debut || startISO > rule.date_fin) return false;
		}

		return true;
	});

	// Step B: Resolve Overrides
	const activeStayRules = resolveOverrides(stayCandidates);

	// Step C: Apply
	for (const rule of activeStayRules) {
		total += rule.valeur;

		// Aggregate amount
		const currentTotal = ruleAggregator.get(rule.nom) || 0;
		ruleAggregator.set(rule.nom, currentTotal + rule.valeur);
	}

	// Convert Map to Array for UI
	const appliedRulesArray = Array.from(ruleAggregator.entries()).map(([name, amount]) => ({
		name,
		amount: Math.round(amount * 100) / 100
	}));

	return {
		total: Math.round(total * 100) / 100,
		baseTotal: Math.round(baseTotal * 100) / 100,
		details,
		appliedRules: appliedRulesArray
	};
}
