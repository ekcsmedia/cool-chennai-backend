import {
    CollectionRepository,
    TrackingRepository,
    NotificationRepository,
    HistoryRepository,
    AgentRepository
} from '../../core/interfaces/Repositories';
import {
    AssignmentModel,
    CollectionModel,
    CustomerModel,
    LocationPingModel,
    NotificationModel,
    TripHistoryModel
} from '../models';
import bcrypt from "bcrypt";
import { AgentModel } from "../models";
import {Agent} from "../../core/entities/Agent";
import {Op} from "sequelize";

export const agentRepo: AgentRepository = {
    async createAgent(name: string, email: string, password: string) {
        const hashed = await bcrypt.hash(password, 10);
        const row = await AgentModel.create({ name, email, password: hashed });
        const obj = row.toJSON() as any;
        // hide password from returned object
        if (obj.password) delete obj.password;
        return obj;
    },

    async getAgents() {
        // exclude password column — this avoids DB errors if column missing
        const rows = await AgentModel.findAll({ attributes: { exclude: ['password'] } });
        return rows.map(r => r.toJSON() as any);
    },

    async getAgentById(id: number) {
        const row = await AgentModel.findByPk(id, { attributes: { exclude: ['password'] } });
        return row ? (row.toJSON() as any) : null;
    },

    async updateAgent(id: number, data: any) {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
        await AgentModel.update(data, { where: { id } });
        // return without password
        const row = await AgentModel.findByPk(id, { attributes: { exclude: ['password'] } });
        return row ? (row.toJSON() as any) : null;
    },

    async deleteAgent(id: number) {
        return AgentModel.destroy({ where: { id } });
    },

    async verifyLogin(email: string, password: string) {
        // explicitly request password column for login check
        const agent = await AgentModel.findOne({
            where: { email },
            attributes: ['id', 'name', 'email', 'password', 'isActive', 'status', 'lastSeenAt'],
        });
        if (!agent) return null;
        const match = await bcrypt.compare(password, agent.get('password') as string);
        if (!match) return null;
        const obj = agent.toJSON() as any;
        delete obj.password; // don't return password to controller
        return obj;
    },

    async getActiveCount() {
        return AgentModel.count({ where: { isActive: true } });
    },

    async findAll(params?: { activeOnly?: boolean }) {
        const where: any = {};
        if (params?.activeOnly) where.isActive = true;
        const rows = await AgentModel.findAll({ where, attributes: { exclude: ['password'] } });
        return rows.map(r => r.toJSON() as any);
    },

    async findById(id: number) {
        const row = await AgentModel.findByPk(id, { attributes: { exclude: ['password'] } });
        return row ? (row.toJSON() as any) : null;
    },

    async updateStatus(id: number, status: string) {
        await AgentModel.update({ status }, { where: { id } });
    },

    async updateLastSeen(id: number, at: Date) {
        await AgentModel.update({ lastSeenAt: at }, { where: { id } });
    },
};

// infrastructure/repositories/SequelizeRepositories.ts

export const collectionRepo: CollectionRepository = {
    async getSummaryCounts() {
        const total = await CollectionModel.count();
        const pending = await CollectionModel.count({ where: { status: "pending" } });
        const completed = await CollectionModel.count({ where: { status: "completed" } });
        return { total, pending, completed };
    },

    async findPending() {
        const rows = await CollectionModel.findAll({
            where: { status: "pending" },
            order: [["createdAt", "DESC"]],
        });
        return rows.map((r) => r.toJSON() as any);
    },

    async findById(id) {
        const row = await CollectionModel.findByPk(id);
        return row ? (row.toJSON() as any) : null;
    },

    async assign(collectionId, agentId) {
        await CollectionModel.update(
            { assignedAgentId: agentId, status: "assigned" },
            { where: { id: collectionId } }
        );
        const assignment = await AssignmentModel.create({
            collectionId,
            agentId,
            assignedAt: new Date(),
        });

        const updatedRow = await CollectionModel.findByPk(collectionId);
        return {
            assignment: assignment.toJSON() as any,
            collection: updatedRow ? (updatedRow.toJSON() as any) : null,
        };
    },

    async update(collectionId, data) {
        await CollectionModel.update(data, { where: { id: collectionId } });
        const row = await CollectionModel.findByPk(collectionId);
        return row ? (row.toJSON() as any) : null;
    },

    async updateStatus(collectionId, status, extra?: any) {
        const payload: any = { status };
        if (extra?.notes !== undefined) payload.notes = extra.notes;
        if (extra?.collectedAmount !== undefined) payload.collectedAmount = extra.collectedAmount;
        if (extra?.deliveredAt !== undefined) payload.deliveredAt = extra.deliveredAt;
        if (extra?.proofUrl !== undefined) payload.proofUrl = extra.proofUrl;

        await CollectionModel.update(payload, { where: { id: collectionId } });
        const row = await CollectionModel.findByPk(collectionId);
        return row ? (row.toJSON() as any) : null;
    },

    async markCollected(collectionId, collectedAmount, notes, proofUrl) {
        const payload: any = {
            status: "collected",
            collectedAmount,
            collectedAt: new Date(),
        };
        if (notes) payload.notes = notes;
        if (proofUrl) payload.proofUrl = proofUrl;

        await CollectionModel.update(payload, { where: { id: collectionId } });
        const row = await CollectionModel.findByPk(collectionId);
        return row ? (row.toJSON() as any) : null;
    },

    async markDelivered(collectionId, notes, proofUrl) {
        const payload: any = {
            status: "completed",
            deliveredAt: new Date(),
        };
        if (notes) payload.notes = notes;
        if (proofUrl) payload.proofUrl = proofUrl;

        await CollectionModel.update(payload, { where: { id: collectionId } });
        const row = await CollectionModel.findByPk(collectionId);
        return row ? (row.toJSON() as any) : null;
    },
};

export const trackingRepo: TrackingRepository = {
    async pushPing(ping) {
        const row = await LocationPingModel.create(ping as any);
        await AgentModel.update({ lastSeenAt: ping.recordedAt, status: ping.stop ? 'idle' : 'on_duty' }, { where: { id: ping.agentId } });
        return row.toJSON() as any;
    },
    async getLatestByAgents(agentIds) {
        const out: Record<string, any> = {};
        for (const id of agentIds) {
            const row = await LocationPingModel.findOne({ where: { agentId: id }, order: [['recordedAt','DESC']] });
            out[id] = row ? (row.toJSON() as any) : null;
        }
        return out;
    },
    async getStopsCount(agentId, date) {
        const start = new Date(date); start.setHours(0,0,0,0);
        const end = new Date(date); end.setHours(23,59,59,999);
        return LocationPingModel.count({ where: { agentId, stop: true, recordedAt: { ['>='] : start, ['<='] : end } } as any });
    },
};

export const notificationRepo: NotificationRepository = {
    async list(role) { const rows = await NotificationModel.findAll({ where: { actorRole: role }, order: [['createdAt','DESC']] }); return rows.map(r=>r.toJSON() as any); },
    async updateStatus(id, status) { await NotificationModel.update({ status }, { where: { id } }); },
};

// inside src/infrastructure/repositories/SequelizeRepositories.ts
// add at top if not present:
export const historyRepo = {
    /**
     * List trip history for an agent.
     * If date is provided (YYYY-MM-DD) it restricts to that day.
     * Pagination supported via page & limit (pass null from route; route will handle defaults).
     */
    async listByAgent(agentId: string, date?: string, page = 1, limit = 20) {
        const where: any = { agentId };

        if (date) {
            const day = new Date(date);
            const start = new Date(day); start.setHours(0,0,0,0);
            const end = new Date(day); end.setHours(23,59,59,999);
            where.startedAt = { [Op.between]: [start, end] };
        }

        const offset = (Math.max(1, page) - 1) * limit;

        const { rows, count } = await TripHistoryModel.findAndCountAll({
            where,
            include: [
                { model: CollectionModel, as: 'collection', attributes: ['id', 'code', 'area', 'city', 'amount', 'status', 'customerId', 'assignedAgentId'] },
                { model: AgentModel, as: 'agent', attributes: ['id', 'name', 'phone'] },
            ],
            order: [['completedAt', 'DESC']],
            limit,
            offset,
        });

        // shape DTOs
        const items = rows.map(r => {
            const trip = r.toJSON() as any;
            return {
                id: trip.id,
                startedAt: trip.startedAt,
                completedAt: trip.completedAt,
                distanceKm: trip.distanceKm,
                routeSummary: trip.routeSummary,
                collection: trip.collection ? {
                    id: trip.collection.id,
                    code: trip.collection.code,
                    address: [trip.collection.area, trip.collection.city].filter(Boolean).join(' • '),
                    amount: trip.collection.amount,
                    status: trip.collection.status,
                    customerId: trip.collection.customerId,
                } : null,
                agent: trip.agent ? { id: trip.agent.id, name: trip.agent.name, phone: trip.agent.phone } : null,
            };
        });

        return { items, total: count, page, limit };
    },

    /**
     * List trip history for a customer (all trips that reference collections with this customerId).
     * Supports date range and pagination.
     */
    async listByCustomer(customerId: string, from?: string, to?: string, page = 1, limit = 20) {
        // first find collections for the customer
        const colWhere: any = { customerId };

        // optionally restrict by collection createdAt if from/to provided
        if (from || to) {
            colWhere.createdAt = {};
            if (from) colWhere.createdAt[Op.gte] = new Date(from);
            if (to) colWhere.createdAt[Op.lte] = new Date(to);
        }

        // join through trip history via collectionId
        const offset = (Math.max(1, page) - 1) * limit;

        const { rows, count } = await TripHistoryModel.findAndCountAll({
            include: [
                {
                    model: CollectionModel,
                    as: 'collection',
                    where: colWhere,
                    attributes: ['id', 'code', 'area', 'city', 'amount', 'status', 'customerId'],
                },
                { model: AgentModel, as: 'agent', attributes: ['id', 'name'] },
            ],
            order: [['completedAt', 'DESC']],
            limit,
            offset,
        });

        const items = rows.map(r => {
            const trip = r.toJSON() as any;
            return {
                id: trip.id,
                startedAt: trip.startedAt,
                completedAt: trip.completedAt,
                distanceKm: trip.distanceKm,
                routeSummary: trip.routeSummary,
                collection: trip.collection ? {
                    id: trip.collection.id,
                    code: trip.collection.code,
                    address: [trip.collection.area, trip.collection.city].filter(Boolean).join(' • '),
                    amount: trip.collection.amount,
                    status: trip.collection.status,
                } : null,
                agent: trip.agent ? { id: trip.agent.id, name: trip.agent.name } : null,
            };
        });

        return { items, total: count, page, limit };
    },

    /**
     * Admin listing: search across trip_history (joined with collections & agents & customers).
     * Filters: from/to (dates restrict completedAt), agentId, customerId, status (collection status), pagination.
     */
    async listCollectionsHistory({ from, to, agentId, customerId, status, page = 1, limit = 20 }: {
        from?: string; to?: string; agentId?: string; customerId?: string; status?: string; page?: number; limit?: number;
    }) {
        const where: any = {};
        if (from || to) {
            where.completedAt = {};
            if (from) where.completedAt[Op.gte] = new Date(from);
            if (to) where.completedAt[Op.lte] = new Date(to);
        }
        if (agentId) where.agentId = agentId;

        // For customer/status filters we push conditions into collection include
        const collectionWhere: any = {};
        if (customerId) collectionWhere.customerId = customerId;
        if (status) collectionWhere.status = status;

        const offset = (Math.max(1, page) - 1) * limit;

        const { rows, count } = await TripHistoryModel.findAndCountAll({
            where,
            include: [
                { model: CollectionModel, as: 'collection', where: Object.keys(collectionWhere).length ? collectionWhere : undefined, attributes: ['id','code','area','city','amount','status','customerId'] },
                { model: AgentModel, as: 'agent', attributes: ['id','name','phone'] },
                { model: CustomerModel, as: 'customer', attributes: ['id','name'], required: false }, // optional if you linked customer on history
            ],
            order: [['completedAt', 'DESC']],
            limit,
            offset,
        });

        const items = rows.map(r => {
            const trip = r.toJSON() as any;
            return {
                id: trip.id,
                startedAt: trip.startedAt,
                completedAt: trip.completedAt,
                distanceKm: trip.distanceKm,
                routeSummary: trip.routeSummary,
                collection: trip.collection ? {
                    id: trip.collection.id,
                    code: trip.collection.code,
                    address: [trip.collection.area, trip.collection.city].filter(Boolean).join(' • '),
                    amount: trip.collection.amount,
                    status: trip.collection.status,
                } : null,
                agent: trip.agent ? { id: trip.agent.id, name: trip.agent.name } : null,
            };
        });

        return { items, total: count, page, limit };
    },

    /**
     * single collection trips (return all trips for a given collection id)
     */
    async getByCollectionId(collectionId: string) {
        const rows = await TripHistoryModel.findAll({
            where: { collectionId },
            include: [
                { model: AgentModel, as: 'agent', attributes: ['id','name'] },
                { model: CollectionModel, as: 'collection', attributes: ['id','code','area','city','amount','status','customerId'] },
            ],
            order: [['startedAt', 'ASC']],
        });

        return rows.map(r => {
            const trip = r.toJSON() as any;
            return {
                id: trip.id,
                startedAt: trip.startedAt,
                completedAt: trip.completedAt,
                distanceKm: trip.distanceKm,
                routeSummary: trip.routeSummary,
                agent: trip.agent ? { id: trip.agent.id, name: trip.agent.name } : null,
                collection: trip.collection ? {
                    id: trip.collection.id,
                    code: trip.collection.code,
                    address: [trip.collection.area, trip.collection.city].filter(Boolean).join(' • '),
                    amount: trip.collection.amount,
                    status: trip.collection.status,
                } : null,
            };
        });
    },
};
