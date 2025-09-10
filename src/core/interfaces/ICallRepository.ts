import { CallLog } from "../entities/CallLog";

export interface ICallRepository {
    create(call: Partial<CallLog>): Promise<CallLog>;
    findById(id: number): Promise<CallLog | null>;
    findAll(filter?: { dateFrom?: Date; dateTo?: Date; q?: string; agentId?: string | number }): Promise<CallLog[]>;
    update(id: number, update: Partial<CallLog>): Promise<CallLog | null>;
    delete(id: number): Promise<void>;
}
