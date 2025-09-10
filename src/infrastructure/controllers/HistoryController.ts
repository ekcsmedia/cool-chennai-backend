import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { historyRepo } from '../repositories/SequelizeRepositories';

export const HistoryController = {
    async listAgent(req: FastifyRequest, rep: FastifyReply) {
        const { agentId } = req.params as any;
        const { date, page = '1', limit = '20' } = req.query as any;
        const res = await historyRepo.listByAgent(agentId, date, Number(page), Number(limit));
        return rep.send(res);
    },

    async listCustomer(req: FastifyRequest, rep: FastifyReply) {
        const { customerId } = req.params as any;
        const { from, to, page = '1', limit = '20' } = req.query as any;
        const res = await historyRepo.listByCustomer(customerId, from, to, Number(page), Number(limit));
        return rep.send(res);
    },

    async listCollections(req: FastifyRequest, rep: FastifyReply) {
        const { from, to, agentId, customerId, status, page = '1', limit = '20' } = req.query as any;
        const res = await historyRepo.listCollectionsHistory({ from, to, agentId, customerId, status, page: Number(page), limit: Number(limit) });
        return rep.send(res);
    },

    async getCollectionDetail(req: FastifyRequest, rep: FastifyReply) {
        const { collectionId } = req.params as any;
        const res = await historyRepo.getByCollectionId(collectionId);
        return rep.send(res);
    },
};
