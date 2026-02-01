import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'bac-timeline',
	name: 'Bordeaux à Coeur Timeline',
	icon: 'calendar_view_day',
	description: 'Professional hotel calendar with side-panel details.',
	component: PanelComponent,
	options: [
		{
			field: 'roomFilter',
			name: 'Filter by Room Name',
			type: 'string',
			meta: {
				interface: 'input',
				note: 'Leave empty for Combined View. Enter exact Room Name to filter.',
				//placeholder: 'e.g. La Chambre Louise'
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
				default_value: 21,
			},
		},
	],
	minWidth: 24, // Wider by default for calendar view
	minHeight: 12,
});