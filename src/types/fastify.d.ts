import 'fastify';
import { Sequelize } from 'sequelize';

declare module 'fastify' {
    interface FastifyInstance {
        db: Sequelize;
    }
}