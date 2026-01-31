
export interface ExtensionSeoMetadata {
    title?: string;
    meta_description?: string;
    og_image?: string;
    additional_fields?: Record<string, unknown>;
    sitemap?: {
        change_frequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
        priority: string;
    };
    no_index?: boolean;
    no_follow?: boolean;
}

export interface AiPrompt {
	/** @primaryKey */
	id: string;
	sort?: number | null;
	/** @description Unique name for the prompt. Use names like "create-article" or "generate-product-description". @required */
	name: string;
	/** @description Is this prompt published and available to use? */
	status?: 'draft' | 'in_review' | 'published';
	/** @description Briefly explain what this prompt does in 1-2 sentences. */
	description?: string | null;
	/** @description Optional: Define the conversation structure between users and AI. Used to add context and improve outputs. */
	messages?: Array<{ role: 'user' | 'assistant'; text: string }> | null;
	/** @description Instructions that shape how the AI responds. */
	system_prompt?: string | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
}

export interface BlockBooking {
	/** @primaryKey */
	id: number;
	traductions?: BlockBookingTranslation[] | null;
}

export interface BlockBookingTranslation {
	/** @primaryKey */
	id: number;
	block_booking_id?: BlockBooking | string | null;
	langues_code?: Langue | string | null;
	step_1_label?: string | null;
	step_2_label?: string | null;
	step_3_label?: string | null;
	step_4_label?: string | null;
	options_parking_title?: string | null;
	options_parking_desc?: string | null;
	options_parking_unit?: string | null;
	options_title?: string | null;
	step_selector_title?: string | null;
	step_selector_room_title?: string | null;
	step_selector_room_desc?: string | null;
	step_calendar_step_label?: string | null;
	step_calendar_title?: string | null;
	cal_dates_title?: string | null;
	cal_btn_clear?: string | null;
	cal_legend_available?: string | null;
	cal_legend_partial?: string | null;
	cal_legend_full?: string | null;
	cal_legend_unavailable?: string | null;
	cal_selection_dates_label?: string | null;
	cal_selection_to?: string | null;
	cal_selection_placeholder_start?: string | null;
	cal_nights_unit?: string | null;
	travelers_title?: string | null;
	travelers_adults?: string | null;
	travelers_children?: string | null;
	travelers_max_reached?: string | null;
	room_list_empty_desc?: string | null;
	room_list_all_filter?: string | null;
	room_list_filter_active?: string | null;
	room_list_only_option?: string | null;
	room_list_price_unit?: string | null;
	room_list_capacity_max?: string | null;
	room_list_error_capacity?: string | null;
	room_list_error_unavailable?: string | null;
	room_list_selected?: string | null;
	room_list_select_prompt?: string | null;
	price_est_total_label?: string | null;
	price_est_tax_included?: string | null;
	price_est_unit_night?: string | null;
	price_est_unit_nights?: string | null;
	price_est_unit_adult?: string | null;
	price_est_unit_adults?: string | null;
	price_est_unit_child?: string | null;
	price_est_unit_children?: string | null;
	price_est_prompt_dates_title?: string | null;
	price_est_prompt_dates_desc?: string | null;
	price_est_prompt_room_title?: string | null;
	price_est_prompt_room_desc?: string | null;
	price_est_prompt_global?: string | null;
	customer_title?: string | null;
	customer_desc?: string | null;
	customer_firstname?: string | null;
	customer_lastname?: string | null;
	customer_email?: string | null;
	customer_phone?: string | null;
	customer_lang?: string | null;
	error_firstname_short?: string | null;
	error_lastname_short?: string | null;
	error_email_invalid?: string | null;
	error_phone_invalid?: string | null;
	error_lang_required?: string | null;
	error_room_dates_missing?: string | null;
	error_room_missing?: string | null;
	summary_title?: string | null;
	summary_subtitle_room?: string | null;
	summary_subtitle_visit?: string | null;
	summary_base_price?: string | null;
	summary_total?: string | null;
	summary_edit_button?: string | null;
	summary_unit_night?: string | null;
	summary_unit_ticket?: string | null;
	wizard_btn_back?: string | null;
	wizard_btn_continue?: string | null;
	wizard_btn_confirm?: string | null;
	wizard_loading_validation?: string | null;
	wizard_success_title?: string | null;
	wizard_success_desc?: string | null;
	wizard_btn_home?: string | null;
	wizard_error_generic?: string | null;
	step_selector_visit_title?: string | null;
	step_selector_visit_desc?: string | null;
}

export interface BlockButton {
	/** @primaryKey */
	id: string;
	sort?: number | null;
	/** @description What type of link is this? Page and Post allow you to link to internal content. URL is for external content. Group can contain other menu items. */
	type?: 'page' | 'post' | 'url' | null;
	/** @description The internal post to link to. */
	post?: Post | string | null;
	/** @description What type of button */
	variant?: 'default' | 'outline' | 'soft' | 'ghost' | 'link' | null;
	/** @description The URL to link to. Could be relative (ie `/my-page`) or a full external URL (ie `https://docs.directus.io`) */
	url?: string | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
	page?: Page | string | null;
	button_group?: BlockButtonGroup | string | null;
	traductions?: BlockButtonTranslation[] | null;
}

export interface BlockButtonGroup {
	/** @primaryKey */
	id: string;
	sort?: number | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
	buttons?: BlockButton[] | string[];
}

export interface BlockButtonTranslation {
	/** @primaryKey */
	id: number;
	block_button_id?: BlockButton | string | null;
	langues_code?: Langue | string | null;
	label?: string | null;
}

export interface BlockForm {
	/** @primaryKey */
	id: string;
	/** @description Form to show within block */
	form?: Form | string | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
	traductions?: BlockFormTranslation[] | null;
}

export interface BlockFormTranslation {
	/** @primaryKey */
	id: number;
	block_form_id?: BlockForm | string | null;
	langues_code?: Langue | string | null;
	tagline?: string | null;
	headline?: string | null;
}

export interface BlockGallery {
	/** @primaryKey */
	id: string;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
	/** @description Images to include in the image gallery. */
	items?: BlockGalleryItem[] | string[];
	traductions?: BlockGalleryTranslation[] | null;
}

export interface BlockGalleryItem {
	/** @primaryKey */
	id: string;
	/** @description The id of the gallery block this item belongs to. */
	block_gallery?: BlockGallery | string | null;
	/** @description The id of the file included in the gallery. */
	directus_file?: DirectusFile | string | null;
	sort?: number | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
}

export interface BlockGalleryTranslation {
	/** @primaryKey */
	id: number;
	block_gallery_id?: BlockGallery | string | null;
	langues_code?: Langue | string | null;
	tagline?: string | null;
	headline?: string | null;
}

export interface BlockHero {
	/** @primaryKey */
	id: string;
	/** @description Featured image in the hero. */
	image?: DirectusFile | string | null;
	/** @description The layout for the component. You can set the image to display left, right, or in the center of page.. */
	layout?: 'image_left' | 'image_center' | 'image_right' | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
	button_group?: BlockButtonGroup | string | null;
	traductions?: BlockHeroTranslation[] | null;
}

export interface BlockHeroTranslation {
	/** @primaryKey */
	id: number;
	block_hero_id?: BlockHero | string | null;
	langues_code?: Langue | string | null;
	tagline?: string | null;
	headline?: string | null;
	description?: string | null;
}

export interface BlockPost {
	/** @primaryKey */
	id: string;
	/** @description The collection of content to fetch and display on the page within this block. @required */
	collection: 'posts';
	limit?: number | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
	traductions?: BlockPostsTranslation[] | null;
}

export interface BlockPostsTranslation {
	/** @primaryKey */
	id: number;
	block_posts_id?: BlockPost | string | null;
	langues_code?: Langue | string | null;
	tagline?: string | null;
	headline?: string | null;
}

export interface BlockPricing {
	/** @primaryKey */
	id: string;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
	traductions?: BlockPricingTranslation[] | null;
	pricing_cards?: BlockPricingCard[] | string[];
}

export interface BlockPricingCard {
	/** @primaryKey */
	id: string;
	/** @description Price and term for the pricing plan. (ie `$199/mo`) */
	price?: string | null;
	/** @description Badge that displays at the top of the pricing plan card to add helpful context. */
	badge?: string | null;
	/** @description Short list of features included in this plan. Press `Enter` to add another item to the list. */
	features?: 'json' | null;
	/** @description Add highlighted border around the pricing plan to make it stand out. */
	is_highlighted?: boolean | null;
	sort?: number | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
	pricing?: BlockPricing | string | null;
	button?: BlockButton | string | null;
	traductions?: BlockPricingCardsTranslation[] | null;
}

export interface BlockPricingCardsTranslation {
	/** @primaryKey */
	id: number;
	block_pricing_cards_id?: BlockPricingCard | string | null;
	langues_code?: Langue | string | null;
	title?: string | null;
	description?: string | null;
}

export interface BlockPricingTranslation {
	/** @primaryKey */
	id: number;
	block_pricing_id?: BlockPricing | string | null;
	langues_code?: Langue | string | null;
	tagline?: string | null;
	headline?: string | null;
}

export interface BlockRichtext {
	/** @primaryKey */
	id: string;
	/** @description Controls how the content block is positioned on the page. Choose "Left" to align the block against the left margin or "Center" to position the block in the middle of the page. This setting affects the entire content block's placement, not the text alignment within it. */
	alignment?: 'left' | 'center' | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
	traductions?: BlockRichtextTranslation[] | null;
}

export interface BlockRichtextTranslation {
	/** @primaryKey */
	id: number;
	block_richtext_id?: BlockRichtext | string | null;
	langues_code?: Langue | string | null;
	tagline?: string | null;
	headline?: string | null;
	content?: string | null;
}

export interface BlockSplit {
	/** @primaryKey */
	id: number;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	image?: DirectusFile | string | null;
	layout?: 'image_left' | 'image_right' | null;
	traductions?: BlockSplitTranslation[] | null;
}

export interface BlockSplitTranslation {
	/** @primaryKey */
	id: number;
	block_split_id?: BlockSplit | string | null;
	langues_code?: Langue | string | null;
	tagline?: string | null;
	headline?: string | null;
	content?: string | null;
}

export interface Chambre {
	/** @primaryKey */
	id: number;
	description?: string | null;
	/** @required */
	nom: string;
	/** @required */
	prix_nuit: number;
	/** @required */
	capacite_adultes: number;
	/** @required */
	capacite_enfants: number;
	/** @required */
	capacite_max: number;
	/** @required */
	statut: 'disponible' | 'indisponible';
	image?: DirectusFile | string | null;
	images?: ChambresFile[] | string[];
}

export interface ChambresFile {
	/** @primaryKey */
	id: number;
	chambres_id?: Chambre | string | null;
	directus_files_id?: DirectusFile | string | null;
}

export interface Client {
	/** @primaryKey */
	id: number;
	/** @required */
	prenom: string;
	/** @required */
	nom: string;
	email?: string | null;
	numero?: string | null;
	/** @required */
	langue: string;
}

export interface CreneauxVisite {
	/** @primaryKey */
	id: number;
	/** @required */
	visite_id: Visite | string;
	/** @required */
	date_heure_debut: string;
	capacite_max?: number | null;
	place_reservee?: number | null;
}

export interface FormFieldChoice {
	/** @primaryKey */
	id: number;
	form_field?: FormField | string | null;
	value?: string | null;
	sort?: number | null;
	traductions?: FormFieldChoicesTranslation[] | null;
}

export interface FormFieldChoicesTranslation {
	/** @primaryKey */
	id: number;
	form_field_choices_id?: FormFieldChoice | string | null;
	langues_code?: Langue | string | null;
	text?: string | null;
}

export interface FormField {
	/** @primaryKey */
	id: string;
	/** @description Unique field identifier, not shown to users (lowercase, hyphenated) */
	name?: string | null;
	/** @description Input type for the field */
	type?: 'text' | 'textarea' | 'checkbox' | 'checkbox_group' | 'radio' | 'file' | 'select' | 'hidden' | null;
	/** @description Available rules: `email`, `url`, `min:5`, `max:20`, `length:10`. Combine with pipes example: `email|max:255` */
	validation?: string | null;
	/** @description Field width on the form */
	width?: '100' | '67' | '50' | '33' | null;
	/** @description Parent form this field belongs to. */
	form?: Form | string | null;
	sort?: number | null;
	/** @description Make this field mandatory to complete. */
	required?: boolean | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
	traductions?: FormFieldsTranslation[] | null;
	choices?: FormFieldChoice[] | string[];
}

export interface FormFieldsTranslation {
	/** @primaryKey */
	id: number;
	form_fields_id?: FormField | string | null;
	langues_code?: Langue | string | null;
	label?: string | null;
	placeholder?: string | null;
	help?: string | null;
}

export interface Form {
	/** @primaryKey */
	id: string;
	/** @description Action after successful submission. */
	on_success?: 'redirect' | 'message' | null;
	sort?: number | null;
	/** @description Destination URL after successful submission. */
	success_redirect_url?: string | null;
	/** @description Show or hide this form from the site. */
	is_active?: boolean | null;
	/** @description Setup email notifications when forms are submitted. */
	emails?: Array<{ to: string[]; subject: string; message: string }> | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
	traductions?: FormsTranslation[] | null;
	/** @description Form structure and input fields */
	fields?: FormField[] | string[];
	/** @description Received form responses. */
	submissions?: FormSubmission[] | string[];
}

export interface FormsTranslation {
	/** @primaryKey */
	id: number;
	forms_id?: Form | string | null;
	langues_code?: Langue | string | null;
	title?: string | null;
	submit_label?: string | null;
	success_message?: string | null;
}

export interface FormSubmission {
	/** @description Unique ID for this specific form submission @primaryKey */
	id: string;
	/** @description Form submission date and time. */
	timestamp?: string | null;
	/** @description Associated form for this submission. */
	form?: Form | string | null;
	/** @description Submitted field responses */
	values?: FormSubmissionValue[] | string[];
}

export interface FormSubmissionValue {
	/** @primaryKey */
	id: string;
	/** @description Parent form submission for this value. */
	form_submission?: FormSubmission | string | null;
	field?: FormField | string | null;
	/** @description The data entered by the user for this specific field in the form submission. */
	value?: string | null;
	sort?: number | null;
	file?: DirectusFile | string | null;
	/** @description Form submission date and time. */
	timestamp?: string | null;
}

export interface Globals {
	/** @description Site summary for search results. */
	description?: string | null;
	/** @primaryKey */
	id: string;
	/** @description Social media profile URLs */
	social_links?: Array<{ url: string; service: 'facebook' | 'instagram' | 'linkedin' | 'x' | 'vimeo' | 'youtube' | 'github' | 'discord' | 'docker' }> | null;
	/** @description Short phrase describing the site. */
	tagline?: string | null;
	/** @description Main site title */
	title?: string | null;
	/** @description Public URL for the website */
	url?: string | null;
	/** @description Small icon for browser tabs. 1:1 ratio. No larger than 512px × 512px. */
	favicon?: DirectusFile | string | null;
	/** @description Main logo shown on the site (for light mode). */
	logo?: DirectusFile | string | null;
	/** @description Secret OpenAI API key. Don't share with anyone outside your team. */
	openai_api_key?: string | null;
	/** @description The public URL for this Directus instance. Used in Flows. */
	directus_url?: string | null;
	/** @description Main logo shown on the site (for dark mode). */
	logo_dark_mode?: DirectusFile | string | null;
	/** @description Accent color for the website (used on buttons, links, etc). */
	accent_color?: string | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
}

export interface Language {
	/** @primaryKey */
	code: string;
	name?: string | null;
	direction?: 'ltr' | 'rtl' | null;
}

export interface Langue {
	/** @primaryKey @required */
	code: string;
	/** @required */
	nom: string;
	/** @required */
	direction: 'ltr' | 'rtl';
	/** @required */
	flag_code: string;
	/** @required */
	slug: string;
	is_default?: boolean | null;
}

export interface Navigation {
	/** @description Unique identifier for this menu. Can't be edited after creation. @primaryKey */
	id: string;
	/** @description What is the name of this menu? Only used internally. */
	title?: string | null;
	/** @description Show or hide this menu from the site. */
	is_active?: boolean | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
	items?: NavigationItem[] | string[];
}

export interface NavigationItem {
	/** @primaryKey */
	id: string;
	/** @description The parent navigation item. */
	parent?: NavigationItem | string | null;
	sort?: number | null;
	/** @description What type of link is this? Page and Post allow you to link to internal content. URL is for external content. Group can contain other menu items. */
	type?: 'page' | 'post' | 'url' | 'group' | 'button' | null;
	/** @description The URL to link to. Could be relative (ie `/my-page`) or a full external URL (ie `https://docs.directus.io`) */
	url?: string | null;
	/** @description The internal post to link to. */
	post?: Post | string | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
	page?: Page | string | null;
	navigation?: Navigation | string | null;
	button?: BlockButton | string | null;
	/** @description Add child menu items within the group. */
	children?: NavigationItem[] | string[];
	traductions?: NavigationItemsTranslation[] | null;
}

export interface NavigationItemsTranslation {
	/** @primaryKey */
	id: number;
	navigation_items_id?: NavigationItem | string | null;
	langues_code?: Langue | string | null;
	/** @required */
	title: string;
}

export interface PageBlock {
	/** @primaryKey */
	id: string;
	sort?: number | null;
	/** @description The id of the page that this block belongs to. */
	page?: Page | string | null;
	/** @description The data for the block. */
	item?: BlockHero | BlockRichtext | BlockForm | BlockPost | BlockGallery | BlockPricing | BlockBooking | BlockSplit | string | null;
	/** @description The collection (type of block). */
	collection?: string | null;
	/** @description Temporarily hide this block on the website without having to remove it from your page. */
	hide_block?: boolean | null;
	/** @description Background color for the block to create contrast. Does not control dark or light mode for the entire site. */
	background?: 'light' | 'dark' | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
}

export interface Page {
	/** @primaryKey */
	id: string;
	sort?: number | null;
	/** @description Is this page published? */
	status?: 'draft' | 'in_review' | 'published';
	/** @description Publish now or schedule for later. */
	published_at?: string | null;
	seo?: ExtensionSeoMetadata | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
	/** @description Create and arrange different content blocks (like text, images, or videos) to build your page. */
	blocks?: PageBlock[] | string[];
	traductions?: PagesTranslation[] | null;
}

export interface PagesTranslation {
	/** @primaryKey */
	id: number;
	pages_id?: Page | string | null;
	langues_code?: Langue | string | null;
	/** @required */
	title: string;
	/** @required */
	permalink: string;
}

export interface Post {
	/** @description Rich text content of your blog post. */
	content?: string | null;
	/** @primaryKey */
	id: string;
	/** @description Featured image for this post. Used in cards linking to the post and in the post detail page. */
	image?: DirectusFile | string | null;
	/** @description Unique URL for this post (e.g., `yoursite.com/posts/{{your-slug}}`) */
	slug?: string | null;
	sort?: number | null;
	/** @description Is this post published? */
	status?: 'draft' | 'in_review' | 'published';
	/** @description Title of the blog post (used in page title and meta tags) @required */
	title: string;
	/** @description Short summary of the blog post to entice readers. */
	description?: string | null;
	/** @description Select the team member who wrote this post */
	author?: DirectusUser | string | null;
	/** @description Publish now or schedule for later. */
	published_at?: string | null;
	seo?: ExtensionSeoMetadata | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
}

export interface Redirect {
	/** @primaryKey */
	id: string;
	response_code?: '301' | '302' | null;
	/** @description Old URL has to be relative to the site (ie `/blog` or `/news`). It cannot be a full url like (https://example.com/blog) */
	url_from?: string | null;
	/** @description The URL you're redirecting to. This can be a relative url (/resources/matt-is-cool) or a full url (https://example.com/blog). */
	url_to?: string | null;
	/** @description Short explanation of why the redirect was created. */
	note?: string | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	date_updated?: string | null;
	user_updated?: DirectusUser | string | null;
}

export interface ReservationsChambre {
	/** @primaryKey */
	id: number;
	date_created?: string | null;
	/** @required */
	chambre: Chambre | string;
	client?: Client | string | null;
	/** @required */
	date_arrivee: string;
	/** @required */
	date_depart: string;
	/** @required */
	statut: 'en_attente' | 'confirmee' | 'annulee';
	/** @required */
	parking: 'no_parking' | 'parking';
}

export interface ReservationsVisite {
	/** @primaryKey */
	id: number;
	date_created?: string | null;
	/** @required */
	creneau_visite: CreneauxVisite | string;
	/** @required */
	client: Client | string;
	/** @required */
	quantite_billets: number;
	statut?: 'en_attente' | 'confirmee' | 'annulee' | null;
}

export interface TarifsSpeciaux {
	/** @primaryKey */
	id: number;
	/** @required */
	nom: string;
	/** @required */
	type: Array<'pourcentage' | 'fix_nuit' | 'fixe_sejour' | 'parking' | 'taxe_sejour'>;
	date_debut?: string | null;
	date_fin?: string | null;
	/** @required */
	statut: 'actif' | 'inactif';
	description?: string | null;
	/** @required */
	valeur: number;
	jours_application?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | null;
	duree_min?: number | null;
	duree_max?: number | null;
	personnes_min?: number | null;
	personnes_max?: number | null;
	parent?: TarifsSpeciaux | string | null;
	chambres_concernees?: TarifsSpeciauxChambre[] | string[];
}

export interface TarifsSpeciauxChambre {
	/** @primaryKey */
	id: number;
	tarifs_speciaux_id?: TarifsSpeciaux | string | null;
	chambres_id?: Chambre | string | null;
}

export interface Visite {
	/** @primaryKey */
	id: number;
	date_created?: string | null;
	date_updated?: string | null;
	nom?: string | null;
	description?: string | null;
	duree_minutes?: number | null;
	prix_unitaire?: number | null;
}

export interface DirectusAccess {
	/** @primaryKey */
	id: string;
	role?: DirectusRole | string | null;
	user?: DirectusUser | string | null;
	policy?: DirectusPolicy | string;
	sort?: number | null;
}

export interface DirectusActivity {
	/** @primaryKey */
	id: number;
	action?: string;
	user?: DirectusUser | string | null;
	timestamp?: string;
	ip?: string | null;
	user_agent?: string | null;
	collection?: string;
	item?: string;
	origin?: string | null;
	revisions?: DirectusRevision[] | string[];
}

export interface DirectusCollection {
	/** @primaryKey */
	collection: string;
	icon?: string | null;
	note?: string | null;
	display_template?: string | null;
	hidden?: boolean;
	singleton?: boolean;
	translations?: Array<{ language: string; translation: string; singular: string; plural: string }> | null;
	archive_field?: string | null;
	archive_app_filter?: boolean;
	archive_value?: string | null;
	unarchive_value?: string | null;
	sort_field?: string | null;
	accountability?: 'all' | 'activity' | null | null;
	color?: string | null;
	item_duplication_fields?: 'json' | null;
	sort?: number | null;
	group?: DirectusCollection | string | null;
	collapse?: string;
	preview_url?: string | null;
	versioning?: boolean;
}

export interface DirectusComment {
	/** @primaryKey */
	id: string;
	collection?: DirectusCollection | string;
	item?: string;
	comment?: string;
	date_created?: string | null;
	date_updated?: string | null;
	user_created?: DirectusUser | string | null;
	user_updated?: DirectusUser | string | null;
}

export interface DirectusField {
	/** @primaryKey */
	id: number;
	collection?: DirectusCollection | string;
	field?: string;
	special?: string[] | null;
	interface?: string | null;
	options?: 'json' | null;
	display?: string | null;
	display_options?: 'json' | null;
	readonly?: boolean;
	hidden?: boolean;
	sort?: number | null;
	width?: string | null;
	translations?: 'json' | null;
	note?: string | null;
	conditions?: 'json' | null;
	required?: boolean | null;
	group?: DirectusField | string | null;
	validation?: 'json' | null;
	validation_message?: string | null;
	searchable?: boolean;
}

export interface DirectusFile {
	/** @primaryKey */
	id: string;
	storage?: string;
	filename_disk?: string | null;
	filename_download?: string;
	title?: string | null;
	type?: string | null;
	folder?: DirectusFolder | string | null;
	uploaded_by?: DirectusUser | string | null;
	created_on?: string;
	modified_by?: DirectusUser | string | null;
	modified_on?: string;
	charset?: string | null;
	filesize?: number | null;
	width?: number | null;
	height?: number | null;
	duration?: number | null;
	embed?: string | null;
	description?: string | null;
	location?: string | null;
	tags?: string[] | null;
	metadata?: 'json' | null;
	focal_point_x?: number | null;
	focal_point_y?: number | null;
	tus_id?: string | null;
	tus_data?: 'json' | null;
	uploaded_on?: string | null;
}

export interface DirectusFolder {
	/** @primaryKey */
	id: string;
	name?: string;
	parent?: DirectusFolder | string | null;
}

export interface DirectusMigration {
	/** @primaryKey */
	version: string;
	name?: string;
	timestamp?: string | null;
}

export interface DirectusPermission {
	/** @primaryKey */
	id: number;
	collection?: string;
	action?: string;
	permissions?: 'json' | null;
	validation?: 'json' | null;
	presets?: 'json' | null;
	fields?: string[] | null;
	policy?: DirectusPolicy | string;
}

export interface DirectusPolicy {
	/** @primaryKey */
	id: string;
	/** @required */
	name: string;
	icon?: string;
	description?: string | null;
	ip_access?: string[] | null;
	enforce_tfa?: boolean;
	admin_access?: boolean;
	app_access?: boolean;
	permissions?: DirectusPermission[] | string[];
	users?: DirectusAccess[] | string[];
	roles?: DirectusAccess[] | string[];
}

export interface DirectusPreset {
	/** @primaryKey */
	id: number;
	bookmark?: string | null;
	user?: DirectusUser | string | null;
	role?: DirectusRole | string | null;
	collection?: string | null;
	search?: string | null;
	layout?: string | null;
	layout_query?: 'json' | null;
	layout_options?: 'json' | null;
	refresh_interval?: number | null;
	filter?: 'json' | null;
	icon?: string | null;
	color?: string | null;
}

export interface DirectusRelation {
	/** @primaryKey */
	id: number;
	many_collection?: string;
	many_field?: string;
	one_collection?: string | null;
	one_field?: string | null;
	one_collection_field?: string | null;
	one_allowed_collections?: string[] | null;
	junction_field?: string | null;
	sort_field?: string | null;
	one_deselect_action?: string;
}

export interface DirectusRevision {
	/** @primaryKey */
	id: number;
	activity?: DirectusActivity | string;
	collection?: string;
	item?: string;
	data?: 'json' | null;
	delta?: 'json' | null;
	parent?: DirectusRevision | string | null;
	version?: DirectusVersion | string | null;
}

export interface DirectusRole {
	/** @primaryKey */
	id: string;
	/** @required */
	name: string;
	icon?: string;
	description?: string | null;
	parent?: DirectusRole | string | null;
	children?: DirectusRole[] | string[];
	policies?: DirectusAccess[] | string[];
	users?: DirectusUser[] | string[];
}

export interface DirectusSession {
	/** @primaryKey */
	token: string;
	user?: DirectusUser | string | null;
	expires?: string;
	ip?: string | null;
	user_agent?: string | null;
	share?: DirectusShare | string | null;
	origin?: string | null;
	next_token?: string | null;
}

export interface DirectusSettings {
	/** @primaryKey */
	id: number;
	project_name?: string;
	project_url?: string | null;
	project_color?: string;
	project_logo?: DirectusFile | string | null;
	public_foreground?: DirectusFile | string | null;
	public_background?: DirectusFile | string | null;
	public_note?: string | null;
	auth_login_attempts?: number | null;
	auth_password_policy?: null | `/^.{8,}$/` | `/(?=^.{8,}$)(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+}{';'?>.<,])(?!.*\\s).*$/` | null;
	storage_asset_transform?: 'all' | 'none' | 'presets' | null;
	storage_asset_presets?: Array<{ key: string; fit: 'contain' | 'cover' | 'inside' | 'outside'; width: number; height: number; quality: number; withoutEnlargement: boolean; format: 'auto' | 'jpeg' | 'png' | 'webp' | 'tiff' | 'avif'; transforms: 'json' }> | null;
	custom_css?: string | null;
	storage_default_folder?: DirectusFolder | string | null;
	basemaps?: Array<{ name: string; type: 'raster' | 'tile' | 'style'; url: string; tileSize: number; attribution: string }> | null;
	mapbox_key?: string | null;
	module_bar?: 'json' | null;
	project_descriptor?: string | null;
	default_language?: string;
	custom_aspect_ratios?: Array<{ text: string; value: number }> | null;
	public_favicon?: DirectusFile | string | null;
	default_appearance?: 'auto' | 'light' | 'dark';
	default_theme_light?: string | null;
	theme_light_overrides?: 'json' | null;
	default_theme_dark?: string | null;
	theme_dark_overrides?: 'json' | null;
	report_error_url?: string | null;
	report_bug_url?: string | null;
	report_feature_url?: string | null;
	public_registration?: boolean;
	public_registration_verify_email?: boolean;
	public_registration_role?: DirectusRole | string | null;
	public_registration_email_filter?: 'json' | null;
	visual_editor_urls?: Array<{ url: string }> | null;
	project_id?: string | null;
	mcp_enabled?: boolean;
	mcp_allow_deletes?: boolean;
	mcp_prompts_collection?: string | null;
	mcp_system_prompt_enabled?: boolean;
	mcp_system_prompt?: string | null;
	project_owner?: string | null;
	project_usage?: string | null;
	org_name?: string | null;
	product_updates?: boolean | null;
	project_status?: string | null;
	ai_openai_api_key?: string | null;
	ai_anthropic_api_key?: string | null;
	ai_system_prompt?: string | null;
	/** @description Settings for the Command Palette Module. */
	command_palette_settings?: Record<string, any> | null;
}

export interface DirectusUser {
	/** @primaryKey */
	id: string;
	first_name?: string | null;
	last_name?: string | null;
	email?: string | null;
	password?: string | null;
	location?: string | null;
	title?: string | null;
	description?: string | null;
	tags?: string[] | null;
	avatar?: DirectusFile | string | null;
	language?: string | null;
	tfa_secret?: string | null;
	status?: 'draft' | 'invited' | 'unverified' | 'active' | 'suspended' | 'archived';
	role?: DirectusRole | string | null;
	token?: string | null;
	last_access?: string | null;
	last_page?: string | null;
	provider?: 'keycloak';
	external_identifier?: string | null;
	auth_data?: 'json' | null;
	email_notifications?: boolean | null;
	appearance?: null | 'auto' | 'light' | 'dark' | null;
	theme_dark?: string | null;
	theme_light?: string | null;
	theme_light_overrides?: 'json' | null;
	theme_dark_overrides?: 'json' | null;
	text_direction?: 'auto' | 'ltr' | 'rtl';
	/** @description Blog posts this user has authored. */
	posts?: Post[] | string[];
	policies?: DirectusAccess[] | string[];
}

export interface DirectusWebhook {
	/** @primaryKey */
	id: number;
	name?: string;
	method?: null;
	url?: string;
	status?: 'active' | 'inactive';
	data?: boolean;
	actions?: 'create' | 'update' | 'delete';
	collections?: string[];
	headers?: Array<{ header: string; value: string }> | null;
	was_active_before_deprecation?: boolean;
	migrated_flow?: DirectusFlow | string | null;
}

export interface DirectusDashboard {
	/** @primaryKey */
	id: string;
	name?: string;
	icon?: string;
	note?: string | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	color?: string | null;
	panels?: DirectusPanel[] | string[];
}

export interface DirectusPanel {
	/** @primaryKey */
	id: string;
	dashboard?: DirectusDashboard | string;
	name?: string | null;
	icon?: string | null;
	color?: string | null;
	show_header?: boolean;
	note?: string | null;
	type?: string;
	position_x?: number;
	position_y?: number;
	width?: number;
	height?: number;
	options?: 'json' | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
}

export interface DirectusNotification {
	/** @primaryKey */
	id: number;
	timestamp?: string | null;
	status?: string | null;
	recipient?: DirectusUser | string;
	sender?: DirectusUser | string | null;
	subject?: string;
	message?: string | null;
	collection?: string | null;
	item?: string | null;
}

export interface DirectusShare {
	/** @primaryKey */
	id: string;
	name?: string | null;
	collection?: DirectusCollection | string;
	item?: string;
	role?: DirectusRole | string | null;
	password?: string | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	date_start?: string | null;
	date_end?: string | null;
	times_used?: number | null;
	max_uses?: number | null;
}

export interface DirectusFlow {
	/** @primaryKey */
	id: string;
	name?: string;
	icon?: string | null;
	color?: string | null;
	description?: string | null;
	status?: string;
	trigger?: string | null;
	accountability?: string | null;
	options?: 'json' | null;
	operation?: DirectusOperation | string | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	operations?: DirectusOperation[] | string[];
}

export interface DirectusOperation {
	/** @primaryKey */
	id: string;
	name?: string | null;
	key?: string;
	type?: string;
	position_x?: number;
	position_y?: number;
	options?: 'json' | null;
	resolve?: DirectusOperation | string | null;
	reject?: DirectusOperation | string | null;
	flow?: DirectusFlow | string;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
}

export interface DirectusTranslation {
	/** @primaryKey */
	id: string;
	/** @required */
	language: string;
	/** @required */
	key: string;
	/** @required */
	value: string;
}

export interface DirectusVersion {
	/** @primaryKey */
	id: string;
	key?: string;
	name?: string | null;
	collection?: DirectusCollection | string;
	item?: string;
	hash?: string | null;
	date_created?: string | null;
	date_updated?: string | null;
	user_created?: DirectusUser | string | null;
	user_updated?: DirectusUser | string | null;
	delta?: 'json' | null;
}

export interface DirectusExtension {
	enabled?: boolean;
	/** @primaryKey */
	id: string;
	folder?: string;
	source?: string;
	bundle?: string | null;
}

export interface Schema {
	ai_prompts: AiPrompt[];
	block_booking: BlockBooking[];
	block_booking_translations: BlockBookingTranslation[];
	block_button: BlockButton[];
	block_button_group: BlockButtonGroup[];
	block_button_translations: BlockButtonTranslation[];
	block_form: BlockForm[];
	block_form_translations: BlockFormTranslation[];
	block_gallery: BlockGallery[];
	block_gallery_items: BlockGalleryItem[];
	block_gallery_translations: BlockGalleryTranslation[];
	block_hero: BlockHero[];
	block_hero_translations: BlockHeroTranslation[];
	block_posts: BlockPost[];
	block_posts_translations: BlockPostsTranslation[];
	block_pricing: BlockPricing[];
	block_pricing_cards: BlockPricingCard[];
	block_pricing_cards_translations: BlockPricingCardsTranslation[];
	block_pricing_translations: BlockPricingTranslation[];
	block_richtext: BlockRichtext[];
	block_richtext_translations: BlockRichtextTranslation[];
	block_split: BlockSplit[];
	block_split_translations: BlockSplitTranslation[];
	chambres: Chambre[];
	chambres_files: ChambresFile[];
	clients: Client[];
	creneaux_visites: CreneauxVisite[];
	form_field_choices: FormFieldChoice[];
	form_field_choices_translations: FormFieldChoicesTranslation[];
	form_fields: FormField[];
	form_fields_translations: FormFieldsTranslation[];
	forms: Form[];
	forms_translations: FormsTranslation[];
	form_submissions: FormSubmission[];
	form_submission_values: FormSubmissionValue[];
	globals: Globals;
	languages: Language[];
	langues: Langue[];
	navigation: Navigation[];
	navigation_items: NavigationItem[];
	navigation_items_translations: NavigationItemsTranslation[];
	page_blocks: PageBlock[];
	pages: Page[];
	pages_translations: PagesTranslation[];
	posts: Post[];
	redirects: Redirect[];
	reservations_chambre: ReservationsChambre[];
	reservations_visite: ReservationsVisite[];
	tarifs_speciaux: TarifsSpeciaux[];
	tarifs_speciaux_chambres: TarifsSpeciauxChambre[];
	visites: Visite[];
	directus_access: DirectusAccess[];
	directus_activity: DirectusActivity[];
	directus_collections: DirectusCollection[];
	directus_comments: DirectusComment[];
	directus_fields: DirectusField[];
	directus_files: DirectusFile[];
	directus_folders: DirectusFolder[];
	directus_migrations: DirectusMigration[];
	directus_permissions: DirectusPermission[];
	directus_policies: DirectusPolicy[];
	directus_presets: DirectusPreset[];
	directus_relations: DirectusRelation[];
	directus_revisions: DirectusRevision[];
	directus_roles: DirectusRole[];
	directus_sessions: DirectusSession[];
	directus_settings: DirectusSettings;
	directus_users: DirectusUser[];
	directus_webhooks: DirectusWebhook[];
	directus_dashboards: DirectusDashboard[];
	directus_panels: DirectusPanel[];
	directus_notifications: DirectusNotification[];
	directus_shares: DirectusShare[];
	directus_flows: DirectusFlow[];
	directus_operations: DirectusOperation[];
	directus_translations: DirectusTranslation[];
	directus_versions: DirectusVersion[];
	directus_extensions: DirectusExtension[];
}

export enum CollectionNames {
	ai_prompts = 'ai_prompts',
	block_booking = 'block_booking',
	block_booking_translations = 'block_booking_translations',
	block_button = 'block_button',
	block_button_group = 'block_button_group',
	block_button_translations = 'block_button_translations',
	block_form = 'block_form',
	block_form_translations = 'block_form_translations',
	block_gallery = 'block_gallery',
	block_gallery_items = 'block_gallery_items',
	block_gallery_translations = 'block_gallery_translations',
	block_hero = 'block_hero',
	block_hero_translations = 'block_hero_translations',
	block_posts = 'block_posts',
	block_posts_translations = 'block_posts_translations',
	block_pricing = 'block_pricing',
	block_pricing_cards = 'block_pricing_cards',
	block_pricing_cards_translations = 'block_pricing_cards_translations',
	block_pricing_translations = 'block_pricing_translations',
	block_richtext = 'block_richtext',
	block_richtext_translations = 'block_richtext_translations',
	block_split = 'block_split',
	block_split_translations = 'block_split_translations',
	chambres = 'chambres',
	chambres_files = 'chambres_files',
	clients = 'clients',
	creneaux_visites = 'creneaux_visites',
	form_field_choices = 'form_field_choices',
	form_field_choices_translations = 'form_field_choices_translations',
	form_fields = 'form_fields',
	form_fields_translations = 'form_fields_translations',
	forms = 'forms',
	forms_translations = 'forms_translations',
	form_submissions = 'form_submissions',
	form_submission_values = 'form_submission_values',
	globals = 'globals',
	languages = 'languages',
	langues = 'langues',
	navigation = 'navigation',
	navigation_items = 'navigation_items',
	navigation_items_translations = 'navigation_items_translations',
	page_blocks = 'page_blocks',
	pages = 'pages',
	pages_translations = 'pages_translations',
	posts = 'posts',
	redirects = 'redirects',
	reservations_chambre = 'reservations_chambre',
	reservations_visite = 'reservations_visite',
	tarifs_speciaux = 'tarifs_speciaux',
	tarifs_speciaux_chambres = 'tarifs_speciaux_chambres',
	visites = 'visites',
	directus_access = 'directus_access',
	directus_activity = 'directus_activity',
	directus_collections = 'directus_collections',
	directus_comments = 'directus_comments',
	directus_fields = 'directus_fields',
	directus_files = 'directus_files',
	directus_folders = 'directus_folders',
	directus_migrations = 'directus_migrations',
	directus_permissions = 'directus_permissions',
	directus_policies = 'directus_policies',
	directus_presets = 'directus_presets',
	directus_relations = 'directus_relations',
	directus_revisions = 'directus_revisions',
	directus_roles = 'directus_roles',
	directus_sessions = 'directus_sessions',
	directus_settings = 'directus_settings',
	directus_users = 'directus_users',
	directus_webhooks = 'directus_webhooks',
	directus_dashboards = 'directus_dashboards',
	directus_panels = 'directus_panels',
	directus_notifications = 'directus_notifications',
	directus_shares = 'directus_shares',
	directus_flows = 'directus_flows',
	directus_operations = 'directus_operations',
	directus_translations = 'directus_translations',
	directus_versions = 'directus_versions',
	directus_extensions = 'directus_extensions'
}