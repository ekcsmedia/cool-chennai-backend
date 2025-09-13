import { Reminder } from "../entities/Reminder";

export interface IReminderRepository {
    create(reminder: Partial<Reminder>): Promise<Reminder>;
    listByCollection(collectionId: string): Promise<Reminder[]>;
    markSent(id: string): Promise<void>;
    cancel(id: string): Promise<void>;
}
