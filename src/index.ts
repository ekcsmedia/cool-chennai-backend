// src/index.ts
import dotenv from "dotenv";
dotenv.config();
import { buildServer } from "./app";
import sequelize from "./infrastructure/sequelize";


console.log("DB_USER:", process.env.DB_USER, "DB_PASS:", process.env.DB_PASS);

const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true }); // ⚠️ in prod use migrations
        console.log("✅ Database connected");

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

// Only run if executed directly (not when imported in tests)
if (require.main === module) {
    start();
}
