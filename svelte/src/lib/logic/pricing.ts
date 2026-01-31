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
	appliedRules: { name: string; amount: number }[];
}

/**
 * Helper to handle parent-child overrides.
 */
function resolveOverrides(candidates: TarifsSpeciaux[]): TarifsSpeciaux[] {
	return candidates.filter((parentRule) => {
		const isOverridden = candidates.some((childRule) => {
			if (!childRule.parent) return false;

			const parentId =
				typeof childRule.parent === 'object' && childRule.parent !== null
					? (childRule.parent as any).id
					: childRule.parent;

			return String(parentId) === String(parentRule.id);
		});

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

	const ruleAggregator = new Map<string, number>();
	const startDateJS = start.toDate(getLocalTimeZone());
	const endDateJS = end.toDate(getLocalTimeZone());

	const durationInNights = Math.max(1, Math.round(
		(endDateJS.getTime() - startDateJS.getTime()) / (1000 * 60 * 60 * 24)
	));

	const totalPeople = context.adults + context.children;

	const checkGlobalConditions = (rule: TarifsSpeciaux) => {
		const ruleTypes = Array.isArray(rule.type) ? rule.type : [rule.type];

		if (ruleTypes.includes('parking') && !context.parking) return false;
		if (rule.duree_min && durationInNights < rule.duree_min) return false;
		if (rule.duree_max && durationInNights > rule.duree_max) return false;
		if (rule.personnes_min && totalPeople < rule.personnes_min) return false;
		if (rule.personnes_max && totalPeople > rule.personnes_max) return false;

		if (rule.chambres_concernees?.length && context.roomId) {
			const targetId = String(context.roomId);
			const isIncluded = (rule.chambres_concernees as any[]).some(
				(item: TarifsSpeciauxChambre | string | number) => {
					if (typeof item === 'string' || typeof item === 'number') {
						return String(item) === targetId;
					}
					if (item && typeof item === 'object' && 'chambres_id' in item) {
						const cId = typeof item.chambres_id === 'object' && item.chambres_id !== null && 'id' in item.chambres_id
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

	const contextValidRules = rules.filter(checkGlobalConditions);

	while (current.compare(end) < 0) {
		const isoDate = current.toString();
		const jsDate = current.toDate(getLocalTimeZone());
		let dayOfWeekIndex = jsDate.getDay();
		if (dayOfWeekIndex === 0) dayOfWeekIndex = 7;
		const dayOfWeekStr = String(dayOfWeekIndex);

		let nightlyPrice = basePricePerNight;
		const adjustments: { name: string; amount: number }[] = [];

		const nightlyCandidates = contextValidRules.filter((rule) => {
			const ruleTypes = Array.isArray(rule.type) ? rule.type : [rule.type];
			const appliesNightly = ruleTypes.some(t => ['pourcentage', 'fix_nuit', 'parking'].includes(t));

			if (!appliesNightly) return false;
			if (rule.date_debut && rule.date_fin && (isoDate < rule.date_debut || isoDate > rule.date_fin)) return false;

			if (rule.jours_application) {
				const days = Array.isArray(rule.jours_application) ? rule.jours_application : [rule.jours_application];
				if (!days.map(String).includes(dayOfWeekStr)) return false;
			}

			return true;
		});

		const activeNightlyRules = resolveOverrides(nightlyCandidates);

		for (const rule of activeNightlyRules) {
			const ruleTypes = Array.isArray(rule.type) ? rule.type : [rule.type];
			let amount = 0;

			if (ruleTypes.includes('pourcentage')) {
				amount += (basePricePerNight * (rule.valeur || 0)) / 100;
			}
			if (ruleTypes.includes('fix_nuit')) {
				amount += (rule.valeur || 0);
			}
			if (ruleTypes.includes('parking')) {
				amount += (rule.valeur || 0);
			}

			amount = Math.round(amount * 100) / 100;

			if (amount !== 0) {
				nightlyPrice += amount;
				adjustments.push({ name: rule.nom, amount });
				ruleAggregator.set(rule.nom, (ruleAggregator.get(rule.nom) || 0) + amount);
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

	const stayCandidates = contextValidRules.filter((rule) => {
		const ruleTypes = Array.isArray(rule.type) ? rule.type : [rule.type];
		if (!ruleTypes.includes('fixe_sejour')) return false;

		if (rule.date_debut && rule.date_fin) {
			const startISO = start.toString();
			if (startISO < rule.date_debut || startISO > rule.date_fin) return false;
		}
		return true;
	});

	const activeStayRules = resolveOverrides(stayCandidates);

	for (const rule of activeStayRules) {
		const val = rule.valeur || 0;
		total += val;
		ruleAggregator.set(rule.nom, (ruleAggregator.get(rule.nom) || 0) + val);
	}

	return {
		total: Math.round(total * 100) / 100,
		baseTotal: Math.round(baseTotal * 100) / 100,
		details,
		appliedRules: Array.from(ruleAggregator.entries()).map(([name, amount]) => ({
			name,
			amount: Math.round(amount * 100) / 100
		}))
	};
}