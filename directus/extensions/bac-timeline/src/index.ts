import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'hotel-timeline',
	name: 'Hotel Calendar',
	icon: 'calendar_month',
	description: 'Monthly calendar view with combined and split modes.',
	component: PanelComponent,
	options: [
		// --- Collections ---
		{
			field: 'bookingCollection',
			name: 'Collection Réservations',
			type: 'string',
			meta: {
				interface: 'system-collection',
				options: { includeSystem: false },
				width: 'half',
			},
		},
		{
			field: 'roomCollection',
			name: 'Collection Chambres',
			type: 'string',
			meta: {
				interface: 'system-collection',
				options: { includeSystem: false },
				width: 'half',
			},
		},
		// --- Fields (Dynamic Dropdowns) ---
		{
			field: 'startDateField',
			name: 'Champ Date Arrivée',
			type: 'string',
			meta: {
				interface: 'system-field',
				options: {
					collectionField: 'bookingCollection',
					type: 'date',
				},
				width: 'half',
			},
		},
		{
			field: 'endDateField',
			name: 'Champ Date Départ',
			type: 'string',
			meta: {
				interface: 'system-field',
				options: {
					collectionField: 'bookingCollection',
					type: 'date',
				},
				width: 'half',
			},
		},
		{
			field: 'roomFieldName',
			name: 'Relation Chambre',
			type: 'string',
			meta: {
				interface: 'system-field',
				options: {
					collectionField: 'bookingCollection',
				},
				width: 'half',
				note: "Le champ qui lie la réservation à la chambre"
			},
		},
		{
			field: 'clientField',
			name: 'Relation Client',
			type: 'string',
			meta: {
				interface: 'system-field',
				options: {
					collectionField: 'bookingCollection',
				},
				width: 'half',
			},
		},
		{
			field: 'statusField',
			name: 'Champ Statut',
			type: 'string',
			meta: {
				interface: 'system-field',
				options: {
					collectionField: 'bookingCollection',
				},
				width: 'half',
			},
		},
		// --- Room Details ---
		{
			field: 'roomNameField',
			name: 'Nom de la Chambre',
			type: 'string',
			meta: {
				interface: 'system-field',
				options: {
					collectionField: 'roomCollection',
				},
				width: 'half',
				note: "Champ dans la collection Chambre"
			},
		},
		// --- Display Options ---
		{
			field: 'roomFilter',
			name: 'Filtrer par Chambre (Mode Split)',
			type: 'string',
			meta: {
				interface: 'input',
				width: 'full',
				note: 'Entrez le nom exact de la chambre pour créer un calendrier dédié à cette chambre.'
			},
		},
	],
	minWidth: 24,
	minHeight: 24, // Taller default for calendar
});