// src/infrastructure/models/collectionPing.model.ts
import { Model, DataTypes, Optional, ModelAttributes } from 'sequelize';
import sequelize from "../sequelize";

export interface CollectionPingAttributes {
    id: string;
    collectionId: string;
    agentId?: string | null;
    lat?: number | null;
    lng?: number | null;
    batteryLevel?: number | null;
    ts: Date;                 // client timestamp (or server fallback)
    recordedAt?: Date | null; // server-side recorded timestamp
    raw?: any | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CollectionPingCreationAttributes
    extends Optional<CollectionPingAttributes, 'id' | 'raw' | 'createdAt' | 'updatedAt' | 'recordedAt'> {}

export class CollectionPingModel
    extends Model<CollectionPingAttributes, CollectionPingCreationAttributes>
    implements CollectionPingAttributes {
    public id!: string;
    public collectionId!: string;
    public agentId!: string | null;
    public lat!: number | null;
    public lng!: number | null;
    public batteryLevel!: number | null;
    public ts!: Date;
    public recordedAt!: Date | null;
    public raw!: any | null;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

// --- explicitly typed attributes object to satisfy TS ---
const attributes: ModelAttributes<CollectionPingModel, CollectionPingAttributes> = {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    collectionId: { type: DataTypes.UUID, allowNull: false },
    agentId: { type: DataTypes.UUID, allowNull: true },
    lat: { type: DataTypes.DOUBLE, allowNull: true },
    lng: { type: DataTypes.DOUBLE, allowNull: true },
    batteryLevel: { type: DataTypes.DOUBLE, allowNull: true },
    ts: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    // server-side recorded timestamp (column will be recorded_at because underscored: true)
    recordedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    raw: { type: DataTypes.JSON, allowNull: true },
};

CollectionPingModel.init(attributes, {
    sequelize,
    tableName: 'collection_pings',
    timestamps: true,
    underscored: true,
});
