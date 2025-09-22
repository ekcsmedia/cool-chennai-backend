import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import TelecallerModel from '../models/telecaller.model';
import AdminModel from '../models/admin.model';

export async function registerAuthRoutes(fastify: FastifyInstance) {
    // --- Admin create (seed) ---
    fastify.post('/admin/create', async (req, reply) => {
        try {
            const {name, email, password} = req.body as any;
            if (!name || !email || !password) {
                return reply.code(400).send({error: 'name, email and password required'});
            }
            const existing = await AdminModel.findOne({where: {email}});
            if (existing) return reply.code(409).send({error: 'email already exists'});

            const passwordHash = await bcrypt.hash(password, 10);
            const created = await AdminModel.create({name, email, passwordHash});
            return reply.code(201).send({id: created.id, name: created.name, email: created.email});
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({error: 'internal server error'});
        }
    });

    // --- Admin login ---
    fastify.post('/admin/login', async (req, reply) => {
        const {email, password} = req.body as any;
        if (!email || !password) return reply.code(400).send({error: 'email and password required'});

        const user = await AdminModel.findOne({where: {email}});
        if (!user) return reply.code(401).send({error: 'Invalid credentials'});

        const ok = await user.verifyPassword(password);
        if (!ok) return reply.code(401).send({error: 'Invalid credentials'});

        // For now return basic payload & fake token (replace with JWT later)
        return reply.send({id: user.id, name: user.name, email: user.email, token: 'fake-admin-token'});
    });

    // --- Telecaller login ---
    fastify.post('/telecaller/login', async (req, reply) => {
        const {phone, password} = req.body as any;
        if (!phone || !password) return reply.code(400).send({error: 'email and password required'});

        const tc = await TelecallerModel.findOne({where: {phone}});
        if (!tc) return reply.code(401).send({error: 'Invalid credentials'});
        const ok = await tc.verifyPassword(password);
        if (!ok) return reply.code(401).send({error: 'Invalid credentials'});

        return reply.send({id: tc.id, name: tc.name, email: tc.email, phone: tc.phone, token: 'fake-telecaller-token'});
    });

    app.post('/agent/login', async (req, reply) => {
        try {
            const { phone, password } = req.body as any;

            if ((!phone || phone.toString().trim() === '') || (!password || password === '')) {
                return reply.code(400).send({ error: 'phone and password required' });
            }

            // try phone then fallback to name/email if you want
            const agent = await AgentModel.findOne({ where: { phone } });
            if (!agent) {
                // don't reveal which is missing
                return reply.code(401).send({ error: 'Invalid credentials' });
            }

            const ok = await agent.verifyPassword(password);
            if (!ok) return reply.code(401).send({ error: 'Invalid credentials' });

            // NOTE: return token here - stub token for now; swap for JWT in next step
            return reply.send({
                id: agent.id,
                name: agent.name,
                phone: agent.phone,
                token: 'fake-agent-token',
            });
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'internal server error' });
        }
    });

}