export interface Client {
    id: number;
    prenom: string;
    nom: string;
    email?: string | null;
    numero?: string | null;
    langue: string;
}

export interface Commentaire {
    id: number;
    status: 'published' | 'en_attente' | 'archived';
    date_created: string;
    contenu: string;
    client?: number | Client | null;
    parent?: number | Commentaire | null;
    is_admin_reply?: boolean | null;
    wp_comment_id?: number | null;
    wp_post_id?: number | null;
    pseudonyme?: string | null;
}

export interface Chambre {
    id: number;
    nom: string;
    description?: string | null;
    prix_nuit: number;
    capacite_adultes: number;
    capacite_enfants: number;
    capacite_max: number;
    statut: 'disponible' | 'indisponible';
    image?: string | null;
    couleur?: 'bleu' | 'orange' | null;
}

export interface ReservationChambre {
    id: number;
    date_created: string;
    chambre: number | Chambre;
    client: number | Client;
    date_arrivee: string;
    date_depart: string;
    statut: 'en_attente' | 'confirmee' | 'annulee' | 'indisponible';
    parking: 'no_parking' | 'parking';
    adulte: number;
    enfant: number;
}

export interface Visite {
    id: number;
    nom: string;
    description?: string | null;
    duree_minutes?: number | null;
    prix_unitaire?: number | null;
}

export interface CreneauVisite {
    id: number;
    visite_id: number | Visite;
    date_heure_debut: string;
    capacite_max: number;
}

export interface ReservationVisite {
    id: number;
    date_created: string;
    creneau_visite: number | CreneauVisite;
    client: number | Client;
    quantite_billets: number;
    statut: 'en_attente' | 'confirmee' | 'annulee';
}
