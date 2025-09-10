import { ICallRepository } from "../../core/interfaces/ICallRepository";
import { CallLog } from "../../core/entities/CallLog";
import CallModel from "../models/call.model";
import { Op } from "sequelize";

export class CallRepository implements ICallRepository {
    async create(call: Partial<CallLog>): Promise<CallLog> {
        // generate callId if not provided
        if (!call.callId) {
            call.callId = `COL-${Date.now().toString().slice(-6)}`;
        }
        const created = await CallModel.create(call as any);
        return created.toJSON() as CallLog;
    }

    async findById(id: number) {
        const found = await CallModel.findByPk(id);
        if (!found) return null;
        return found.toJSON() as CallLog;
    }

    async findAll(filter?: { dateFrom?: Date; dateTo?: Date; q?: string; agentId?: string | number }) {
        const where: any = {};

        if (filter?.dateFrom || filter?.dateTo) {
            where.createdAt = {};
            if (filter.dateFrom) where.createdAt[Op.gte] = filter.dateFrom;
            if (filter.dateTo) where.createdAt[Op.lte] = filter.dateTo;
        }

        if (filter?.q) {
            where[Op.or] = [
                { customerName: { [Op.like]: `%${filter.q}%` } },
                { agentName: { [Op.like]: `%${filter.q}%` } },
                { callId: { [Op.like]: `%${filter.q}%` } },
            ];
        }

        if (filter?.agentId) where.agentId = filter.agentId;

        const rows = await CallModel.findAll({ where, order: [["createdAt", "DESC"]] });
        return rows.map((r) => r.toJSON() as CallLog);
    }

    async update(id: number, update: Partial<CallLog>) {
        const obj = await CallModel.findByPk(id);
        if (!obj) return null;
        await obj.update(update as any);
        return obj.toJSON() as CallLog;
    }

    async delete(id: number) {
        await CallModel.destroy({ where: { id } });
    }
}
