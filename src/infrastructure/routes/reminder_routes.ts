// src/infrastructure/routes/reminderRoutes.ts
import { FastifyInstance } from "fastify";
import { reminderRepo } from "../repositories/reminder.repository";

export async function reminderRoutes(app: FastifyInstance) {
    app.post("/reminders", async (req, rep) => {
        const body = req.body as any;
        if (!body.collectionId || !body.message || !body.remindAt) {
            return rep.code(400).send({ error: "collectionId, message, remindAt required" });
        }

        const reminder = await reminderRepo.create({
            collectionId: body.collectionId,
            customerId: body.customerId ?? null,
            agentId: body.agentId ?? null,
            notifyVia: body.notifyVia ?? "push",
            remindAt: new Date(body.remindAt),
            message: body.message,
            status: "scheduled",
        });

        return rep.code(201).send(reminder);
    });
}
