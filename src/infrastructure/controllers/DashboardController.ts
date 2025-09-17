import { FastifyInstance } from 'fastify';
import collectionRepo from "../repositories/SequelizeRepositories";
import {agentRepo} from "../repositories/agent.repository";

export async function dashboardRoutes(app: FastifyInstance) {
    app.get('/dashboard/summary', async () => {
        const { total, pending, completed } = await collectionRepo.getSummaryCounts();
        const agentsActive = await agentRepo.getActiveCount();
        return { totalCollections: total, pending, completed, agentsActive };
    });
}