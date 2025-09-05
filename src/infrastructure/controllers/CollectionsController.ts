import { FastifyInstance } from 'fastify';
import { collectionRepo } from '../repositories/SequelizeRepositories';

export async function collectionRoutes(app: FastifyInstance) {
    app.get('/collections', async (req) => {
        const status = (req.query as any)?.status;
        if (status === 'pending') return collectionRepo.findPending();
        // extend as needed
        return collectionRepo.findPending();
    });

    app.post('/assignments', async (req, rep) => {
        const { collectionId, agentId } = req.body as any;
        if (!collectionId || !agentId) return rep.code(400).send({ message: 'collectionId and agentId required' });
        const assignment = await collectionRepo.assign(collectionId, agentId);
        return assignment;
    });
}