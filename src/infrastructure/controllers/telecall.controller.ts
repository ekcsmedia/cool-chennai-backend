import { FastifyInstance } from 'fastify';
import * as CallRepo from '../repositories/calllog.repo';
import { CallAssignmentModel } from '../models/callAssignment.model';
import { TelecallerModel } from '../models/telecaller.model';
import { CustomerModel } from '../models/customers.model';
import bcrypt from 'bcrypt';
import { getCallLogsFiltered } from '../repositories/calllog.repo';

export const registerTelecallRoutes = (fastify: FastifyInstance) => {

    // -------------------------
    // Telecaller login (with bcrypt check)
    // -------------------------
    fastify.post('/telecaller/login', async (req, reply) => {
        try {
            const { email, password } = req.body as any;
            if (!email || !password) return reply.code(400).send({ error: 'email and password required' });

            const user = await TelecallerModel.findOne({ where: { email } });
            if (!user) return reply.code(401).send({ error: 'Invalid credentials' });

            // compare password with stored hash
            const ok = await bcrypt.compare(password, (user as any).passwordHash || '');
            if (!ok) return reply.code(401).send({ error: 'Invalid credentials' });

            // TODO: sign real JWT here
            return reply.send({
                id: user.id,
                name: user.name,
                email: user.email,
                token: 'fake-jwt-token',
            });
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'internal server error' });
        }
    });

    // -------------------------
    // Create telecaller
    // -------------------------
    fastify.post('/telecallers', async (req, reply) => {
        try {
            const { name, email, password, phone } = req.body as any;
            if (!name || !email || !password) {
                return reply.code(400).send({ error: 'name, email and password are required' });
            }

            const existing = await TelecallerModel.findOne({ where: { email } });
            if (existing) return reply.code(409).send({ error: 'email already in use' });

            const passwordHash = await bcrypt.hash(password, 10);
            const created = await TelecallerModel.create({ name, email, phone, passwordHash });

            // send back safe fields only
            return reply.code(201).send({
                id: created.id,
                name: created.name,
                email: created.email,
                phone: created.phone,
                createdAt: created.createdAt,
                updatedAt: created.updatedAt,
            });
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'internal server error' });
        }
    });

    // -------------------------
    // List telecallers (with pagination & search)
    // -------------------------
    fastify.get('/telecallers', async (req, reply) => {
        try {
            const q: any = req.query || {};
            const limit = q.limit ? parseInt(q.limit, 10) : 100;
            const offset = q.offset ? parseInt(q.offset, 10) : 0;
            const where: any = {};

            if (q.search) {
                // simple search on name/email (Sequelize syntax assumed)
                // if you use raw queries or different ORM, adjust accordingly
                where.$or = [
                    { name: { $like: `%${q.search}%` } },
                    { email: { $like: `%${q.search}%` } },
                ];
            }

            const telecallers = await TelecallerModel.findAll({
                attributes: ['id', 'name', 'email', 'phone', 'createdAt', 'updatedAt'],
                where: Object.keys(where).length ? where : undefined,
                limit,
                offset,
                order: [['createdAt', 'DESC']],
            });

            return reply.send(telecallers);
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'internal server error' });
        }
    });

    // -------------------------
    // Get single telecaller
    // -------------------------
    fastify.get('/telecallers/:id', async (req, reply) => {
        try {
            const { id } = req.params as any;
            const t = await TelecallerModel.findByPk(id, {
                attributes: ['id', 'name', 'email', 'phone', 'createdAt', 'updatedAt'],
            });
            if (!t) return reply.code(404).send({ error: 'Not found' });
            return reply.send(t);
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'internal server error' });
        }
    });

    // -------------------------
    // Update telecaller (PUT) - can update password by sending `password`
    // -------------------------
    fastify.put('/telecallers/:id', async (req, reply) => {
        try {
            const { id } = req.params as any;
            const { name, email, phone, password } = req.body as any;

            const t = await TelecallerModel.findByPk(id);
            if (!t) return reply.code(404).send({ error: 'Not found' });

            // if email update, ensure uniqueness
            if (email && email !== t.email) {
                const existing = await TelecallerModel.findOne({ where: { email } });
                if (existing) return reply.code(409).send({ error: 'email already in use' });
            }

            const updatePayload: any = {};
            if (name) updatePayload.name = name;
            if (email) updatePayload.email = email;
            if (phone) updatePayload.phone = phone;
            if (password) {
                updatePayload.passwordHash = await bcrypt.hash(password, 10);
            }

            await t.update(updatePayload);

            return reply.send({
                id: t.id,
                name: t.name,
                email: t.email,
                phone: t.phone,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
            });
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'internal server error' });
        }
    });

    // -------------------------
    // Delete telecaller
    // -------------------------
    fastify.delete('/telecallers/:id', async (req, reply) => {
        try {
            const { id } = req.params as any;
            const t = await TelecallerModel.findByPk(id);
            if (!t) return reply.code(404).send({ error: 'Not found' });

            await TelecallerModel.destroy({ where: { id } });
            return reply.code(204).send();
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'internal server error' });
        }
    });

    // -------------------------
    // Reset password (admin) - sets new password
    // -------------------------
    fastify.post('/telecallers/:id/reset-password', async (req, reply) => {
        try {
            const { id } = req.params as any;
            const { newPassword } = req.body as any;
            if (!newPassword) return reply.code(400).send({ error: 'newPassword required' });

            const t = await TelecallerModel.findByPk(id);
            if (!t) return reply.code(404).send({ error: 'Not found' });

            const passwordHash = await bcrypt.hash(newPassword, 10);
            await t.update({ passwordHash });

            return reply.send({ success: true });
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'internal server error' });
        }
    });

    // -------------------------
    // Admin: assign customers to telecaller
    // (existing, kept but validated)
    // -------------------------
    fastify.post('/telecall/assign', async (req, reply) => {
        try {
            const { telecallerId, customerIds } = req.body as any;
            if (!telecallerId || !Array.isArray(customerIds)) {
                return reply.code(400).send({ error: 'Bad request' });
            }

            // optionally verify telecaller exists
            const t = await TelecallerModel.findByPk(telecallerId);
            if (!t) return reply.code(404).send({ error: 'telecaller not found' });

            const rows = customerIds.map((cid: string) => ({
                telecallerId,
                customerId: cid,
                assignedAt: new Date(),
            }));

            const created = await CallAssignmentModel.bulkCreate(rows);
            return reply.send({ success: true, createdCount: created.length });
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'internal server error' });
        }
    });

    // -------------------------
    // Unassign customers (delete assignments)
    // If body.customerIds is provided, remove only those; otherwise remove all for telecaller
    // -------------------------
    fastify.post('/telecall/unassign', async (req, reply) => {
        try {
            const { telecallerId, customerIds } = req.body as any;
            if (!telecallerId) return reply.code(400).send({ error: 'telecallerId required' });

            const where: any = { telecallerId };
            if (Array.isArray(customerIds) && customerIds.length) {
                where.customerId = customerIds;
            }

            const deleted = await CallAssignmentModel.destroy({ where });
            return reply.send({ success: true, deletedCount: deleted });
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'internal server error' });
        }
    });

    // -------------------------
    // Get assigned customers for telecaller (with customer include)
    // -------------------------
    fastify.get('/telecall/assigned/:telecallerId', async (req, reply) => {
        try {
            const { telecallerId } = req.params as any;
            const assignments = await CallAssignmentModel.findAll({
                where: { telecallerId },
                include: [CustomerModel],
            });
            return reply.send(assignments);
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'internal server error' });
        }
    });

    // -------------------------
    // Telecaller posts a call log (start/end)
    // -------------------------
    fastify.post('/telecall/log', async (req, reply) => {
        try {
            const payload = req.body as any;
            const created = await CallRepo.createCallLog(payload);
            return reply.send(created);
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'internal server error' });
        }
    });

    // -------------------------
    // Admin fetch call logs (all)
    // -------------------------
    fastify.get('/telecall/logs', async (_req, reply) => {
        try {
            const logs = await CallRepo.getCallLogs();
            return reply.send(logs);
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'internal server error' });
        }
    });

    // -------------------------
    // Filtered call logs endpoint (used by frontend)
    // supports query: telecallerId, date (yyyy-mm-dd), from, to, limit, offset
    // -------------------------
    fastify.get('/calllogs', async (request, reply) => {
        try {
            const q: any = request.query || {};
            const limit = q.limit ? parseInt(q.limit, 10) : undefined;
            const offset = q.offset ? parseInt(q.offset, 10) : undefined;

            const filters = {
                telecallerId: q.telecallerId,
                date: q.date,
                from: q.from,
                to: q.to,
                limit,
                offset,
            };

            const logs = await getCallLogsFiltered(filters);
            return reply.send(logs);
        } catch (err) {
            request.log.error(err);
            return reply.status(500).send({ error: 'Failed to fetch call logs' });
        }
    });

}; // registerTelecallRoutes
