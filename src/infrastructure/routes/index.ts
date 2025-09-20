// src/infrastructure/routes/index.ts
import { FastifyInstance } from "fastify";
import {dashboardRoutes} from "../controllers/DashboardController";
import {trackingRoutes} from "../controllers/TrackingController";
import {agentRoutes} from "./agentRoutes";
import collectionRoutes from "./collection.routes";
import callRoutes from "./call.routes";
import {historyRoutes} from "./history_routes";
import {exportRoutes} from "./exportRoutes";
import {notificationsRoutes} from "./notification_routes";
import {deviceTokenRoutes} from "./deviceTokenRoutes";
import {reminderRoutes} from "./reminder_routes";
import {customerRoutes} from "./customer.routes";
import {registerTelecallRoutes} from "../controllers/telecall.controller";

export const registerRoutes = (app: FastifyInstance) => {
    app.register(dashboardRoutes, { prefix: "/api" });
    app.register(collectionRoutes, { prefix: "/api" });
    app.register(agentRoutes, { prefix: "/api" });
    app.register(trackingRoutes, { prefix: "/api" });
    app.register(historyRoutes, { prefix: "/api" });
    app.register(notificationsRoutes, { prefix: "/api" });
    app.register(exportRoutes, { prefix: "/api" }); // ✅ now points to routes/exportRoutes
    app.register(callRoutes, { prefix: "/api" });
    app.register(deviceTokenRoutes, {prefix:"/api"});
    app.register(reminderRoutes, {prefix:"/api"});
    app.register(customerRoutes, {prefix:"/api"});
    app.register(registerTelecallRoutes, {prefix:"/api"});
};
