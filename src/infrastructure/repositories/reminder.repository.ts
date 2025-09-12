import { IReminderRepository } from "../../core/interfaces/IReminderRepository";
import { Reminder } from "../../core/entities/Reminder";
import ReminderModel from "../models/reminder.model";
import {Op} from "sequelize";

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

    async findDueAndUnsent(now: Date, limit = 100) {
        // returns rows with status = 'scheduled' and remindAt <= now
        const rows = await ReminderModel.findAll({
            where: {
                status: "scheduled",
                remindAt: { [Op.lte]: now },
            } as any,
            order: [["remindAt", "ASC"]],
            limit,
        });
        return rows.map(r => r.toJSON() as Reminder);
    }


    async cancel(id: number) {
        await ReminderModel.update({ status: "cancelled" }, { where: { id } });
    }
}
