import { FastifyReply, FastifyRequest } from "fastify";
import {agentRepo} from "../repositories/SequelizeRepositories";

export class AgentController {
    static async create(req: FastifyRequest, rep: FastifyReply) {
        const { name, email, password, phone } = req.body as any;
        const agent = await agentRepo.createAgent(name, email, password, phone);
        return rep.send(agent);
    }

    static async list(req: FastifyRequest, rep: FastifyReply) {
        const repos = await import('../repositories/SequelizeRepositories');
        const { agentRepo } = repos;

        if (!agentRepo) return rep.code(500).send({ message: 'agentRepo not available' });

        try {
            const agents = await agentRepo.getAgents();
            return rep.send(agents);
        } catch (err: any) {
            req.log.error(err);
            return rep.code(500).send({ message: 'Failed', detail: err.message ?? String(err) });
        }
    }

    static async get(req: FastifyRequest, rep: FastifyReply) {
        const { id } = req.params as any;
        const agent = await agentRepo.getAgentById(id);
        return agent
            ? rep.send(agent)
            : rep.code(404).send({ error: "Not found" });
    }

    static async update(req: FastifyRequest, rep: FastifyReply) {
        const { id } = req.params as any;
        const updated = await agentRepo.updateAgent(id, req.body as any);
        return rep.send(updated);
    }

    static async delete(req: FastifyRequest, rep: FastifyReply) {
        const { id } = req.params as any;
        await agentRepo.deleteAgent(id);
        return rep.send({ success: true });
    }

    static async login(req: FastifyRequest, rep: FastifyReply) {
        const { email, password } = req.body as any;
        const agent = await agentRepo.verifyLogin(email, password);
        if (!agent) return rep.code(401).send({ error: "Invalid credentials" });
        return rep.send(agent);
    }

    // 🔹 NEW: wrapper for agentRepo.findById
    static async findById(req: FastifyRequest, rep: FastifyReply) {
        const { id } = req.params as any;
        const agent = await agentRepo.findById(id);
        return agent
            ? rep.send(agent)
            : rep.code(404).send({ error: "Not found" });
    }

    // 🔹 NEW: wrapper for agentRepo.updateStatus
    static async updateStatus(req: FastifyRequest, rep: FastifyReply) {
        const { id } = req.params as any;
        const { status } = req.body as any;
        await agentRepo.updateStatus(id, status);
        return rep.send({ success: true });
    }

    // 🔹 NEW: wrapper for agentRepo.updateLastSeen
    static async updateLastSeen(req: FastifyRequest, rep: FastifyReply) {
        const { id } = req.params as any;
        const { at } = req.body as any; // expect ISO string
        await agentRepo.updateLastSeen(id, new Date(at));
        return rep.send({ success: true });
    }
}