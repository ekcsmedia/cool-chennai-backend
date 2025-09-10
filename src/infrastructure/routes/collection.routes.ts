import { FastifyInstance } from "fastify";
import { CollectionController } from "../controllers/collection.controller";

export default async function collectionRoutes(fastify: FastifyInstance) {
    fastify.get("/collections/today", CollectionController.listToday);
    fastify.get("/collections/:id", CollectionController.getById);
    fastify.put("/collections/:id/status", CollectionController.updateStatus);

    fastify.post("/collections/assign", CollectionController.assign);

    // reminders
    fastify.post("/collections/reminders", CollectionController.addReminder);
    fastify.get("/collections/:id/reminders", CollectionController.listReminders);
}
