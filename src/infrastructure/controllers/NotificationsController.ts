// src/infrastructure/controllers/NotificationController.ts
import { FastifyReply, FastifyRequest } from "fastify";
import { deviceTokenRepo } from "../repositories/deviceToken.repository"; // you must have this
import { sendPushToTokens } from "../push/fcm";
import {notificationRepo} from "../repositories/notification_repository";

export const NotificationController = {
    /**
     * Create a notification (admin → agent or agent → admin)
     */
    async create(req: FastifyRequest, rep: FastifyReply) {
        const body = req.body as any;

        if (!body?.title || !body?.body) {
            return rep.code(400).send({ error: "title and body required" });
        }

        const created = await notificationRepo.create({
            title: body.title,
            body: body.body,
            kind: body.kind ?? "generic",
            actorRole: body.actorRole ?? "admin", // default
            meta: body.meta ?? null,
            dueAt: body.dueAt ?? null,
        });

        // === Push notifications ===
        try {
            let tokens: string[] = [];

            // If targeting a specific agent (meta.targetAgentId)
            if (body.meta?.targetAgentId) {
                tokens = (await deviceTokenRepo.getTokensForAgents([body.meta.targetAgentId])).map(
                    (t) => t.token
                );
            }

            // // If role is admin → send to all admin devices
            // if (body.actorRole === "admin") {
            //     const adminTokens = await deviceTokenRepo.getTokensByRole("admin");
            //     tokens = [...tokens, ...adminTokens.map((t) => t.token)];
            // }
            //
            // // If role is agent → send to all agent devices
            // if (body.actorRole === "agent" && !body.meta?.targetAgentId) {
            //     const agentTokens = await deviceTokenRepo.getTokensByRole("agent");
            //     tokens = [...tokens, ...agentTokens.map((t) => t.token)];
            // }

            // Send push if any tokens
            if (tokens.length) {
                await sendPushToTokens(tokens, {
                    notification: { title: body.title, body: body.body },
                    data: {
                        type: "notification",
                        id: created.id,
                        actorRole: created.actorRole,
                        ...((created.meta as any) ?? {}),
                    },
                });
            }
        } catch (err) {
            console.error("push send failed", err);
        }

        return rep.code(201).send(created);
    },

    async list(req: FastifyRequest, rep: FastifyReply) {
        const { role } = req.query as { role?: "admin" | "agent" };
        const items = await notificationRepo.list(role ?? "admin");
        return rep.send(items);
    },

    async listUnread(req: FastifyRequest, rep: FastifyReply) {
        const { role } = req.query as { role?: "admin" | "agent" };
        const items = await notificationRepo.listUnread(role ?? "admin");
        return rep.send(items);
    },

    async updateStatus(req: FastifyRequest, rep: FastifyReply) {
        const { id } = req.params as { id: string };
        const { status } = req.body as { status: string };

        if (!status) {
            return rep.code(400).send({ error: "status required" });
        }

        const updated = await notificationRepo.updateStatus(id, status as any);
        return rep.send(updated);
    },
};
