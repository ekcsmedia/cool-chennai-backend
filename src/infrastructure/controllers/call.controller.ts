import { FastifyReply, FastifyRequest } from "fastify";
import { CallRepository } from "../repositories/call.repository";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

const repo = new CallRepository();

// helper to convert seconds to human format
function secToHuman(sec?: number | null) {
    if (!sec && sec !== 0) return null;
    const s = Math.floor(sec || 0);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}m ${rem}s`;
}

export class CallController {
    static async create(req: FastifyRequest, rep: FastifyReply) {
        const body = req.body as any;
        const created = await repo.create(body);
        created.durationHuman = secToHuman(created.durationSeconds);
        return rep.code(201).send(created);
    }

    static async list(req: FastifyRequest, rep: FastifyReply) {
        const q = (req.query as any)?.q;
        const filterToday = (req.query as any)?.filter === "today";
        const agentId = (req.query as any)?.agentId;
        let dateFrom: Date | undefined;
        let dateTo: Date | undefined;
        if (filterToday) {
            dateFrom = new Date();
            dateFrom.setHours(0, 0, 0, 0);
            dateTo = new Date();
            dateTo.setHours(23, 59, 59, 999);
        }
        const rows = await repo.findAll({ dateFrom, dateTo, q, agentId });
        rows.forEach((r) => {
            (r as any).durationHuman = secToHuman(r.durationSeconds);
        });
        return rep.send(rows);
    }

    static async getById(req: FastifyRequest, rep: FastifyReply) {
        const id = Number((req.params as any).id);
        const item = await repo.findById(id);
        if (!item) return rep.code(404).send({ message: "Not found" });
        (item as any).durationHuman = secToHuman(item.durationSeconds);
        return rep.send(item);
    }

    static async update(req: FastifyRequest, rep: FastifyReply) {
        const id = Number((req.params as any).id);
        const body = req.body as any;
        const updated = await repo.update(id, body);
        if (!updated) return rep.code(404).send({ message: "Not found" });
        (updated as any).durationHuman = secToHuman(updated.durationSeconds);
        return rep.send(updated);
    }

    static async remove(req: FastifyRequest, rep: FastifyReply) {
        const id = Number((req.params as any).id);
        await repo.delete(id);
        return rep.code(204).send();
    }

    // Export CSV or PDF
    static async export(req: FastifyRequest, rep: FastifyReply) {
        const format = (req.query as any)?.format || "csv";
        const q = (req.query as any)?.q;
        const rows = await repo.findAll({ q });

        const mapped = rows.map((r) => ({
            id: r.id,
            callId: r.callId,
            customerName: r.customerName,
            agentName: r.agentName,
            duration: secToHuman(r.durationSeconds),
            status: r.status,
            startedAt: r.startedAt?.toISOString(),
            endedAt: r.endedAt?.toISOString(),
            location: r.locationLat && r.locationLng ? `${r.locationLat},${r.locationLng}` : "",
        }));

        if (format === "csv") {
            const fields = Object.keys(mapped[0] || {});
            const parser = new Parser({ fields });
            const csv = parser.parse(mapped);
            rep.header("Content-Type", "text/csv");
            rep.header("Content-Disposition", `attachment; filename="calls-${Date.now()}.csv"`);
            return rep.send(csv);
        }

        // PDF generation (simple tabular)
        if (format === "pdf") {
            rep.header("Content-Type", "application/pdf");
            rep.header("Content-Disposition", `attachment; filename="calls-${Date.now()}.pdf"`);

            const doc = new PDFDocument({ margin: 30, size: "A4" });
            const stream = new PassThrough();
            doc.pipe(stream);

            doc.fontSize(18).text("Call Logs Export", { align: "center" });
            doc.moveDown();

            const colWidths = { callId: 80, customer: 150, agent: 100, duration: 60, status: 70 };

            // header
            doc.fontSize(10).text("Call ID", { continued: true, width: colWidths.callId });
            doc.text("Customer", { continued: true, width: colWidths.customer });
            doc.text("Agent", { continued: true, width: colWidths.agent });
            doc.text("Duration", { continued: true, width: colWidths.duration });
            doc.text("Status");
            doc.moveDown(0.5);

            mapped.forEach((m) => {
                doc.fontSize(9).text(String(m.callId), { continued: true, width: colWidths.callId });
                doc.text(String(m.customerName), { continued: true, width: colWidths.customer });
                doc.text(String(m.agentName || ""), { continued: true, width: colWidths.agent });
                doc.text(String(m.duration || ""), { continued: true, width: colWidths.duration });
                doc.text(String(m.status || ""));
            });

            doc.end();
            return rep.send(stream);
        }

        return rep.code(400).send({ message: "Unsupported format" });
    }
}
