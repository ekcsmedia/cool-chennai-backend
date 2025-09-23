// simple agent repo with getActiveCount + basic methods
import { Op } from 'sequelize';
import { AgentModel } from '../models'; // adjust path if needed

export const agentRepo = {
    async createAgent(name: string, email: string, password: string, phone?: string) {
        const row = await AgentModel.create({ name, email, password, phone });
        return row.toJSON();
    },

    async getAgents() {
        const rows = await AgentModel.findAll({ order: [['createdAt', 'DESC']] });
        return rows.map(r => r.toJSON());
    },

    async getAgentById(id: string) {
        const row = await AgentModel.findByPk(id);
        return row ? row.toJSON() : null;
    },

    async updateAgent(id: string, data: Partial<any>) {
        await AgentModel.update(data, { where: { id } });
        const row = await AgentModel.findByPk(id);
        return row ? row.toJSON() : null;
    },

    async deleteAgent(id: string) {
        return AgentModel.destroy({ where: { id } });
    },

    async verifyLogin(email: string, password: string) {
        const row = await AgentModel.findOne({ where: { email, password } });
        return row ? row.toJSON() : null;
    },

    async getActiveCount() {
        // if you have an 'active' column otherwise use lastSeenAt recent threshold
        try {
            // prefer explicit active flag:
            if ((AgentModel as any).rawAttributes && (AgentModel as any).rawAttributes.active) {
                return AgentModel.count({ where: { isActive: true } });
            }
            // fallback: agents seen in last 10 minutes
            const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
            return AgentModel.count({ where: { lastSeenAt: { [Op.gte]: tenMinAgo } } });
        } catch {
            return AgentModel.count();
        }
    },

    async findAll(params?: { activeOnly?: boolean }) {
        const where: any = {};
        if (params?.activeOnly) {
            const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
            where.lastSeenAt = { [Op.gte]: tenMinAgo };
        }
        const rows = await AgentModel.findAll({ where, order: [['createdAt', 'DESC']] });
        return rows.map(r => r.toJSON());
    },

    async findById(id: string) {
        const row = await AgentModel.findByPk(id);
        return row ? row.toJSON() : null;
    },

    async updateStatus(id: string, status: 'on_duty' | 'idle' | 'off_duty') {
        await AgentModel.update({ status }, { where: { id } });
    },

    async updateLastSeen(id: string, at: Date) {
        await AgentModel.update({ lastSeenAt: at }, { where: { id } });
    },
};
