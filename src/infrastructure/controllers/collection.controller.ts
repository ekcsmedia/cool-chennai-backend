import { FastifyReply, FastifyRequest } from "fastify";
import { ReminderRepository } from "../repositories/reminder.repository";
import {collectionRepo} from "../repositories/SequelizeRepositories";

const reminderRepo = new ReminderRepository();

export class CollectionController {
    static async listToday(req: FastifyRequest, rep: FastifyReply) {
        const rows = await collectionRepo.findPending();
        return rep.send(rows);
    }

    static async getById(req: FastifyRequest, rep: FastifyReply) {
        const id = Number((req.params as any).id);
        const row = await collectionRepo.findById(id);
        if (!row) return rep.code(404).send({ message: "Not found" });
        return rep.send(row);
    }

    static async updateStatus(req: FastifyRequest, rep: FastifyReply) {
        const id = (req.params as any).id;
        const body = req.body as any;

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

        // fallback: generic update
        const updated = await collectionRepo.updateStatus(id, body.status, {
            notes: body.notes,
            collectedAmount: body.collectedAmount,
            proofUrl: body.proofUrl,
        });

        if (!updated) return rep.code(404).send({ message: 'Collection not found' });
        return rep.send({ message: 'Status updated', collection: updated });
    }

    static async assign(req: FastifyRequest, rep: FastifyReply) {
        try {
            const body = req.body as any;
            const { collectionId, agentId } = body;
            if (!collectionId || !agentId) {
                return rep.code(400).send({ message: "collectionId and agentId are required" });
            }

            const result = await collectionRepo.assign(collectionId, agentId);

            // result should include assignment + updated collection
            return rep.code(201).send({
                message: "Assigned",
                assignment: result.assignment,
                collection: result.collection,
            });
        } catch (err: any) {
            // log error server-side if you have a logger: fastify.log.error(err)
            return rep.code(500).send({ message: err?.message ?? "Server error" });
        }
    }

    static async addReminder(req: FastifyRequest, rep: FastifyReply) {
        const body = req.body as any;
        const reminder = await reminderRepo.create({
            collectionId: body.collectionId,
            customerId: body.customerId,
            agentId: body.agentId,
            notifyVia: body.notifyVia,
            remindAt: new Date(body.remindAt),
            message: body.message,
        });
        return rep.code(201).send(reminder);
    }

    static async listReminders(req: FastifyRequest, rep: FastifyReply) {
        const collectionId = Number((req.params as any).id);
        const rows = await reminderRepo.listByCollection(collectionId);
        return rep.send(rows);
    }
}
