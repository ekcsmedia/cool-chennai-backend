// src/infrastructure/controllers/ExportController.ts
import { FastifyReply, FastifyRequest } from "fastify";
import { writeFileSync } from "fs";
import path from "path";
import * as fs from "fs";

export class ExportController {
    static async createExport(req: FastifyRequest, rep: FastifyReply) {
        const { type } = req.body as any;
        const id = Math.random().toString(36).slice(2);
        const fname = `export-${id}.${type === "pdf" ? "pdf" : "csv"}`;
        const filePath = path.join(process.cwd(), "exports", fname);

        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

        if (type === "pdf") {
            writeFileSync(filePath, Buffer.from("%PDF-1.4\n% stub pdf file"));
        } else {
            writeFileSync(filePath, "id,example\n1,demo\n2,test");
        }

        return { id, file: fname };
    }

    static async downloadExport(req: FastifyRequest, rep: FastifyReply) {
        const { file } = req.params as { file: string };
        const safePath = path.join(path.resolve("exports"), file);

        if (!fs.existsSync(safePath)) {
            return rep.code(404).send({ error: "File not found" });
        }

        rep.header("Content-Disposition", `attachment; filename="${file}"`);
        return (rep as any).sendFile(file); // requires @fastify/static
    }

    static async exportReport(req: FastifyRequest, rep: FastifyReply) {
        const { format } = req.query as { format?: string };

        if (!format || !["csv", "pdf"].includes(format)) {
            return rep.code(400).send({ error: "Invalid format" });
        }

        const id = Math.random().toString(36).slice(2);
        const fname = `export-${id}.${format}`;
        const exportDir = path.join(process.cwd(), "exports");
        await fs.promises.mkdir(exportDir, { recursive: true });

        const filePath = path.join(exportDir, fname);
        if (format === "csv") {
            writeFileSync(filePath, "id,example\n1,demo\n2,test");
        } else {
            writeFileSync(filePath, Buffer.from("%PDF-1.4\n% stub pdf file"));
        }

        rep.header("Content-Disposition", `attachment; filename="${fname}"`);
        return (rep as any).sendFile(fname);
    }
}
