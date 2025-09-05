import { FastifyInstance } from 'fastify';
import { writeFileSync } from 'fs';
import path from 'path';
import * as fs from "node:fs";

// NOTE: This is a stub. Plug your CSV/PDF generators here.
export async function exportRoutes(app: FastifyInstance) {
    app.post('/exports', async (req) => {
        const { type, from, to } = req.body as any;
        const id = Math.random().toString(36).slice(2);
        const fname = `export-${id}.${type === 'pdf' ? 'pdf' : 'csv'}`;
        const filePath = path.join(process.cwd(), 'tmp', fname);
        writeFileSync(filePath, type === 'pdf' ? Buffer.from('%PDF-1.4\n% stub') : 'id,example\n1,demo');
        return { id, file: fname };
    });

    app.get<{
        Params: { file: string };
    }>("/exports/:file/download", async (req, rep) => {
        const { file } = req.params;

        const safePath = path.join(path.resolve("exports"), file);
        if (!fs.existsSync(safePath)) {
            return rep.code(404).send({ error: "File not found" });
        }

        rep.header("Content-Disposition", `attachment; filename="${file}"`);
        return (rep as any).sendFile(file); // TS-safe fallback
    });

}