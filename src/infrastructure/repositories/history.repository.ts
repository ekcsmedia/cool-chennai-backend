import { Op } from "sequelize";
import { TripHistory } from "../../core/entities/History";
import {AgentModel, CollectionModel, TripHistoryModel} from "../models";
import {Collection, HistoryRepository} from "../../core/interfaces/Repositories";

export const historyRepo: HistoryRepository = {
    async listByAgent(agentId: string, date?: string, page = 1, limit = 20): Promise<TripHistory[]> {
        const where: any = { agentId };
        if (date) {
            const start = new Date(date);
            const end = new Date(date);
            end.setDate(start.getDate() + 1);
            where.createdAt = { [Op.between]: [start, end] };
        }

        const rows = await TripHistoryModel.findAll({
            where,
            order: [["createdAt", "DESC"]],
            limit,
            offset: (page - 1) * limit,
        });

        return rows.map((r) => r.toJSON() as TripHistory);
    },

    async listByCustomer(customerId: string, from?: string, to?: string, page = 1, limit = 20): Promise<TripHistory[]> {
        const where: any = { customerId };
        if (from && to) {
            where.createdAt = { [Op.between]: [new Date(from), new Date(to)] };
        }

        const rows = await TripHistoryModel.findAll({
            where,
            order: [["createdAt", "DESC"]],
            limit,
            offset: (page - 1) * limit,
        });

        return rows.map((r) => r.toJSON() as TripHistory);
    },

    async listCollectionsHistory(opts: {
        from?: string;
        to?: string;
        agentId?: string;
        customerId?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<Collection[]> {
        const where: any = {};
        if (opts.agentId) where.assignedAgentId = opts.agentId;
        if (opts.customerId) where.customerId = opts.customerId;
        if (opts.status) where.status = opts.status;
        if (opts.from && opts.to) {
            where.createdAt = { [Op.between]: [new Date(opts.from), new Date(opts.to)] };
        }

        const rows = await CollectionModel.findAll({
            where,
            include: [{ model: AgentModel, as: "assignedAgent", attributes: ["id", "name"] }],
            order: [["createdAt", "DESC"]],
            limit: opts.limit ?? 20,
            offset: ((opts.page ?? 1) - 1) * (opts.limit ?? 20),
        });

        return rows.map((r) => r.toJSON() as Collection);
    },

    async getByCollectionId(collectionId: string): Promise<Collection | null> {
        const row = await CollectionModel.findByPk(collectionId, {
            include: [{ model: AgentModel, as: "assignedAgent", attributes: ["id", "name", "phone"] }],
        });
        return row ? (row.toJSON() as Collection) : null;
    },
};
