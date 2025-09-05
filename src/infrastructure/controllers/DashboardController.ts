import { FastifyInstance } from 'fastify';
import { agentRepo, collectionRepo, trackingRepo } from '../repositories/SequelizeRepositories';

export async function dashboardRoutes(app: FastifyInstance) {
    app.get('/dashboard/summary', async () => {
        const { total, pending, completed } = await collectionRepo.getSummaryCounts();
        const agentsActive = await agentRepo.getActiveCount();
        return { totalCollections: total, pending, completed, agentsActive };
    });
}