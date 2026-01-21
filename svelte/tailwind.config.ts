import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';
import typography from '@tailwindcss/typography';
import colors from 'tailwindcss/colors';

const config: Config = {
	darkMode: ['class'],
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				heading: ['"Playfair Display"', 'serif'],
				sans: ['"Lato"', 'sans-serif']
			},
			colors: {
				limestone: {
					50: '#fcfbf7', // Warm paper base
					100: '#f7f5ef',
					200: '#efead8',
					300: '#e4dcb8',
					400: '#d2c595',
					900: '#4a4538'
				},
				iron: {
					DEFAULT: '#2d2a2e',
					light: '#4a474b',
					muted: '#787579'
				},
				primary: {
					DEFAULT: '#f55677',
					light: '#ff8fa3',
					dark: '#d94462'
				}
			},
			// SINGULAR DESIGN: Hard Shadows
			boxShadow: {
				retro: '5px 5px 0px 0px rgba(45, 42, 46, 0.1)',
				'retro-hover': '8px 8px 0px 0px rgba(45, 42, 46, 0.15)',
				'retro-primary': '5px 5px 0px 0px #f55677',
				'retro-white': '5px 5px 0px 0px #ffffff',
				'retro-sm': '3px 3px 0px 0px rgba(45, 42, 46, 0.08)'
			},
			backgroundImage: {
				'paper-texture': "url('https://www.transparenttextures.com/patterns/cream-paper.png')"
			},
			typography: {
				DEFAULT: {
					css: {
						color: '#2d2a2e',
						fontFamily: '"Lato", sans-serif',
						h1: { fontFamily: '"Playfair Display", serif', color: '#2d2a2e' },
						h2: { fontFamily: '"Playfair Display", serif', color: '#2d2a2e' }
					}
				}
			}
		}
	},
	plugins: [tailwindcssAnimate, typography]
};

export default config;
