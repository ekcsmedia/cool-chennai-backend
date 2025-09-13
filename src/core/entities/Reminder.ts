// src/core/entities/Reminder.ts  (or wherever you keep entity types)
export type NotifyVia = 'sms' | 'push' | 'both';
export type ReminderStatus = 'scheduled' | 'sent' | 'cancelled';

export interface Reminder {
    id?: string;                 // UUID
    collectionId: string;        // UUID of collection
    customerId?: string | null;  // UUID of customer (optional)
    agentId?: string | null;     // UUID of agent (optional)
    notifyVia: NotifyVia;
    remindAt: Date;
    message?: string | null;
    status?: ReminderStatus;
    createdAt?: Date;
    updatedAt?: Date;
}
