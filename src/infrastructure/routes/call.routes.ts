import { FastifyInstance } from "fastify";
import { CallController } from "../controllers/call.controller";

export default async function callRoutes(fastify: FastifyInstance) {
    fastify.get("/calls", { schema: {} }, CallController.list);
    fastify.get("/calls/export", { schema: {} }, CallController.export);
    fastify.get("/calls/:id", { schema: {} }, CallController.getById);
    fastify.post("/calls", { schema: {} }, CallController.create);
    fastify.put("/calls/:id", { schema: {} }, CallController.update);
    fastify.delete("/calls/:id", { schema: {} }, CallController.remove);
}
