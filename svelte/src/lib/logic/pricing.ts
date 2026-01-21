import { CalendarDate, getLocalTimeZone } from '@internationalized/date';
import type { TarifsSpeciaux } from '../types/directus-schema';

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
			const parentId = (typeof childRule.parent === 'object' && childRule.parent !== null)
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
	const durationInNights = Math.round(
		(endDateJS.getTime() - startDateJS.getTime()) / (1000 * 60 * 60 * 24)
	);

	const totalPeople = context.adults + context.children;

	// Fonction utilitaire pour vérifier si une règle s'applique globalement (hors date)
	const checkGlobalConditions = (rule: TarifsSpeciaux) => {
		// 1. Filtre Parking
		if (rule.parking && !context.parking) return false;

		// 2. Filtre Durée
		if (rule.duree_min && durationInNights < rule.duree_min) return false;
		if (rule.duree_max && durationInNights > rule.duree_max) return false;

		// 3. Filtre Personnes
		if (rule.personnes_min && totalPeople < rule.personnes_min) return false;
		if (rule.personnes_max && totalPeople > rule.personnes_max) return false;

		// 4. Filtre Chambres Concernées
		if (rule.chambres_concernees && rule.chambres_concernees.length > 0 && context.roomId) {
			const targetId = String(context.roomId);
			const isIncluded = rule.chambres_concernees.some((item: any) => {
				if (typeof item === 'object' && item !== null && 'chambres_id' in item) {
					return String(item.chambres_id) === targetId;
				}
				return String(item) === targetId;
			});

			if (!isIncluded) return false;
		}

		return true;
	};

	// Optimization: Pre-filter rules that match global context (Duration, Room, etc.)
	// This avoids checking non-applicable rules inside the loop
	const contextValidRules = rules.filter(checkGlobalConditions);

	// --- 1. Calcul jour par jour ---
	while (current.compare(end) < 0) {
		const isoDate = current.toString();
		const jsDate = current.toDate(getLocalTimeZone());
		let dayOfWeekIndex = jsDate.getDay();
		if (dayOfWeekIndex === 0) dayOfWeekIndex = 7;
		const dayOfWeekStr = String(dayOfWeekIndex);

		let nightlyPrice = basePricePerNight;
		const adjustments: { name: string; amount: number }[] = [];

		// Step A: Find all POTENTIAL rules for this specific night
		const nightlyCandidates = contextValidRules.filter(rule => {
			const ruleTypes = Array.isArray(rule.type) ? rule.type : [rule.type];
			const appliesNightly = ruleTypes.includes('pourcentage') || ruleTypes.includes('fix_nuit');

			if (!appliesNightly) return false;

			// Date Range Check
			if (rule.date_debut && rule.date_fin) {
				if (isoDate < rule.date_debut || isoDate > rule.date_fin) return false;
			}

			// Day of Week Check
			if (rule.jours_application && rule.jours_application.length > 0) {
				// @ts-ignore
				if (!rule.jours_application.includes(dayOfWeekStr)) return false;
			}

			return true;
		});

		// Step B: Resolve Overrides (Remove parents if child is present)
		const activeNightlyRules = resolveOverrides(nightlyCandidates);

		// Step C: Apply Price Changes
		for (const rule of activeNightlyRules) {
			const ruleTypes = Array.isArray(rule.type) ? rule.type : [rule.type];
			let amount = 0;

			if (ruleTypes.includes('pourcentage')) {
				amount += (basePricePerNight * rule.valeur) / 100;
			}
			if (ruleTypes.includes('fix_nuit')) {
				amount += rule.valeur;
			}

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
	const stayCandidates = contextValidRules.filter(rule => {
		const ruleTypes = Array.isArray(rule.type) ? rule.type : [rule.type];
		if (!ruleTypes.includes('fixe_sejour')) return false;

		// For fixed stay fees with dates, we usually check if the START of the stay is within range
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