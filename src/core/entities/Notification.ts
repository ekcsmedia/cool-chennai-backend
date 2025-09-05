export type NotificationStatus = 'new' | 'snoozed' | 'in_progress' | 'done';
export type NotificationKind = 'assignment' | 'overdue' | 'generic';

export interface Notification {
    id: string;
    title: string;
    body: string;
    kind: NotificationKind;
    status: NotificationStatus;
    actorRole: 'admin' | 'agent';
    meta?: Record<string, any>;
    createdAt: Date;
    dueAt?: Date | null; // for overdue
}