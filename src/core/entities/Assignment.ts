export interface Assignment {
    id: string;
    collectionId: string;
    agentId: string;
    assignedAt: Date;
    reassignedFromId?: string | null;
}