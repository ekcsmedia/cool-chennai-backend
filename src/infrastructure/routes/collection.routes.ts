import { FastifyInstance } from "fastify";
import { CollectionController } from "../controllers/collection.controller";
import {GeocodeController} from "../controllers/geo_location_controller";

export default async function collectionRoutes(fastify: FastifyInstance) {
    // --- CRUD ---
    fastify.post("/collections", CollectionController.create);        // Create new collection
    fastify.get("/collections", CollectionController.listAll);        // List all collections (with filters)
    fastify.get("/collections/today", CollectionController.listToday);// List today's or pending
    fastify.get("/collections/:id", CollectionController.getById);    // Get by id
    fastify.put("/collections/:id", CollectionController.update);     // Update details
    fastify.delete("/collections/:id", CollectionController.remove);  // Delete (soft delete since model is paranoid)

    // --- Status + Assignment ---
    fastify.put("/collections/:id/status", CollectionController.updateStatus);
    fastify.post("/collections/assign", CollectionController.assign);

    // --- Reminders ---
    fastify.post("/collections/reminders", CollectionController.addReminder);
    fastify.get("/collections/:id/reminders", CollectionController.listReminders);

    // new tracking endpoints
    fastify.post("/collections/:id/start", CollectionController.start); // start tracking
    fastify.post("/collections/:id/stop", CollectionController.stop);   // stop tracking
    fastify.post("/collections/:id/ping", CollectionController.ping);   // heartbeat / location ping

    fastify.get("/collections/:id/pings", CollectionController.listPings);
    fastify.get("/geocode/reverse", GeocodeController.reverse);
}
