export interface Reminder {
    id?: number;
    collectionId: number;
    customerId: number;
    agentId: number;
    notifyVia: "sms" | "push" | "both";
    remindAt: Date;
    message?: string | null;
    status?: "scheduled" | "sent" | "cancelled";
    createdAt?: Date;
    updatedAt?: Date;
}
