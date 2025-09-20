import {DataTypes, Model, Optional} from "sequelize";
import sequelize from "../sequelize";

interface CollectionPingAttributes {
    id: string;
    collectionId: string;
    agentId: string | null;
    lat: number | null;
    lng: number | null;
    batteryLevel?: number | null;
    ts?: Date | null;
    raw?: any;
    createdAt?: Date;
    updatedAt?: Date;
    recordedAt?: Date | null;
}

type CollectionPingCreation = Optional<CollectionPingAttributes, 'id' | 'agentId' | 'lat' | 'lng' | 'batteryLevel' | 'ts' | 'raw' | 'createdAt' | 'updatedAt' | 'recordedAt'>;

export class CollectionPingModel extends Model<CollectionPingAttributes, CollectionPingCreation>
    implements CollectionPingAttributes {
    public id!: string;
    public collectionId!: string;
    public agentId!: string | null;
    public lat!: number | null;
    public lng!: number | null;
    public batteryLevel!: number | null;
    public ts!: Date | null;
    public raw!: any;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly recordedAt!: Date | null;
}

CollectionPingModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        collectionId: { type: DataTypes.UUID, allowNull: false },
        agentId: { type: DataTypes.UUID, allowNull: true },
        lat: { type: DataTypes.DOUBLE, allowNull: true },
        lng: { type: DataTypes.DOUBLE, allowNull: true },
        batteryLevel: { type: DataTypes.DOUBLE, allowNull: true },
        ts: { type: DataTypes.DATE, allowNull: true },
        raw: { type: DataTypes.JSON, allowNull: true },
        // optional recorded_at can be mapped to createdAt or kept as separate field if desired
        recordedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
        sequelize,
        tableName: 'collection_pings',
        timestamps: true, // createdAt & updatedAt
        underscored: false,
    }
);

// Export default if you prefer default import style
export default CollectionPingModel;