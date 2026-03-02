import { defineModule } from '@directus/extensions-sdk';
import ModuleComponent from './module.vue';

export default defineModule({
	id: 'bac-dashboard',
	name: 'Tableau de bord',
	icon: 'other_houses',
	routes: [
		{
			path: '',
			component: ModuleComponent,
		},
	],
});
