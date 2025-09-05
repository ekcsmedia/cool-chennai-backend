import { FastifyInstance } from 'fastify';
import { historyRepo } from '../repositories/SequelizeRepositories';

export async function historyRoutes(app: FastifyInstance) {
    app.get('/history/agent/:agentId', async (req) => {
        const { agentId } = (req.params as any);
        const { date } = (req.query as any);
        return historyRepo.listByAgent(agentId, date);
    });

    app.get('/history/customer/:customerId', async (req) => {
        const { customerId } = (req.params as any);
        return historyRepo.listByCustomer(customerId);
    });
}