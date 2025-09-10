import { Reminder } from "../entities/Reminder";

export interface IReminderRepository {
    create(reminder: Partial<Reminder>): Promise<Reminder>;
    listByCollection(collectionId: number): Promise<Reminder[]>;
    markSent(id: number): Promise<void>;
    cancel(id: number): Promise<void>;
}
