import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import TelecallerModel from '../models/telecaller.model';
import AdminModel from '../models/admin.model';
import { AgentModel } from '../models'; // adjust path if needed

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
        const { phone, password } = req.body as {
            phone: string;
            password: string;
        };
        if (!phone || !password) {
            fastify.log.warn("Login attempt missing phone or password");
            return reply.code(400).send({ error: 'phone and password required' });
        }

        const tc = await TelecallerModel.findOne({ where: { phone } });
        if (!tc) {
            fastify.log.warn(`Telecaller not found for phone: ${phone}`);
            return reply.code(401).send({ error: 'Invalid phone' });
        }

        // DEBUG LOGGING (don't keep in production)
        console.log("[LOGIN DEBUG] Incoming phone:", phone);
        console.log("[LOGIN DEBUG] Incoming password (plain):", password);
        console.log("[LOGIN DEBUG] Stored hash:", tc.passwordHash);

        const ok = await bcrypt.compare(password, tc.passwordHash);

        console.log("[LOGIN DEBUG] Password match result:", ok);

        if (!ok) {
            fastify.log.warn(`Telecaller login failed (bad password) for ${phone}`);
            return reply.code(401).send({ error: 'Invalid password' });
        }

        fastify.log.info(`Telecaller ${tc.name} (${tc.phone}) logged in successfully`);

        return reply.send({
            id: tc.id,
            name: tc.name,
            email: tc.email,
            phone: tc.phone,
            token: 'fake-telecaller-token'
        });
    });

    fastify.post('/agent/login', async (req, reply) => {
        try {
            const { phone, password } = req.body as any;

            if ((!phone || phone.toString().trim() === '') || (!password || password === '')) {
                fastify.log.warn('Agent login attempt missing phone or password');
                return reply.code(400).send({ error: 'phone and password required' });
            }

            const agent = await AgentModel.findOne({ where: { phone } });
            if (!agent) {
                fastify.log.warn(`Agent not found for phone=${phone}`);
                // keep generic message so we don't leak which is wrong
                return reply.code(401).send({ error: 'Invalid credentials' });
            }

            // Debug logging (disable in production)
            fastify.log.debug(`[AGENT-LOGIN] incoming phone=${phone}`);
            // If you have passwordHash field prefer that
            const storedHash = (agent as any).passwordHash ?? (agent as any).password ?? null;

            let passwordOk = false;

            if ((agent as any).passwordHash) {
                // Has hashed password stored
                fastify.log.debug('[AGENT-LOGIN] using bcrypt.compare with passwordHash');
                passwordOk = await bcrypt.compare(password, (agent as any).passwordHash);
            } else if ((agent as any).password) {
                // fallback to plaintext equality (legacy); compare safely
                fastify.log.debug('[AGENT-LOGIN] no hash found, using direct equality (legacy)');
                // use simple equality; if you want timing-attack resistance you can use crypto.timingSafeEqual
                passwordOk = password === (agent as any).password;
            } else {
                // No credential stored
                fastify.log.warn(`[AGENT-LOGIN] agent ${agent.id} has no password fields`);
                return reply.code(401).send({ error: 'Invalid credentials' });
            }

            fastify.log.debug(`[AGENT-LOGIN] passwordOk=${passwordOk}`);

            if (!passwordOk) {
                fastify.log.info(`Agent login failed for phone=${phone}`);
                return reply.code(401).send({ error: 'Invalid credentials' });
            }

            // success — return basic payload and token (replace with JWT later)
            fastify.log.info(`Agent ${agent.id} (${agent.name}) logged in`);
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