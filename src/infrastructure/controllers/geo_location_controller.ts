// src/controllers/geocode.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import fetch from "node-fetch";

export class GeocodeController {
    static async reverse(req: FastifyRequest, rep: FastifyReply) {
        try {
            const q = req.query as any;
            const lat = parseFloat(q.lat);
            const lon = parseFloat(q.lon);
            if (!isFinite(lat) || !isFinite(lon)) {
                return rep.code(400).send({ error: "lat and lon required" });
            }

            // Use Nominatim (OpenStreetMap). IMPORTANT: set a proper User-Agent for Nominatim policy.
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`;
            const r = await fetch(url, {
                headers: {
                    "User-Agent": "myapp-admin/1.0 (+youremail@example.com)",
                },
                timeout: 5000,
            });
            if (!r.ok) {
                return rep.code(502).send({ error: "Reverse geocode failed", status: r.status });
            }
            const json = await r.json();
            const display = json.display_name ?? null;
            const addressDetails = json.address ?? null;
            return rep.send({ address: display, details: addressDetails });
        } catch (err: any) {
            req.log?.error(err);
            return rep.code(500).send({ error: "Geocode error", detail: err?.message ?? String(err) });
        }
    }
}
