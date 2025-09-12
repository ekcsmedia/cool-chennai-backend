import { FastifyInstance } from "fastify";
import {NotificationController} from "../controllers/NotificationsController";

export async function notificationsRoutes(app: FastifyInstance) {
    // create notification (admin can call this; can target agent via meta.targetAgentId)
    app.post("/notifications", NotificationController.create);

    // list by role: /notifications?role=admin or role=agent
    app.get("/notifications", NotificationController.list);

    // list unread
    app.get("/notifications/unread", NotificationController.listUnread);

    // update status
    app.post("/notifications/:id/status", NotificationController.updateStatus);
}
