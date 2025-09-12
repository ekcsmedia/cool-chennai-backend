// src/app.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import sequelize from "./infrastructure/sequelize";
import {registerRoutes} from "./infrastructure/routes";
import path from "path";


export const buildServer = () => {
    const app = Fastify({ logger: true });

    // Plugins
    app.register(cors, { origin: true });

    app.register(require("@fastify/static"), {
        root: path.join(process.cwd(), "exports"), // ✅ same as controller
        prefix: "/static/",
    });

    // Decorate with sequelize instance
    app.decorate("db", sequelize);

    // Health check
    app.get("/health", async () => ({ status: "Health is good" }));

    // Register feature routes
    registerRoutes(app);

    return app;
};
