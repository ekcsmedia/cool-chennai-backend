// src/workers/reminderWorker.ts
import cron from "node-cron";
import { ReminderRepository } from "../infrastructure/repositories/reminder.repository";
import { deviceTokenRepo } from "../infrastructure/repositories/deviceToken.repository";
import { sendPushToTokens } from "../infrastructure/push/fcm";
import {notificationRepo} from "../infrastructure/repositories/notification_repository";

// instantiate repository (was missing)
const reminderRepo = new ReminderRepository();

/**
 * Utility: chunk array into n-sized chunks
 */
function chunk<T>(arr: T[], size = 500): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

/**
 * Start reminder worker
 * @param cronSpec cron schedule string, default every minute
 */
export function startReminderWorker(cronSpec = "*/1 * * * *") {
    cron.schedule(cronSpec, async () => {
        try {
            const now = new Date();
            // fetch scheduled reminders due now or earlier and not sent
            const due = await reminderRepo.findDueAndUnsent(now, 200);
            if (!due || due.length === 0) return;

            for (const r of due) {
                try {
                    // create notification (actorRole = 'agent' if agentId present else 'admin')
                    const actorRole = r.agentId ? "agent" : "admin";
                    const created = await notificationRepo.create({
                        title: "Reminder",
                        body: r.message ?? "",
                        kind: "generic",
                        actorRole,
                        meta: { collectionId: r.collectionId, reminderId: r.id, targetAgentId: r.agentId ?? null },
                        dueAt: r.remindAt,
                    });

                    // send push if notifyVia includes push and target agent exists
                    if ((r.notifyVia === "push" || r.notifyVia === "both") && r.agentId) {
                        // deviceTokenRepo.getTokensForAgents should return string[] tokens
                        const tokens = await deviceTokenRepo.getTokensForAgents([String(r.agentId)]);
                        // normalize: if it returns objects, map to token field
                        const tokenList = tokens.length && typeof tokens[0] === "object"
                            ? (tokens as any[]).map((t) => t.token).filter(Boolean)
                            : (tokens as string[]);

                        if (tokenList.length) {
                            // FCM sendMulticast supports up to 500 tokens; chunk if needed
                            const chunks = chunk(tokenList, 500);
                            for (const c of chunks) {
                                const payload = {
                                    notification: { title: created.title, body: created.body },
                                    data: { type: "reminder", id: String(created.id), collectionId: String(r.collectionId) },
                                };
                                // sendPushToTokens should handle response and invalid-token cleanup
                                await sendPushToTokens(c, payload);
                            }
                        }
                    }

                    // TODO: send SMS if notifyVia === 'sms' or 'both' using SMS provider

                    // mark reminder as sent (use markSent method)
                    if (r.id != null) {
                        await reminderRepo.markSent(r.id);
                    }
                } catch (innerErr) {
                    // do not mark as sent so it can retry next run
                    console.error(`Failed to process reminder id=${r.id}`, innerErr);
                }
            }
        } catch (err) {
            console.error("reminderWorker error", err);
        }
    });
}