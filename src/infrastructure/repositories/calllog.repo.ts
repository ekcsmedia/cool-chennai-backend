import {CallLogModel} from "../models/calllog.model";

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
