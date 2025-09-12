// src/infrastructure/repositories/deviceTokenRepo.ts
import { DeviceTokenModel } from '../models';

export const deviceTokenRepo = {

    async saveToken(userId: string, role: "admin" | "agent", token: string) {
        await DeviceTokenModel.upsert({ userId, role, token });
    },

    async getTokensByRole(role: "admin" | "agent") {
        return DeviceTokenModel.findAll({ where: { role } });
    },

    async upsertToken({ agentId, token, platform }: { agentId?: string; token: string; platform: string }) {
        const existing = await DeviceTokenModel.findOne({ where: { token } });
        if (existing) {
            await existing.update({ agentId, platform, lastSeenAt: new Date() });
            return existing.toJSON() as any;
        }
        const row = await DeviceTokenModel.create({ agentId: agentId ?? null, token, platform });
        return row.toJSON() as any;
    },

    async getTokensForAgents(agentIds: string[]) {
        const rows = await DeviceTokenModel.findAll({ where: { agentId: agentIds } });
        return rows.map(r => r.toJSON() as any);
    },

    async getTokensForAllAgents() {
        const rows = await DeviceTokenModel.findAll();
        return rows.map(r => r.toJSON() as any);
    },

    async removeToken(token: string) {
        return DeviceTokenModel.destroy({ where: { token } });
    }
};
