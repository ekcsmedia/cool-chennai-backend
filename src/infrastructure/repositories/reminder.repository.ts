import { IReminderRepository } from "../../core/interfaces/IReminderRepository";
import { Reminder } from "../../core/entities/Reminder";
import ReminderModel from "../models/reminder.model";

export class ReminderRepository implements IReminderRepository {
    async create(rem: Partial<Reminder>): Promise<Reminder> {
        const row = await ReminderModel.create(rem as any);
        return row.toJSON() as Reminder;
    }

    async listByCollection(collectionId: number) {
        const rows = await ReminderModel.findAll({ where: { collectionId }, order: [["remindAt", "ASC"]] });
        return rows.map(r => r.toJSON() as Reminder);
    }

    async markSent(id: number) {
        await ReminderModel.update({ status: "sent" }, { where: { id } });
    }

    async cancel(id: number) {
        await ReminderModel.update({ status: "cancelled" }, { where: { id } });
    }
}
