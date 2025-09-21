import {CallLogModel} from "../models/calllog.model";
import {Op} from "sequelize";

export const createCallLog = async (data: any) => {
    if (data.endTime && data.startTime) {
        const duration = Math.floor((new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 1000);
        data.durationSeconds = Math.max(0, duration);
    }
    return await CallLogModel.create(data);
};

export const getCallLogs = async (filters = {}) => {
    return await CallLogModel.findAll({ where: filters, order: [['startTime','DESC']] });
};


export const getCallLogsFiltered = async (query: {
    telecallerId?: string;
    date?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
}) => {
    const where: any = {};
    // telecaller filter
    if (query.telecallerId) {
        where.telecallerId = query.telecallerId;
    }

    // single date -> interpret as full day UTC-aware (use start/end of that day)
    if (query.date) {
        const d = new Date(query.date);
        const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
        const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
        where.startTime = { [Op.between]: [start, end] };
    } else if (query.from || query.to) {
        const conditions: any = {};
        if (query.from) {
            conditions[Op.gte] = new Date(query.from);
        }
        if (query.to) {
            // include the full `to` day if needed by caller; here we treat as exact datetime
            conditions[Op.lte] = new Date(query.to);
        }
        where.startTime = conditions;
    }

    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    return await CallLogModel.findAll({
        where,
        order: [["startTime", "DESC"]],
        limit,
        offset,
    });
};