export type CollectionType = 'pickup' | 'delivery' | 'service';
export type CollectionStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface Collection {
    id: string; // public code like COL-1024 can be derived
    code: string; // e.g., COL-1024
    type: CollectionType;
    area?: string; // e.g., Anna Nagar
    city?: string; // e.g., Chennai
    amount: number; // ₹
    status: CollectionStatus;
    customerId?: string;
    assignedAgentId?: string | null;
    dueAt?: Date | null; // for overdue reminders
}