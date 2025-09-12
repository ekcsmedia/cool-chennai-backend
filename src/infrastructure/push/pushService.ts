// src/infrastructure/push/pushService.ts
import admin from "firebase-admin";

// initialize once in your app bootstrap (index.ts or pushService.ts)
// Make sure GOOGLE_APPLICATION_CREDENTIALS env is set to your Firebase service account JSON
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}

/**
 * Send push notification to a specific agent
 */
export async function sendPushToAgent(
    agentId: string,
    payload: { title: string; body: string; data?: Record<string, any> }
) {
    try {
        // TODO: replace with DB call to fetch agent's device token(s)
        // For now assume a dummy token map
        const deviceTokens = await getAgentDeviceTokens(agentId);

        if (!deviceTokens || deviceTokens.length === 0) {
            console.warn("No device tokens found for agent", agentId);
            return { ok: false, agentId, reason: "no_device_tokens" };
        }

        const message: admin.messaging.MulticastMessage = {
            tokens: deviceTokens,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: {
                ...(payload.data ?? {}),
                agentId,
            },
        };

        const res = await admin.messaging().sendEachForMulticast(message);

        return {
            ok: true,
            agentId,
            successCount: res.successCount,
            failureCount: res.failureCount,
            responses: res.responses.map((r) => ({
                success: r.success,
                error: r.error?.message,
            })),
        };
    } catch (err) {
        console.error("sendPushToAgent failed", err);
        return { ok: false, agentId, error: (err as Error).message };
    }
}

/**
 * Temporary stub — replace with DB lookup of tokens from agent_devices table
 */
async function getAgentDeviceTokens(agentId: string): Promise<string[]> {
    // Example: query a table AgentDevices where agentId -> deviceToken(s)
    // return await AgentDeviceModel.findAll({ where: { agentId } }).map(r => r.token);

    // For now return a fake token array or empty
    if (process.env.TEST_DEVICE_TOKEN) {
        return [process.env.TEST_DEVICE_TOKEN];
    }
    return [];
}
