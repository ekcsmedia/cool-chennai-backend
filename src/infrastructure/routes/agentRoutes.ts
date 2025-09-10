import { FastifyInstance } from "fastify";
import { AgentController } from "../controllers/AgentController";

export async function agentRoutes(app: FastifyInstance) {
    app.post("/agents", AgentController.create);
    app.get("/agents", AgentController.list);
    app.get("/agents/:id", AgentController.get);
    app.put("/agents/:id", AgentController.update);
    app.delete("/agents/:id", AgentController.delete);
    app.post("/agents/login", AgentController.login);
    // new endpoints
    app.get("/agents/:id/details", AgentController.findById);
    app.put("/agents/:id/status", AgentController.updateStatus);
    app.put("/agents/:id/last-seen", AgentController.updateLastSeen);
}
