import { AgentRepository, CollectionRepository, TrackingRepository, NotificationRepository, HistoryRepository } from '../../core/interfaces/Repositories';
import { Agent } from '../../core/entities/Agent';
import { AgentModel, AssignmentModel, CollectionModel, LocationPingModel, NotificationModel, TripHistoryModel } from '../models';

export const agentRepo: AgentRepository = {
    async getActiveCount() {
        return AgentModel.count({ where: { isActive: true } });
    },
    async findAll(params) {
        const where: any = {};
        if (params?.activeOnly) where.isActive = true;
        const rows = await AgentModel.findAll({ where });
        return rows.map(r => r.toJSON() as any);
    },
    async findById(id) {
        const row = await AgentModel.findByPk(id);
        return row ? (row.toJSON() as any) : null;
    },
    async updateStatus(id, status) { await AgentModel.update({ status }, { where: { id } }); },
    async updateLastSeen(id, at) { await AgentModel.update({ lastSeenAt: at }, { where: { id } }); },
};

export const collectionRepo: CollectionRepository = {
    async getSummaryCounts() {
        const total = await CollectionModel.count();
        const pending = await CollectionModel.count({ where: { status: 'pending' } });
        const completed = await CollectionModel.count({ where: { status: 'completed' } });
        return { total, pending, completed };
    },
    async findPending() {
        const rows = await CollectionModel.findAll({ where: { status: 'pending' }, order: [['createdAt','DESC']] });
        return rows.map(r => r.toJSON() as any);
    },
    async findById(id) {
        const row = await CollectionModel.findByPk(id);
        return row ? (row.toJSON() as any) : null;
    },
    async assign(collectionId, agentId) {
        await CollectionModel.update({ assignedAgentId: agentId, status: 'assigned' }, { where: { id: collectionId } });
        const a = await AssignmentModel.create({ collectionId, agentId, assignedAt: new Date() });
        return a.toJSON() as any;
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

export const historyRepo: HistoryRepository = {
    async listByAgent(agentId, date) {
        const where: any = { agentId };
        if (date) {
            const day = new Date(date);
            const start = new Date(day); start.setHours(0,0,0,0);
            const end = new Date(day); end.setHours(23,59,59,999);
            where.startedAt = { ['>=']: start, ['<=']: end };
        }
        const rows = await TripHistoryModel.findAll({ where, order: [['completedAt','DESC']] });
        return rows.map(r => r.toJSON() as any);
    },
    async listByCustomer(customerId) {
        // naive join through collections
        const rows = await TripHistoryModel.sequelize!.query(
            `SELECT th.* FROM trip_history th JOIN collections c ON c.id = th.collectionId WHERE c.customerId = :customerId ORDER BY th.completedAt DESC`,
            { replacements: { customerId }, type: 'SELECT' as any }
        );
        return rows as any;
    },
};