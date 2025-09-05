import { FastifyInstance } from 'fastify';
import { notificationRepo } from '../repositories/SequelizeRepositories';

export async function notificationsRoutes(app: FastifyInstance) {
    app.get('/notifications', async (req) => {
        const role = ((req.query as any)?.role || 'admin') as 'admin' | 'agent';
        return notificationRepo.list(role);
    });

    app.post('/notifications/:id/status', async (req) => {
        const { id } = (req.params as any);
        const { status } = (req.body as any);
        await notificationRepo.updateStatus(id, status);
        return { ok: true };
    });
}