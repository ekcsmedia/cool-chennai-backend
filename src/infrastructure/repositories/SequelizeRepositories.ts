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
import {Op, Transaction} from "sequelize";
import sequelize from "../sequelize";

export const agentRepo: AgentRepository = {
    async createAgent(name: string, email: string, password: string, phone?: string) {
        const hashed = await bcrypt.hash(password, 10);
        const row = await AgentModel.create({ name,
            email,
            phone,
            password: hashed });
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

    async getAgentById(id: string) {
        const row = await AgentModel.findByPk(id, { attributes: { exclude: ['password'] } });
        return row ? (row.toJSON() as any) : null;
    },

    async updateAgent(id: string, data: any) {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
        await AgentModel.update(data, { where: { id } });
        // return without password
        const row = await AgentModel.findByPk(id, { attributes: { exclude: ['password'] } });
        return row ? (row.toJSON() as any) : null;
    },

    async deleteAgent(id: string) {
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

    async findById(id: string) {
        const row = await AgentModel.findByPk(id, { attributes: { exclude: ['password'] } });
        return row ? (row.toJSON() as any) : null;
    },

    async updateStatus(id: string, status: string) {
        await AgentModel.update({ status }, { where: { id } });
    },

    async updateLastSeen(id: string, at: Date) {
        await AgentModel.update({ lastSeenAt: at }, { where: { id } });
    },
};

// infrastructure/repositories/SequelizeRepositories.ts

export const collectionRepo: CollectionRepository = {

    async create(payload: {
        code?: string;
        title: string;
        address: string;
        amount: number;
        type?: 'pickup'|'delivery'|'service';
        area?: string | null;
        city?: string | null;
        customerId?: string | null;
        assignedAgentId?: string | null;
        dueAt?: Date | null;
    }) {
        if (!payload.title || !payload.address || payload.amount == null) {
            throw new Error('title, address and amount are required');
        }

        const t: Transaction = await sequelize.transaction();
        try {
            const row = await CollectionModel.create({
                code: payload.code ?? "",
                title: payload.title,
                address: payload.address,
                amount: payload.amount,
                type: payload.type ?? 'pickup',
                area: payload.area ?? null,
                city: payload.city ?? null,
                customerId: payload.customerId ?? null,
                assignedAgentId: payload.assignedAgentId ?? null,
                dueAt: payload.dueAt ?? null,
                status: 'pending',
            }, { transaction: t });

            if (payload.assignedAgentId) {
                const agentExists = await AgentModel.findByPk(payload.assignedAgentId, { transaction: t });
                if (!agentExists) {
                    throw new Error(`Agent not found: ${payload.assignedAgentId}`);
                }

                await AssignmentModel.create({
                    collectionId: row.id,
                    agentId: payload.assignedAgentId,
                    assignedAt: new Date(),
                }, { transaction: t });
            }

            await t.commit();

            const created = await CollectionModel.findByPk(row.id, {
                include: [{ model: AgentModel, as: 'assignedAgent', attributes: ['id','name','phone'] }]
            });

            return created ? (created.toJSON() as any) : (row.toJSON() as any);
        } catch (err) {
            // safe rollback attempt
            try { await t.rollback(); } catch (rollbackErr) { /* ignore rollback errors */ }
            throw err;
        }
    },
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
            include: [{ model: AgentModel, as: 'assignedAgent', attributes: ['id', 'name'] }]
        });
        return rows.map((r) => r.toJSON() as any);
    },

    // new: generic findAll with optional filters + pagination
    async findAll(opts?: { filters?: any; page?: number; limit?: number }) {
        const where: any = {};
        if (opts?.filters) {
            if (opts.filters.status) where.status = opts.filters.status;
            if (opts.filters.assignedAgentId) where.assignedAgentId = opts.filters.assignedAgentId;
            if (opts.filters.customerId) where.customerId = opts.filters.customerId;
        }
        const page = opts?.page && opts.page > 0 ? opts.page : 1;
        const limit = opts?.limit && opts.limit > 0 ? opts.limit : 50;
        const offset = (page - 1) * limit;

        const { rows, count } = await CollectionModel.findAndCountAll({
            where,
            order: [["createdAt", "DESC"]],
            limit,
            offset,
            include: [{ model: AgentModel, as: 'assignedAgent', attributes: ['id', 'name'] }]
        });

        return { items: rows.map(r => r.toJSON() as any), total: count, page, limit };
    },

    async findById(id: string) {
        const row = await CollectionModel.findByPk(id, {
            include: [{ model: AgentModel, as: 'assignedAgent', attributes: ['id', 'name', 'phone'] }]
        });
        return row ? (row.toJSON() as any) : null;
    },

    async assign(collectionId: string, agentId: string) {
        if (!collectionId || !agentId) throw new Error('collectionId and agentId required');

        const t: Transaction = await sequelize.transaction();
        try {
            const agent = await AgentModel.findByPk(agentId, { transaction: t });
            if (!agent) throw new Error(`Agent not found: ${agentId}`);

            await CollectionModel.update(
                { assignedAgentId: agentId, status: 'assigned' },
                { where: { id: collectionId }, transaction: t }
            );

            const assignment = await AssignmentModel.create({
                collectionId,
                agentId,
                assignedAt: new Date(),
            }, { transaction: t });

            await t.commit();

            const updatedRow = await CollectionModel.findByPk(collectionId, {
                include: [{ model: AgentModel, as: 'assignedAgent', attributes: ['id','name','phone'] }],
            });

            return {
                assignment: assignment.toJSON() as any,
                collection: updatedRow ? (updatedRow.toJSON() as any) : null,
            };
        } catch (err) {
            try { await t.rollback(); } catch (_) { /* ignore */ }
            throw err;
        }
    },

    async update(collectionId: string, data: any) {
        await CollectionModel.update(data, { where: { id: collectionId } });
        const row = await CollectionModel.findByPk(collectionId, {
            include: [{ model: AgentModel, as: 'assignedAgent', attributes: ['id','name'] }]
        });
        return row ? (row.toJSON() as any) : null;
    },

    async updateStatus(collectionId: string, status: string, extra?: any) {
        const payload: any = { status };
        if (extra?.notes !== undefined) payload.notes = extra.notes;
        if (extra?.collectedAmount !== undefined) payload.collectedAmount = extra.collectedAmount;
        if (extra?.deliveredAt !== undefined) payload.deliveredAt = extra.deliveredAt;
        if (extra?.proofUrl !== undefined) payload.proofUrl = extra.proofUrl;

        await CollectionModel.update(payload, { where: { id: collectionId } });
        const row = await CollectionModel.findByPk(collectionId, {
            include: [{ model: AgentModel, as: 'assignedAgent', attributes: ['id','name'] }]
        });
        return row ? (row.toJSON() as any) : null;
    },

    async markCollected(collectionId: string, collectedAmount?: number, notes?: string, proofUrl?: string) {
        const payload: any = {
            status: "collected",
            collectedAmount,
            collectedAt: new Date(),
        };
        if (notes) payload.notes = notes;
        if (proofUrl) payload.proofUrl = proofUrl;

        await CollectionModel.update(payload, { where: { id: collectionId } });
        const row = await CollectionModel.findByPk(collectionId, {
            include: [{ model: AgentModel, as: 'assignedAgent', attributes: ['id','name'] }]
        });
        return row ? (row.toJSON() as any) : null;
    },

    async markDelivered(collectionId: string, notes?: string, proofUrl?: string) {
        const payload: any = {
            status: "completed",
            deliveredAt: new Date(),
        };
        if (notes) payload.notes = notes;
        if (proofUrl) payload.proofUrl = proofUrl;

        await CollectionModel.update(payload, { where: { id: collectionId } });
        const row = await CollectionModel.findByPk(collectionId, {
            include: [{ model: AgentModel, as: 'assignedAgent', attributes: ['id','name'] }]
        });
        return row ? (row.toJSON() as any) : null;
    },

    // NEW: delete (soft delete if paranoid=true)
    async delete(collectionId: string) {
        return CollectionModel.destroy({ where: { id: collectionId } });
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

// add/replace inside your SequelizeRepositories.ts (or notificationRepo file)
/**
 * NotificationRepository
 * NotificationModel fields (from your schema):
 *  id, title, body, kind, status, actorRole ('admin'|'agent'), meta (JSON), createdAt, dueAt
 */
export const notificationRepo = {
    // create + optionally target an agentId in meta
    async create(payload: {
        title: string;
        body: string;
        kind?: 'assignment' | 'overdue' | 'generic';
        actorRole?: 'admin' | 'agent';
        meta?: any;
        dueAt?: Date | string | null;
    }) {
        const row = await NotificationModel.create({
            title: payload.title,
            body: payload.body,
            kind: payload.kind ?? 'generic',
            actorRole: payload.actorRole ?? 'admin',
            meta: payload.meta ?? null,
            status: 'new',
            createdAt: new Date(),
            dueAt: payload.dueAt ?? null,
        });
        return row.toJSON() as any;
    },

    // list by actorRole; newest first
    async list(actorRole: 'admin' | 'agent') {
        const rows = await NotificationModel.findAll({
            where: { actorRole },
            order: [['createdAt', 'DESC']],
        });
        return rows.map((r) => r.toJSON() as any);
    },

    async updateStatus(id: string, status: 'new' | 'snoozed' | 'in_progress' | 'done') {
        await NotificationModel.update({ status }, { where: { id } });
        const row = await NotificationModel.findByPk(id);
        return row ? (row.toJSON() as any) : null;
    },

    // optional: list unread or since date
    async listUnread(actorRole: 'admin' | 'agent') {
        const rows = await NotificationModel.findAll({
            where: {
                actorRole,
                status: { [Op.ne]: 'done' },
            },
            order: [['createdAt', 'DESC']],
        });
        return rows.map((r) => r.toJSON() as any);
    },
};


// inside src/infrastructure/repositories/SequelizeRepositories.ts
// add at top if not present:
// imports (ensure these are present at top of file)
// historyRepo (only the history-related functions shown)
export const historyRepo = {
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
                {
                    model: CollectionModel,
                    as: 'collection',
                    attributes: ['id', 'code', 'area', 'city', 'amount', 'status', 'customerId', 'assignedAgentId'],
                    include: [
                        {
                            model: CustomerModel,
                            as: 'customer',
                            attributes: ['id', 'name', 'phone'],
                            required: false,
                        },
                    ],
                },
                { model: AgentModel, as: 'agent', attributes: ['id', 'name', 'phone'] },
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
                    customer: trip.collection.customer ? { id: trip.collection.customer.id, name: trip.collection.customer.name, phone: trip.collection.customer.phone } : null,
                } : null,
                agent: trip.agent ? { id: trip.agent.id, name: trip.agent.name, phone: trip.agent.phone } : null,
            };
        });

        return { items, total: count, page, limit };
    },

    async listByCustomer(customerId: string, from?: string, to?: string, page = 1, limit = 20) {
        // We will join TripHistory -> Collection and restrict collection.customerId
        const collectionWhere: any = { customerId };
        if (from || to) {
            collectionWhere.createdAt = {};
            if (from) collectionWhere.createdAt[Op.gte] = new Date(from);
            if (to) collectionWhere.createdAt[Op.lte] = new Date(to);
        }

        const offset = (Math.max(1, page) - 1) * limit;

        const { rows, count } = await TripHistoryModel.findAndCountAll({
            include: [
                {
                    model: CollectionModel,
                    as: 'collection',
                    where: collectionWhere,
                    attributes: ['id', 'code', 'area', 'city', 'amount', 'status', 'customerId'],
                    include: [
                        { model: CustomerModel, as: 'customer', attributes: ['id','name','phone'], required: false }
                    ],
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
                    customer: trip.collection.customer ? { id: trip.collection.customer.id, name: trip.collection.customer.name } : null,
                } : null,
                agent: trip.agent ? { id: trip.agent.id, name: trip.agent.name } : null,
            };
        });

        return { items, total: count, page, limit };
    },

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

        const collectionWhere: any = {};
        if (customerId) collectionWhere.customerId = customerId;
        if (status) collectionWhere.status = status;

        const offset = (Math.max(1, page) - 1) * limit;

        const { rows, count } = await TripHistoryModel.findAndCountAll({
            where,
            include: [
                {
                    model: CollectionModel,
                    as: 'collection',
                    where: Object.keys(collectionWhere).length ? collectionWhere : undefined,
                    attributes: ['id','code','area','city','amount','status','customerId'],
                    include: [
                        { model: CustomerModel, as: 'customer', attributes: ['id','name'], required: false }
                    ],
                },
                { model: AgentModel, as: 'agent', attributes: ['id','name','phone'] },
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
                    customer: trip.collection.customer ? { id: trip.collection.customer.id, name: trip.collection.customer.name } : null,
                } : null,
                agent: trip.agent ? { id: trip.agent.id, name: trip.agent.name } : null,
            };
        });

        return { items, total: count, page, limit };
    },

    async getByCollectionId(collectionId: string) {
        const rows = await TripHistoryModel.findAll({
            where: { collectionId },
            include: [
                { model: AgentModel, as: 'agent', attributes: ['id','name'] },
                {
                    model: CollectionModel,
                    as: 'collection',
                    attributes: ['id','code','area','city','amount','status','customerId'],
                    include: [{ model: CustomerModel, as: 'customer', attributes: ['id','name','phone'], required: false }]
                },
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
                    customer: trip.collection.customer ? { id: trip.collection.customer.id, name: trip.collection.customer.name } : null,
                } : null,
            };
        });
    },
};

