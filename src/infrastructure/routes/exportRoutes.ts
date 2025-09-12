// src/infrastructure/routes/exportRoutes.ts
import { FastifyInstance } from "fastify";
import { ExportController } from "../controllers/ExportController";

export async function exportRoutes(app: FastifyInstance) {
    console.log("✅ exportRoutes registered");
    app.get("/reports/export", ExportController.exportReport);
    app.post("/exports", ExportController.createExport);
    app.get("/exports/:file/download", ExportController.downloadExport);
}
