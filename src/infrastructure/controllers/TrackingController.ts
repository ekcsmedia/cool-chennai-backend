import { FastifyInstance } from 'fastify';
import {trackingRepo} from "../repositories/tracking.repository";
import {agentRepo} from "../repositories/agent.repository";

export async function trackingRoutes(app: FastifyInstance) {
    // Called from Agent app to push location
    app.post('/locations', async (req, rep) => {
        const { agentId, lat, lng, recordedAt, batteryLevel, stop } = req.body as any;
        if (!agentId || lat == null || lng == null) return rep.code(400).send({ message: 'agentId, lat, lng required' });
        const ping = await trackingRepo.pushPing({ agentId, lat, lng, recordedAt: recordedAt ? new Date(recordedAt) : new Date(), batteryLevel, stop });
        return ping;
    });

    // Admin live list for dashboard
    app.get('/live/agents', async (req) => {
        const agents = await agentRepo.findAll({ activeOnly: true });
        const latest = await trackingRepo.getLatestByAgents(agents.map(a => a.id));
        const today = new Date();

        const result = await Promise.all(agents.map(async a => ({
            id: a.id,
            name: a.name,
            status: a.status,
            lastSeenAt: (latest[a.id]?.recordedAt) || a.lastSeenAt,
            lastLocation: latest[a.id] ? { lat: latest[a.id]!.lat, lng: latest[a.id]!.lng } : null,
            stopsToday: await trackingRepo.getStopsCount(a.id, today),
        })));

        return result;
    });
}