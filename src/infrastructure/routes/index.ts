// src/infrastructure/routes/index.ts
import { FastifyInstance } from "fastify";
import {dashboardRoutes} from "../controllers/DashboardController";
import {exportRoutes} from "../controllers/ExportController";
import {trackingRoutes} from "../controllers/TrackingController";
import {notificationsRoutes} from "../controllers/NotificationsController";
import {agentRoutes} from "./agentRoutes";
import collectionRoutes from "./collection.routes";
import callRoutes from "./call.routes";
import {historyRoutes} from "./history_routes";

export const registerRoutes = (app: FastifyInstance) => {
    app.register(dashboardRoutes, { prefix: "/api" });
    app.register(collectionRoutes, { prefix: "/api" });
    app.register(agentRoutes, { prefix: "/api" });
    app.register(trackingRoutes, { prefix: "/api" });
    app.register(historyRoutes, { prefix: "/api" });
    app.register(notificationsRoutes, { prefix: "/api" });
    app.register(exportRoutes, { prefix: "/api" });
    app.register(callRoutes, { prefix: "/api" });

};
