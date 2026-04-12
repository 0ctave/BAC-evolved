export const config = {
    // --- Chambres ---
    roomBookingsCollection: 'reservations_chambre',
    roomsCollection: 'chambres',
    roomStartDateField: 'date_arrivee',
    roomEndDateField: 'date_depart',
    roomRelationField: 'chambre',
    roomNameField: 'nom',
    roomColorField: 'couleur',

    // --- Visites ---
    toursCollection: 'visites',
    tourSlotsCollection: 'creneaux_visites',
    tourBookingsCollection: 'reservations_visite',
    visiteRelationField: 'visite_id',
    slotRelationField: 'creneau_visite',

    // --- Commentaires ---
    commentsCollection: 'commentaires',

    // --- Clients ---
    clientsCollection: 'clients',

    // --- Partagé ---
    clientField: 'client',
    statusField: 'statut',
    defaultMaxCapacity: 20
};

export function getRoomHexColor(couleur: string | null | undefined): string {
    if (couleur === 'bleu') return '#3498db';
    if (couleur === 'orange') return '#e67e22';
    return '#95a5a6';
}
