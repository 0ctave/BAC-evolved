import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'bac-pending-list',
	name: 'Pending Reservations',
	icon: 'playlist_add_check',
	description: 'List of pending bookings with quick confirm action.',
	component: PanelComponent,
	options: [
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
			field: 'startDateField',
			name: 'Date Arrivée',
			type: 'string',
			meta: {
				interface: 'system-field',
				options: { collectionField: 'bookingCollection', type: 'date' },
				width: 'half',
			},
		},
		{
			field: 'endDateField',
			name: 'Date Départ',
			type: 'string',
			meta: {
				interface: 'system-field',
				options: { collectionField: 'bookingCollection', type: 'date' },
				width: 'half',
			},
		},
	],
	minWidth: 12,
	minHeight: 12,
});