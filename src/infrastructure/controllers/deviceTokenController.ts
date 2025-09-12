// src/infrastructure/controllers/DeviceTokenController.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import {deviceTokenRepo} from "../repositories/deviceToken.repository";

export const DeviceTokenController = {
    async register(req: FastifyRequest, rep: FastifyReply) {
        const { agentId, token, platform } = req.body as any;
        if (!token || !platform) return rep.code(400).send({ error: 'token and platform required' });
        const saved = await deviceTokenRepo.upsertToken({ agentId, token, platform });
        return rep.code(201).send(saved);
    },

    async unregister(req: FastifyRequest, rep: FastifyReply) {
        const { token } = req.body as any;
        if (!token) return rep.code(400).send({ error: 'token required' });
        await deviceTokenRepo.removeToken(token);
        return rep.send({ ok: true });
    }
};


