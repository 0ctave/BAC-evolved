export const config = {
    // --- Chambres ---
    roomBookingsCollection: 'reservations_chambre',
    roomsCollection: 'chambres',
    roomStartDateField: 'date_arrivee',
    roomEndDateField: 'date_depart',
    roomRelationField: 'chambre', // Relation vers la collection chambres
    roomNameField: 'nom',
    roomColorField: 'couleur', // 'bleu' ou 'orange' d'après votre schéma

    // --- Visites ---
    tourBookingsCollection: 'reservations_visite',
    toursCollection: 'visites',
    tourSlotsCollection: 'creneaux_visites',

    // --- Commentaires ---
    commentsCollection: 'commentaires',

    // --- Partagé ---
    clientField: 'client', // Relation vers clients (prenom, nom, email)
    statusField: 'statut', // 'en_attente' | 'confirmee' | 'annulee' | 'indisponible'
};

// Fonction utilitaire pour mapper les couleurs de la BDD vers des couleurs hexadécimales
export function getRoomHexColor(couleur: string | null | undefined): string {
    if (couleur === 'bleu') return '#3498db';
    if (couleur === 'orange') return '#e67e22';
    return '#95a5a6'; // Gris par défaut
}