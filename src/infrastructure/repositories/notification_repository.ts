import { Op } from "sequelize";
import { Notification } from "../../core/entities/Notification";
import {NotificationRepository} from "../../core/interfaces/Repositories";
import {NotificationModel} from "../models";

export const notificationRepo: NotificationRepository = {
    async list(role: "admin" | "agent"): Promise<Notification[]> {
        const rows = await NotificationModel.findAll({
            where: { actorRole: role },
            order: [["createdAt", "DESC"]],
        });
        return rows.map((r) => r.toJSON() as Notification);
    },

    async listUnread(role: "admin" | "agent"): Promise<Notification[]> {
        const rows = await NotificationModel.findAll({
            where: {
                actorRole: role,
                status: { [Op.ne]: "read" },
            },
            order: [["createdAt", "DESC"]],
        });
        return rows.map((r) => r.toJSON() as Notification);
    },

    async updateStatus(id: string, status: Notification["status"]): Promise<void> {
        await NotificationModel.update({ status }, { where: { id } });
    },

    async create(payload: {
        title: string;
        body: string;
        kind?: string;
        actorRole?: "admin" | "agent";
        meta?: any;
        dueAt?: Date | string | null;
    }): Promise<Notification> {
        const row = await NotificationModel.create({
            title: payload.title,
            body: payload.body,
            kind: payload.kind ?? "generic",
            actorRole: payload.actorRole ?? "admin",
            status: "unread",
            meta: payload.meta ?? null,
            dueAt: payload.dueAt ? new Date(payload.dueAt) : null,
        });

        return row.toJSON() as Notification;
    },
};
