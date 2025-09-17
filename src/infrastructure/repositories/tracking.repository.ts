// basic tracking repo (uses a LocationPing or CollectionPing model)
import { Op } from 'sequelize';
import {CollectionPingModel} from "../models/collection_ping_model";

export const trackingRepo = {
    async pushPing(ping: {
        collectionId?: string | null;
        agentId: string;
        lat?: number;
        lng?: number;
        ts?: Date;               // client timestamp (optional)
        recordedAt?: Date;       // server-provided recordedAt (optional)
        batteryLevel?: number;
        stop?: boolean;
        raw?: any;
    }) {
        // Build raw payload to persist any extra meta
        const rawPayload = { ...(ping.raw ?? {}) };
        if (typeof ping.stop !== 'undefined') rawPayload.stop = ping.stop;

        const created = await CollectionPingModel.create({
            collectionId: ping.collectionId ?? "",
            agentId: ping.agentId,
            lat: ping.lat ?? null,
            lng: ping.lng ?? null,
            batteryLevel: ping.batteryLevel ?? null,
            // ts: prefer client-provided timestamp, fallback to now
            ts: ping.ts ?? new Date(),
            // recordedAt is server arrival time: prefer provided recordedAt else now
            recordedAt: ping.recordedAt ?? new Date(),
            raw: rawPayload,
        });

        return created.toJSON() as any;
    },

    async getLatestByAgents(agentIds: string[]) {
        // returns map agentId -> latest ping or null
        const rows = await CollectionPingModel.findAll({
            where: { agentId: { [Op.in]: agentIds } },
            order: [['ts', 'DESC']],
            limit: 1000,
        });
        const map: Record<string, any> = {};
        for (const r of rows) {
            const obj = r.toJSON() as any;
            if (!map[obj.agentId]) map[obj.agentId] = obj;
        }
        // ensure every id exists in map
        for (const id of agentIds) {
            if (!map[id]) map[id] = null;
        }
        return map;
    },

    async getStopsCount(agentId: string, date: Date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        return CollectionPingModel.count({ where: { agentId, ts: { [Op.between]: [start, end] } } });
    },
};
