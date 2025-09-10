import { FastifyInstance } from 'fastify';
import { HistoryController } from '../controllers/HistoryController';

export async function historyRoutes(app: FastifyInstance) {
    // agent specific history (optionally day)
    app.get('/history/agent/:agentId', HistoryController.listAgent);

    // customer specific history (range)
    app.get('/history/customer/:customerId', HistoryController.listCustomer);

    // admin collection history search / filter
    app.get('/history/collections', HistoryController.listCollections);

    // single collection trip details
    app.get('/history/collections/:collectionId', HistoryController.getCollectionDetail);
}
