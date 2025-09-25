// controllers/customer.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { CustomerRepository } from "../repositories/customer.repository";
import { Transaction } from "sequelize";
import sequelize from "../sequelize";

const repo = new CustomerRepository();

export class CustomerController {
    static async create(req: FastifyRequest, rep: FastifyReply) {
        try {
            const payload = req.body as { name: string; phone1: string; phone2?: string; phone3?: string; area?: string; pincode: string };
            const created = await repo.create(payload);
            return rep.code(201).send(created);
        } catch (err) {
            req.log?.error(err);
            return rep.code(500).send({ error: "Failed to create customer", details: err instanceof Error ? err.message : err });
        }
    }

    static async list(req: FastifyRequest, rep: FastifyReply) {
        try {
            const query = req.query as { page?: string; limit?: string; name?: string; area?: string };
            const page = Math.max(1, parseInt(query.page || "1", 10));
            const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
            const offset = (page - 1) * limit;

            const where: any = {};
            if (query.name) where.name = { $like: `%${query.name}%` }; // sequelize v5 style; will use Op in v6
            if (query.area) where.area = query.area;

            // If Sequelize v6 you should use Op.like; adapt if necessary:
            // import { Op } from 'sequelize'; where.name = { [Op.like]: `%${query.name}%` };

            const { rows, count } = await repo.findAll({ limit, offset, where });
            return rep.send({ data: rows, meta: { total: count, page, limit } });
        } catch (err) {
            req.log?.error(err);
            return rep.code(500).send({ error: "Failed to fetch customers" });
        }
    }

    static async getOne(req: FastifyRequest<{ Params: { id: string } }>, rep: FastifyReply) {
        try {
            const { id } = req.params;
            const customer = await repo.findById(id);
            if (!customer) return rep.code(404).send({ error: "Customer not found" });
            return rep.send(customer);
        } catch (err) {
            req.log?.error(err);
            return rep.code(500).send({ error: "Failed to fetch customer" });
        }
    }

    static async update(
        req: FastifyRequest<{ Params: { id: string }; Body: any }>,
        rep: FastifyReply
    ) {
        const tx: Transaction = await sequelize.transaction();
        try {
            const { id } = req.params;
            const payload = req.body as Partial<{ name: string; phone: string; area: string; pincode: string  }>;

            // repo.update may return [affected, rows] or something similar
            const result = await repo.update(id, payload, tx);

            // normalize affected count
            let affected = 0;
            if (Array.isArray(result)) {
                // Sequelize often returns [affectedCount, rows]
                affected = typeof result[0] === "number" ? result[0] : (result[0] as any).rowCount ?? 0;
            } else if (typeof result === "number") {
                affected = result;
            } else if (result && typeof result === "object" && "affected" in (result as any)) {
                affected = (result as any).affected;
            }

            if (!affected || affected === 0) {
                await tx.rollback();
                return rep.code(404).send({ error: "Customer not found" });
            }

            // Fetch the updated record to ensure we return a proper JSON object
            const updated = await repo.findById(id);
            if (!updated) {
                // This is unlikely since affected > 0, but handle defensively
                await tx.rollback();
                return rep.code(500).send({ error: "Failed to fetch updated customer after update" });
            }

            await tx.commit();
            return rep.code(200).send(updated);
        } catch (err) {
            await tx.rollback();
            req.log?.error(err);
            return rep.code(500).send({ error: "Failed to update customer", details: err instanceof Error ? err.message : err });
        }
    }


    static async remove(req: FastifyRequest<{ Params: { id: string } }>, rep: FastifyReply) {
        const tx: Transaction = await sequelize.transaction();
        try {
            const { id } = req.params;
            await repo.softDelete(id, tx);
            await tx.commit();
            return rep.code(204).send();
        } catch (err) {
            await tx.rollback();
            req.log?.error(err);
            return rep.code(500).send({ error: "Failed to delete customer", details: err instanceof Error ? err.message : undefined });
        }
    }
}
