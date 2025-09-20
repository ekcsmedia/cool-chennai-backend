// src/index.ts
import dotenv from "dotenv";
dotenv.config();

import path from "path";
import { buildServer } from "./app";
import sequelize from "./infrastructure/sequelize";
import { startReminderWorker } from "./workers/reminderWorker";
import { initFirebase } from "./infrastructure/push/fcm";

console.log("DB_USER:", process.env.DB_USER, "DB_PASS:", process.env.DB_PASS ? "*****" : undefined);

export const start = async () => {
    try {
        // 1) DB
        await sequelize.authenticate();
        await sequelize.sync({ alter: false }); // ⚠️ in prod use migrations
        console.log("✅ Database connected");

        // 2) Firebase (optional: only if service account provided)
        try {
            if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
                // initFirebase should load the JSON path you configured in .env
                initFirebase(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
            } else {
                console.log("ℹ️ FIREBASE_SERVICE_ACCOUNT_PATH not set — skipping Firebase init (dev mode)");
            }
        } catch (firebaseErr) {
            // If Firebase init fails, log and continue (so non-push features still work)
            console.warn("⚠️ Firebase init failed, continuing without push support:", firebaseErr);
        }

        // 3) start workers (do this after firebase init so worker can send push)
        try {
            startReminderWorker(); // runs in-process cron (consider separate worker for production)
            console.log("✅ reminderWorker started");
        } catch (werr) {
            console.warn("⚠️ Failed to start reminderWorker:", werr);
        }

        // 4) server
        const app = buildServer();
        const port = Number(process.env.PORT) || 3000;
        const host = process.env.HOST || "0.0.0.0";

        await app.listen({ port, host });
        console.log(`🚀 Server running at http://${host}:${port}`);
    } catch (err) {
        console.error("❌ Failed to start server:", err);
        process.exit(1);
    }
};

// Only run when executed directly
if (require.main === module) {
    start();
}


