import { FastifyReply, FastifyRequest } from "fastify";
import { ReminderRepository } from "../repositories/reminder.repository";
import { collectionRepo } from "../repositories/SequelizeRepositories";
import { v4 as uuidv4 } from 'uuid';

const reminderRepo = new ReminderRepository();

export class CollectionController {
    // Create (POST /collections)
    static async create(req: FastifyRequest, rep: FastifyReply) {
        try {
            const body = req.body as any;
            const {
                code, title, address, amount, type, area, city,
                customerId, assignedAgentId, dueAt,
            } = body ?? {};

            if (!title || !address || !(amount !== undefined)) {
                return rep.code(400).send({ error: "title, address and amount are required" });
            }

            if (type && !['pickup','delivery','service'].includes(type)) {
                return rep.code(400).send({ error: "invalid type" });
            }

            const generatedCode = code?.toString() ?? `#COL-${uuidv4().slice(0,8).toUpperCase()}`;

            const payload: any = {
                code: generatedCode,
                title,
                address,
                amount: Number(amount),
                type: type ?? 'pickup',
                area: area ?? null,
                city: city ?? null,
                customerId: customerId ?? null,
                assignedAgentId: assignedAgentId ?? null,
                status: 'pending',
                dueAt: dueAt ? new Date(dueAt) : null,
            };

            const created = await collectionRepo.create(payload);
            return rep.code(201).send(created);
        } catch (err: any) {
            req.log.error(err);
            return rep.code(500).send({ error: "Failed to create collection", detail: err.message ?? String(err) });
        }
    }

    // List "today" / pending (GET /collections/today)
// List "today" / pending (GET /collections/today)
    static async listToday(req: FastifyRequest, rep: FastifyReply) {
        try {
            // Derive agentId from authenticated user if present
            const user = (req as any).user;
            let agentId: string | undefined = undefined;
            if (user && user.id) {
                agentId = user.id; // authenticated agent id
            } else {
                // fallback to query param (dev only)
                const q = req.query as any;
                if (q?.agentId) agentId = q.agentId;
            }

            // Use collectionRepo.findPending with optional agentId filter
            const rows = await collectionRepo.findPending({ agentId });
            return rep.send(rows);
        } catch (err: any) {
            req.log.error(err);
            return rep.code(500).send({ error: 'Failed to fetch pending collections', detail: err.message });
        }
    }


    // List all (GET /collections) — optional filters via query
    static async listAll(req: FastifyRequest, rep: FastifyReply) {
        try {
            const q = req.query as any;
            // support optional filters: status, agentId, customerId, page, limit
            const filters: any = {};
            if (q.status) filters.status = q.status;
            if (q.agentId) filters.assignedAgentId = q.agentId;
            if (q.customerId) filters.customerId = q.customerId;
            const page = q.page ? Number(q.page) : 1;
            const limit = q.limit ? Number(q.limit) : 50;
            const rows = await collectionRepo.findAll({ filters, page, limit });
            return rep.send(rows);
        } catch (err: any) {
            req.log.error(err);
            return rep.code(500).send({ error: 'Failed to fetch collections', detail: err.message });
        }
    }

    // Get by id (GET /collections/:id)
    static async getById(req: FastifyRequest, rep: FastifyReply) {
        try {
            const id = (req.params as any).id as string;
            if (!id) return rep.code(400).send({ message: 'id required' });
            const row = await collectionRepo.findById(id);
            if (!row) return rep.code(404).send({ message: "Not found" });
            return rep.send(row);
        } catch (err: any) {
            req.log.error(err);
            return rep.code(500).send({ message: err?.message ?? 'Server error' });
        }
    }

    // Update (PUT /collections/:id)
    static async update(req: FastifyRequest, rep: FastifyReply) {
        try {
            const id = (req.params as any).id as string;
            const data = req.body as any;
            if (!id) return rep.code(400).send({ message: 'id required' });

            const updated = await collectionRepo.update(id, data);
            if (!updated) return rep.code(404).send({ message: 'Not found' });
            return rep.send(updated);
        } catch (err: any) {
            req.log.error(err);
            return rep.code(500).send({ message: err?.message ?? 'Server error' });
        }
    }

    // Delete (DELETE /collections/:id) — soft delete if model.paranoid = true
    static async remove(req: FastifyRequest, rep: FastifyReply) {
        try {
            const id = (req.params as any).id as string;
            if (!id) return rep.code(400).send({ message: 'id required' });
            const deleted = await collectionRepo.delete(id);
            return rep.send({ success: deleted > 0 });
        } catch (err: any) {
            req.log.error(err);
            return rep.code(500).send({ message: err?.message ?? 'Server error' });
        }
    }

    // Update status / handle assign shortcut (PUT /collections/:id/status)
    static async updateStatus(req: FastifyRequest, rep: FastifyReply) {
        try {
            const id = (req.params as any).id as string;
            const body = req.body as any;
            if (!id) return rep.code(400).send({ message: 'id required' });

            // If request is to assign an agent, use assign() so assignment record is created
            if (body.agentId && body.status === 'assigned') {
                const result = await collectionRepo.assign(id, body.agentId);
                return rep.send({ message: 'Assigned', assignment: result.assignment, collection: result.collection });
            }

            // handle collected / delivered / generic status updates
            if (body.status === 'collected') {
                const updated = await collectionRepo.markCollected(id, body.collectedAmount, body.notes, body.proofUrl);
                return rep.send({ message: 'Marked collected', collection: updated });
            }

            if (body.status === 'completed' || body.status === 'delivered') {
                const updated = await collectionRepo.markDelivered(id, body.notes, body.proofUrl);
                return rep.send({ message: 'Marked delivered', collection: updated });
            }

            // fallback: generic updateStatus
            const updated = await collectionRepo.updateStatus(id, body.status, {
                notes: body.notes,
                collectedAmount: body.collectedAmount,
                proofUrl: body.proofUrl,
            });

            if (!updated) return rep.code(404).send({ message: 'Collection not found' });
            return rep.send({ message: 'Status updated', collection: updated });
        } catch (err: any) {
            req.log.error(err);
            return rep.code(500).send({ message: err?.message ?? 'Server error' });
        }
    }

    static async start(req: FastifyRequest, rep: FastifyReply) {
        try {
            const id = (req.params as any).id as string;
            if (!id) return rep.code(400).send({ message: 'id required' });

            const body = req.body as any;
            const agentIdFromBody = body?.agentId as string | undefined;
            const user = (req as any).user;
            const agentId = user?.id ?? agentIdFromBody;

            if (!agentId) return rep.code(400).send({ message: 'agentId required' });

            // Security: if user is authenticated but agentId in body differs, reject
            if (user?.id && agentIdFromBody && user.id !== agentIdFromBody) {
                return rep.code(403).send({ message: 'Agent mismatch' });
            }

            const result = await collectionRepo.startTracking(id, agentId);

            const startedAtIso =
                result.startedAt instanceof Date
                    ? result.startedAt.toISOString()
                    : (typeof result.startedAt === 'string' ? result.startedAt : null);

            return rep.send({ started: true, startedAt: startedAtIso, collection: result.collection });
        } catch (err: any) {
            req.log.error(err);
            return rep.code(500).send({ message: err?.message ?? 'Server error' });
        }
    }

    // POST /collections/:id/stop
    static async stop(req: FastifyRequest, rep: FastifyReply) {
        try {
            const id = (req.params as any).id as string;
            if (!id) return rep.code(400).send({ message: 'id required' });

            const body = req.body as any;
            const agentIdFromBody = body?.agentId as string | undefined;
            const user = (req as any).user;
            const agentId = user?.id ?? agentIdFromBody;

            if (!agentId) return rep.code(400).send({ message: 'agentId required' });

            if (user?.id && agentIdFromBody && user.id !== agentIdFromBody) {
                return rep.code(403).send({ message: 'Agent mismatch' });
            }

            const lat = body?.lat as number | undefined;
            const lng = body?.lng as number | undefined;
            const batteryLevel = body?.batteryLevel as number | undefined;

            const result = await collectionRepo.stopTracking(id, agentId, { lat, lng, batteryLevel });

            const stoppedAtIso =
                result.stoppedAt instanceof Date
                    ? result.stoppedAt.toISOString()
                    : (typeof result.stoppedAt === 'string' ? result.stoppedAt : null);

            return rep.send({ stopped: true, stoppedAt: stoppedAtIso, collection: result.collection });
        } catch (err: any) {
            req.log.error(err);
            return rep.code(500).send({ message: err?.message ?? 'Server error' });
        }
    }

    // POST /collections/:id/ping
    static async ping(req: FastifyRequest, rep: FastifyReply) {
        try {
            const id = (req.params as any).id as string;
            if (!id) return rep.code(400).send({ message: 'id required' });

            const body = req.body as any;
            const user = (req as any).user;
            const agentId = user?.id ?? body?.agentId;
            if (!agentId) return rep.code(400).send({ message: 'agentId required' });

            // Accept arbitrary payload but store important known fields if present
            const lat = body?.lat as number | undefined;
            const lng = body?.lng as number | undefined;
            const batteryLevel = body?.batteryLevel as number | undefined;
            const ts = body?.ts ? new Date(body.ts) : new Date();

            const ping = await collectionRepo.savePing(id, agentId, {
                lat, lng, batteryLevel, ts, raw: body
            });

            // Optionally: publish to websocket / push notifications here

            return rep.code(201).send({ ok: true, receivedAt: ping.createdAt.toISOString(), pingId: ping.id });
        } catch (err: any) {
            req.log.error(err);
            return rep.code(500).send({ message: err?.message ?? 'Server error' });
        }
    }

    // Assign (POST /collections/assign)
    static async assign(req: FastifyRequest, rep: FastifyReply) {
        try {
            const body = req.body as any;
            const { collectionId, agentId } = body;
            if (!collectionId || !agentId) {
                return rep.code(400).send({ message: "collectionId and agentId are required" });
            }

            const result = await collectionRepo.assign(collectionId, agentId);
            return rep.code(201).send({
                message: "Assigned",
                assignment: result.assignment,
                collection: result.collection,
            });
        } catch (err: any) {
            req.log.error(err);
            return rep.code(500).send({ message: err?.message ?? "Server error" });
        }
    }

    // Add reminder (POST /collections/reminders)
    static async addReminder(req: FastifyRequest, rep: FastifyReply) {
        try {
            const body = req.body as any;
            const reminder = await reminderRepo.create({
                collectionId: body.collectionId as string,
                customerId: body.customerId as string | undefined,
                agentId: body.agentId as string | undefined,
                notifyVia: body.notifyVia,
                remindAt: new Date(body.remindAt),
                message: body.message,
            });
            return rep.code(201).send(reminder);
        } catch (err: any) {
            req.log.error(err);
            return rep.code(500).send({ message: err?.message ?? 'Server error' });
        }
    }

    // List reminders for a collection (GET /collections/:id/reminders)
    static async listReminders(req: FastifyRequest, rep: FastifyReply) {
        try {
            const collectionId = (req.params as any).id as string;
            if (!collectionId) return rep.code(400).send({ message: 'id required' });
            const rows = await reminderRepo.listByCollection(collectionId);
            return rep.send(rows);
        } catch (err: any) {
            req.log.error(err);
            return rep.code(500).send({ message: err?.message ?? 'Server error' });
        }
    }
}
