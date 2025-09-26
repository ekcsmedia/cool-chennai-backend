// repositories/collection.repository.ts
import { Transaction } from 'sequelize';
import {AgentModel, AssignmentModel, CollectionModel, CollectionStatus} from "../models";
import sequelize from "../sequelize";
import { CollectionPingModel } from "../models/collection_ping_model";
import {CustomerModel} from "../models/customers.model";

export { agentRepo } from './agent.repository';
export { deviceTokenRepo } from './deviceToken.repository';
export { historyRepo } from './history.repository';
export { trackingRepo } from './tracking.repository';

// Helper: map to plain JSON and attach convenient customerName if available
function mapCollectionRow(row: any) {
    const json = row && typeof row.toJSON === 'function' ? row.toJSON() : row;
    if (json.customer) {
        json.customerName = json.customer.name ?? json.customerName ?? null;
        json.customerPhone = json.customer.phone ?? null;
        json.customerArea = json.customer.area ?? null;
    }
    // ensure top-level customerName exists (some legacy code expects this)
    if (!json.customerName && json.customerId && json.customerName === undefined) {
        // leave null or empty
        json.customerName = null;
    }
    return json;
}

export const collectionRepo = {
    async create(payload: {
        code?: string;
        title: string;
        address: string;
        pincode: string,
        customerName : string;
        status? :  CollectionStatus;
        amount: number;
        type?: 'pickup' | 'delivery' | 'service' | 'collection';
        area?: string | null;
        city?: string | null;
        customerId?: string | null;
        assignedAgentId?: string | null;
        dueAt?: Date | null;
    }) {
        if (!payload.title || !payload.address || !payload.pincode || payload.amount == null) {
            throw new Error('title, address, pincode and amount are required');
        }

        const t: Transaction = await sequelize.transaction();
        try {
            const row = await CollectionModel.create({
                code: payload.code ?? '',
                title: payload.title,
                pincode: payload.pincode,
                address: payload.address,
                amount: payload.amount,
                type: payload.type ?? 'collection',
                area: payload.area ?? null,
                city: payload.city ?? null,
                customerId: payload.customerId ?? null,
                customerName: payload.customerName ?? null,
                assignedAgentId: payload.assignedAgentId ?? null,
                dueAt: payload.dueAt ?? null,
                status: payload.status ?? 'allotted',
            }, { transaction: t });

            if (payload.assignedAgentId) {
                const agentExists = await AgentModel.findByPk(payload.assignedAgentId, { transaction: t });
                if (!agentExists) {
                    throw new Error(`Agent not found: ${payload.assignedAgentId}`);
                }

                await AssignmentModel.create(
                    {
                        collectionId: row.id,
                        agentId: payload.assignedAgentId,
                        assignedAt: new Date(),
                    },
                    { transaction: t }
                );
            }

            await t.commit();

            const created = await CollectionModel.findByPk(row.id, {
                include: [
                    { model: AgentModel, as: 'assignedAgent', attributes: ['id', 'name', 'phone'] },
                    { model: CustomerModel, as: 'customer', attributes: ['id', 'name', 'phone1', 'phone2', 'phone3', 'area', 'pincode'] },
                ],
            });

            return created ? mapCollectionRow(created) : mapCollectionRow(row);
        } catch (err) {
            try {
                await t.rollback();
            } catch (_e) {
                // ignore rollback errors
            }
            throw err;
        }
    },

    async getSummaryCounts() {
        const total = await CollectionModel.count();
        const pending = await CollectionModel.count({ where: { status: 'allotted' } });
        const completed = await CollectionModel.count({ where: { status: 'completed' } });
        return { total, pending, completed };
    },

    async findPending(opts?: { agentId?: string }) {
        const where: any = { status: ['pending', 'allocated'] };

        if (opts?.agentId) {
            where.assignedAgentId = opts.agentId;
        }

        const rows = await CollectionModel.findAll({
            where,
            order: [
                ['pincode', 'ASC'],          // groups by pincode
                ['createdAt', 'DESC'],       // newest first inside each pincode group
            ],
            include: [
                { model: AgentModel, as: 'assignedAgent', attributes: ['id', 'name'] },
                { model: CustomerModel, as: 'customer', attributes: ['id', 'name', 'phone', 'area'] },
            ],
        });

        return rows.map((r) => mapCollectionRow(r));
    },


    async findAll(opts?: { filters?: any; page?: number; limit?: number }) {
        const where: any = {};
        if (opts?.filters) {
            if (opts.filters.status) where.status = opts.filters.status;
            if (opts.filters.assignedAgentId) where.assignedAgentId = opts.filters.assignedAgentId;
            if (opts.filters.customerId) where.customerId = opts.filters.customerId;
        }
        const page = opts?.page && opts.page > 0 ? opts.page : 1;
        const limit = opts?.limit && opts.limit > 0 ? opts.limit : 50;
        const offset = (page - 1) * limit;

        const { rows, count } = await CollectionModel.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            include: [
                { model: AgentModel, as: 'assignedAgent', attributes: ['id', 'name'] },
                { model: CustomerModel, as: 'customer', attributes: ['id', 'name', 'phone', 'area'] },
            ],
        });

        return { items: rows.map((r) => mapCollectionRow(r)), total: count, page, limit };
    },

    async findById(id: string) {
        const row = await CollectionModel.findByPk(id, {
            include: [
                { model: AgentModel, as: 'assignedAgent', attributes: ['id', 'name', 'phone'] },
                { model: CustomerModel, as: 'customer', attributes: ['id', 'name', 'phone', 'area'] },
            ],
        });
        return row ? mapCollectionRow(row) : null;
    },

    async assign(collectionId: string, agentId: string) {
        if (!collectionId || !agentId) throw new Error('collectionId and agentId required');

        const t: Transaction = await sequelize.transaction();
        try {
            const agent = await AgentModel.findByPk(agentId, { transaction: t });
            if (!agent) throw new Error(`Agent not found: ${agentId}`);

            await CollectionModel.update(
                { assignedAgentId: agentId, status: 'allocated' },
                { where: { id: collectionId }, transaction: t }
            );

            const assignment = await AssignmentModel.create(
                {
                    collectionId,
                    agentId,
                    assignedAt: new Date(),
                },
                { transaction: t }
            );

            await t.commit();

            const updatedRow = await CollectionModel.findByPk(collectionId, {
                include: [
                    { model: AgentModel, as: 'assignedAgent', attributes: ['id', 'name', 'phone'] },
                    { model: CustomerModel, as: 'customer', attributes: ['id', 'name', 'phone', 'area'] },
                ],
            });

            return {
                assignment: assignment.toJSON() as any,
                collection: updatedRow ? mapCollectionRow(updatedRow) : null,
            };
        } catch (err) {
            try {
                await t.rollback();
            } catch (_) {
                // ignore
            }
            throw err;
        }
    },

    async update(collectionId: string, data: any) {
        // data MAY include customerId & customerName as prepared by controller
        await CollectionModel.update(data, { where: { id: collectionId } });
        const row = await CollectionModel.findByPk(collectionId, {
            include: [
                { model: AgentModel, as: 'assignedAgent', attributes: ['id', 'name', 'phone'] },
                { model: CustomerModel, as: 'customer', attributes: ['id', 'name', 'phone', 'area'] },
            ],
        });
        return row ? mapCollectionRow(row) : null;
    },

    async updateStatus(collectionId: string, status: string, extra?: any) {
        const payload: any = { status };
        if (extra?.notes !== undefined) payload.notes = extra.notes;
        if (extra?.collectedAmount !== undefined) payload.collectedAmount = extra.collectedAmount;
        if (extra?.deliveredAt !== undefined) payload.deliveredAt = extra.deliveredAt;
        if (extra?.proofUrl !== undefined) payload.proofUrl = extra.proofUrl;

        await CollectionModel.update(payload, { where: { id: collectionId } });
        const row = await CollectionModel.findByPk(collectionId, {
            include: [
                { model: AgentModel, as: 'assignedAgent', attributes: ['id', 'name'] },
                { model: CustomerModel, as: 'customer', attributes: ['id', 'name', 'phone', 'area'] },
            ],
        });
        return row ? mapCollectionRow(row) : null;
    },

    async startTracking(
        collectionId: string,
        agentId: string,
        t?: Transaction
    ): Promise<{ startedAt?: Date | null; collection: any | null }> {
        const txOptions = t ? { transaction: t } : {};
        const col = await CollectionModel.findByPk(collectionId, txOptions);
        if (!col) throw new Error('Collection not found');

        if (col.status === 'allocated' && col.assignedAgentId && col.assignedAgentId !== agentId) {
            throw new Error('Collection already being tracked by another agent');
        }

        col.assignedAgentId = agentId;
        col.status = 'allocated';
        (col as any).trackingStartedAt = new Date();
        await col.save(txOptions);

        const collectionPlain = (await CollectionModel.findByPk(collectionId, {
            include: [
                { model: AgentModel, as: 'assignedAgent', attributes: ['id', 'name', 'phone'] },
                { model: CustomerModel, as: 'customer', attributes: ['id', 'name', 'phone', 'area'] },
            ],
        }))?.toJSON() as any;

        return { startedAt: (col as any).trackingStartedAt?.toISOString?.() ?? new Date().toISOString(), collection: collectionPlain ?? (col.toJSON() as any) };
    },

    async stopTracking(
        collectionId: string,
        agentId: string,
        opts: { lat?: number; lng?: number; batteryLevel?: number } = {},
        t?: Transaction
    ): Promise<{ stoppedAt?: Date | null; collection: any | null }> {
        const txOptions = t ? { transaction: t } : {};
        const col = await CollectionModel.findByPk(collectionId, txOptions);
        if (!col) throw new Error('Collection not found');

        if (col.assignedAgentId && col.assignedAgentId !== agentId) {
            throw new Error('Agent mismatch for this collection');
        }

        (col as any).trackingStoppedAt = new Date();
        (col as any).lastLat = opts.lat ?? (col as any).lastLat;
        (col as any).lastLng = opts.lng ?? (col as any).lastLng;
        (col as any).batteryLevel = opts.batteryLevel ?? (col as any).batteryLevel;
        col.status = col.status === 'completed' ? col.status : 'allotted';

        await col.save(txOptions);

        const collectionPlain = (await CollectionModel.findByPk(collectionId, {
            include: [
                { model: AgentModel, as: 'assignedAgent', attributes: ['id', 'name', 'phone'] },
                { model: CustomerModel, as: 'customer', attributes: ['id', 'name', 'phone', 'area'] },
            ],
        }))?.toJSON() as any;

        return { stoppedAt: (col as any).trackingStoppedAt?.toISOString?.() ?? new Date().toISOString(), collection: collectionPlain ?? (col.toJSON() as any) };
    },

    async savePing(
        collectionId: string,
        agentId: string,
        payload: { lat?: number; lng?: number; batteryLevel?: number; ts?: Date; raw?: any }
    ) {
        const ping = await CollectionPingModel.create({
            collectionId,
            agentId,
            lat: payload.lat ?? null,
            lng: payload.lng ?? null,
            batteryLevel: payload.batteryLevel ?? null,
            ts: payload.ts ?? new Date(),
            raw: JSON.stringify(payload.raw ?? {}),
        });

        // Update collection's last location fields (optional)
        await CollectionModel.update(
            {
                lastLat: payload.lat ?? undefined,
                lastLng: payload.lng ?? undefined,
                lastPingAt: payload.ts ?? new Date(),
                batteryLevel: payload.batteryLevel ?? undefined,
            },
            { where: { id: collectionId } }
        );

        return ping.toJSON() as any;
    },

    async markCollected(collectionId: string, collectedAmount?: number, notes?: string, proofUrl?: string) {
        const payload: any = {
            status: 'collected',
            collectedAmount,
            collectedAt: new Date(),
        };
        if (notes) payload.notes = notes;
        if (proofUrl) payload.proofUrl = proofUrl;

        await CollectionModel.update(payload, { where: { id: collectionId } });
        const row = await CollectionModel.findByPk(collectionId, {
            include: [
                { model: AgentModel, as: 'assignedAgent', attributes: ['id', 'name'] },
                { model: CustomerModel, as: 'customer', attributes: ['id', 'name', 'phone', 'area'] },
            ],
        });
        return row ? mapCollectionRow(row) : null;
    },

    async markDelivered(collectionId: string, notes?: string, proofUrl?: string) {
        const payload: any = {
            status: 'completed',
            deliveredAt: new Date(),
        };
        if (notes) payload.notes = notes;
        if (proofUrl) payload.proofUrl = proofUrl;

        await CollectionModel.update(payload, { where: { id: collectionId } });
        const row = await CollectionModel.findByPk(collectionId, {
            include: [
                { model: AgentModel, as: 'assignedAgent', attributes: ['id', 'name'] },
                { model: CustomerModel, as: 'customer', attributes: ['id', 'name', 'phone', 'area'] },
            ],
        });
        return row ? mapCollectionRow(row) : null;
    },

    async delete(collectionId: string) {
        return CollectionModel.destroy({ where: { id: collectionId } });
    },
};

export default collectionRepo;
