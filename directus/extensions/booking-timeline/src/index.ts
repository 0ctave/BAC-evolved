import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'booking-timeline',
	name: 'Timeline Réservations',
	icon: 'date_range',
	component: PanelComponent,
	minWidth: 12,
	minHeight: 12,

	options: [
		{
			field: 'roomsCollection',
			name: 'Collection Chambres',
			type: 'string',
			meta: {
				interface: 'system-collection',
				width: 'half',
			},
		},
		{
			field: 'bookingsCollection',
			name: 'Collection Réservations',
			type: 'string',
			meta: {
				interface: 'system-collection',
				width: 'half',
			},
		},
		{
			field: 'startDateField',
			name: 'Champ Date Arrivée',
			type: 'string',
			meta: {
				interface: 'system-field',
				options: {
					collectionField: 'bookingsCollection',
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
					collectionField: 'bookingsCollection',
					type: 'date',
				},
				width: 'half',
			},
		},
		{
			field: 'roomRefField',
			name: 'Champ Relation Chambre',
			type: 'string',
			meta: {
				interface: 'system-field',
				options: {
					collectionField: 'bookingsCollection',
				},
				width: 'half',
				note: "Le champ dans les réservations qui pointe vers la chambre"
			},
		},
		{
			field: 'clientField',
			name: 'Champ Relation Client',
			type: 'string',
			meta: {
				interface: 'system-field',
				options: {
					collectionField: 'bookingsCollection',
				},
				width: 'half',
				note: "Champ M2O vers le client (pour afficher nom/email)"
			},
		},
		{
			field: 'statusField',
			name: 'Champ Statut',
			type: 'string',
			meta: {
				interface: 'system-field',
				options: {
					collectionField: 'bookingsCollection',
				},
				width: 'half',
			},
		},
	],
});