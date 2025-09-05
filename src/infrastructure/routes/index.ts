// src/infrastructure/routes/index.ts
import { FastifyInstance } from "fastify";
import {dashboardRoutes} from "../controllers/DashboardController";
import {exportRoutes} from "../controllers/ExportController";
import {historyRoutes} from "../controllers/HistoryController";
import {trackingRoutes} from "../controllers/TrackingController";
import {collectionRoutes} from "../controllers/CollectionsController";
import {notificationsRoutes} from "../controllers/NotificationsController";


export const registerRoutes = (app: FastifyInstance) => {
    app.register(dashboardRoutes, { prefix: "/dashboard" });
    app.register(collectionRoutes, { prefix: "/collections" });
    // app.register(agentRoutes, { prefix: "/agents" });
    app.register(trackingRoutes, { prefix: "/tracking" });
    app.register(historyRoutes, { prefix: "/history" });
    app.register(notificationsRoutes, { prefix: "/notifications" });
    app.register(exportRoutes, { prefix: "/export" });
};
