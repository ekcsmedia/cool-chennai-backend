export interface TripHistory {
    id: string;
    agentId: string;
    collectionId: string;
    startedAt: Date;
    completedAt: Date;
    distanceKm: number;
    routeSummary?: string; // e.g., "T. Nagar → Velachery"
}