// src/controllers/geocode.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";

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
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
                lat
            )}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`;

            // standard timeout via AbortController
            const timeoutMs = 5000; // 5s
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const r = await fetch(url, {
                    headers: {
                        "User-Agent": "myapp-admin/1.0 (+youremail@example.com)",
                    },
                    signal: controller.signal, // <-- use signal instead of non-existent `timeout`
                });

                // clear the timeout on success
                clearTimeout(timeoutId);

                if (!r.ok) {
                    return rep.code(502).send({ error: "Reverse geocode failed", status: r.status });
                }

                const json = await r.json();
                const display = json.display_name ?? null;
                const addressDetails = json.address ?? null;
                return rep.send({ address: display, details: addressDetails });
            } catch (err: any) {
                clearTimeout(timeoutId);
                if (err?.name === "AbortError") {
                    // request timed out
                    return rep.code(504).send({ error: "Reverse geocode request timed out" });
                }
                // rethrow to outer catch
                throw err;
            }
        } catch (err: any) {
            req.log?.error(err);
            return rep
                .code(500)
                .send({ error: "Geocode error", detail: err?.message ?? String(err) });
        }
    }
}
