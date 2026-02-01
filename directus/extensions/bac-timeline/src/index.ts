import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'bac-timeline',
	name: 'Bordeaux à Coeur Timeline',
	icon: 'calendar_view_day',
	description: 'A Gantt-style timeline for hotel bookings.',
	component: PanelComponent,
	options: [
		{
			field: 'collection',
			name: 'Collection',
			type: 'string',
			meta: {
				interface: 'system-collection',
				options: {
					includeSystem: false,
				},
			},
		},
		{
			field: 'daysToShow',
			name: 'Days to Show',
			type: 'integer',
			meta: {
				interface: 'input',
			},
			schema: {
				default_value: 14,
			},
		},
	],
	minWidth: 12,
	minHeight: 10,
});