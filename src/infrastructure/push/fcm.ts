// src/infrastructure/push/fcm.ts
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Initialize once at app startup (app.ts or a dedicated init file)
export function initFirebase(serviceAccountPath?: string) {
    if (admin.apps.length) return admin.app();
    const saPath = serviceAccountPath || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!saPath) throw new Error('Firebase service account path required');
    const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
    return admin.initializeApp({ credential: admin.credential.cert(sa) });
}

export async function sendPushToTokens(tokens: string[], payload: admin.messaging.MessagingPayload | any) {
    if (!tokens || tokens.length === 0) return { success: 0, failure: 0 };
    const messaging = admin.messaging();
    // Use sendMulticast for up to 500 tokens
    const res = await messaging.sendEachForMulticast({
        tokens,
        notification: payload.notification,
        data: payload.data || {},
    } as any);
    return { success: res.successCount, failure: res.failureCount, responses: res.responses };
}