import { FastifyInstance } from "fastify";
import { CustomerController } from "../controllers/customer.controller";

export async function customerRoutes(app: FastifyInstance) {
    app.post("/customers", CustomerController.create);
    app.get("/customers", CustomerController.list);
    app.get("/customers/:id", CustomerController.getOne);
    app.put("/customers/:id", CustomerController.update);
    app.delete("/customers/:id", CustomerController.remove);

    // optional "extra" endpoints similar to agent extras
    // app.get("/customers/:id/details", CustomerController.getOne);
    // alias for single fetch
    // You could add status/lastSeen if business logic requires:
    // app.put("/customers/:id/status", CustomerController.updateStatus);
    // app.put("/customers/:id/last-seen", CustomerController.updateLastSeen);
}
