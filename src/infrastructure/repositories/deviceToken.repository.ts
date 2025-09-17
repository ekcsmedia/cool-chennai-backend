import { Op } from 'sequelize';
import { DeviceTokenModel } from '../models'; // adjust path if needed

export const deviceTokenRepo = {
    async upsertToken({ agentId, token, platform }: { agentId?: string; token: string; platform: 'android' | 'ios' | 'web' }) {
        const existing = await DeviceTokenModel.findOne({ where: { token } });
        if (existing) {
            await existing.update({ agentId: agentId ?? null, platform, lastSeenAt: new Date() });
            return existing.toJSON();
        }
        const row = await DeviceTokenModel.create({ agentId: agentId ?? null, token, platform });
        return row.toJSON();
    },

    async getTokensForAgents(agentIds: string[]) {
        const rows = await DeviceTokenModel.findAll({ where: { agentId: { [Op.in]: agentIds } } });
        return rows.map(r => r.toJSON());
    },

    async getAllTokens() {
        const rows = await DeviceTokenModel.findAll();
        return rows.map(r => r.toJSON());
    },

    async removeToken(token: string) {
        return DeviceTokenModel.destroy({ where: { token } });
    },

    // optional helpers if you add role to model later:
    // async getTokensByRole(role: 'admin' | 'agent') {
    //     // if your model has 'role' column, otherwise this will return []
    //     if ((DeviceTokenModel as any).rawAttributes?.role) {
    //         const rows = await DeviceTokenModel.findAll({ where: { role } });
    //         return rows.map(r => r.toJSON());
    //     }
    //     return [];
    // },
};
