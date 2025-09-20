import { FastifyInstance } from 'fastify';
import * as CallRepo from '../repositories/calllog.repo';
import { CallAssignmentModel } from '../models/callAssignment.model'; // ✅ updated
import { TelecallerModel } from '../models/telecaller.model';
import {CustomerModel} from "../models/customers.model";         // ✅ updated naming
import bcrypt from 'bcrypt';

export const registerTelecallRoutes = (fastify: FastifyInstance) => {
    // Telecaller login
    fastify.post('/telecaller/login', async (req, reply) => {
        const { email, password } = req.body as any;
        // TODO: implement bcrypt password verification
        const user = await TelecallerModel.findOne({ where: { email } });
        if (!user) return reply.status(401).send({ error: 'Invalid credentials' });

        // temporary fake token
        reply.send({
            id: user.id,
            name: user.name,
            email: user.email,
            token: 'fake-jwt-token',
        });
    });

    // Admin: assign customers to telecaller
    fastify.post('/telecall/assign', async (req, reply) => {
        const { telecallerId, customerIds } = req.body as any;
        if (!telecallerId || !Array.isArray(customerIds)) {
            return reply.code(400).send({ error: 'Bad request' });
        }

        const rows = customerIds.map((cid: string) => ({
            telecallerId,
            customerId: cid,
            assignedAt: new Date(),
        }));

        const created = await CallAssignmentModel.bulkCreate(rows);
        reply.send({ success: true, createdCount: created.length });
    });

    // Get assigned customers for telecaller
    fastify.get('/telecall/assigned/:telecallerId', async (req, reply) => {
        const { telecallerId } = req.params as any;
        const assignments = await CallAssignmentModel.findAll({
            where: { telecallerId },
            include: [CustomerModel],
        });
        reply.send(assignments);
    });

    // Telecaller posts a call log (start/end)
    fastify.post('/telecall/log', async (req, reply) => {
        const payload = req.body as any;
        // payload: { telecallerId, telecallerName, customerId, customerName, phoneNumber, startTime, endTime, notes }
        const created = await CallRepo.createCallLog(payload);
        reply.send(created);
    });

    // Admin fetch call logs
    fastify.get('/telecall/logs', async (_req, reply) => {
        const logs = await CallRepo.getCallLogs();
        reply.send(logs);
    });

    fastify.post('/telecallers', async (req, reply) => {
        try {
            const { name, email, password } = req.body as any;
            if (!name || !email || !password) {
                return reply.code(400).send({ error: 'name, email and password are required' });
            }

            // check duplicate email
            const existing = await TelecallerModel.findOne({ where: { email } });
            if (existing) return reply.code(409).send({ error: 'email already in use' });

            // hash password
            const passwordHash = await bcrypt.hash(password, 10);

            const created = await TelecallerModel.create({
                name,
                email,
                passwordHash,
            });

            // remove sensitive field before sending
            const { id, createdAt, updatedAt } = created;
            return reply.code(201).send({ id, name: created.name, email: created.email, createdAt, updatedAt });
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'internal server error' });
        }
    });
    // ✅ Get all telecallers (without passwordHash)
    fastify.get('/telecallers', async (_req, reply) => {
        try {
            const telecallers = await TelecallerModel.findAll({
                attributes: ['id', 'name', 'email', 'createdAt', 'updatedAt'], // exclude passwordHash
            });
            return reply.send(telecallers);
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'internal server error' });
        }
    });
};
