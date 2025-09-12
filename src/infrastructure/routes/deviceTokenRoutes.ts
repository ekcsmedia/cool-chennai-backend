// src/infrastructure/routes/deviceTokenRoutes.ts
import { FastifyInstance } from 'fastify';
import {DeviceTokenController} from "../controllers/deviceTokenController";

export async function deviceTokenRoutes(app: FastifyInstance) {
    app.post('/device-tokens', DeviceTokenController.register);
    app.post('/device-tokens/unregister', DeviceTokenController.unregister);
}