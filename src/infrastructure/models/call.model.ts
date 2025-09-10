import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../sequelize";

interface CallAttributes {
    id: number;
    callId: string;
    customerId?: string | number | null;
    customerName: string;
    agentId?: string | number | null;
    agentName?: string | null;
    durationSeconds?: number | null;
    status: string;
    startedAt?: Date | null;
    endedAt?: Date | null;
    locationLat?: number | null;
    locationLng?: number | null;
    notes?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

interface CallCreationAttributes extends Optional<CallAttributes, "id" | "callId" | "createdAt" | "updatedAt"> {}

export class CallModel extends Model<CallAttributes, CallCreationAttributes> implements CallAttributes {
    public id!: number;
    public callId!: string;
    public customerId?: string | number | null;
    public customerName!: string;
    public agentId?: string | number | null;
    public agentName?: string | null;
    public durationSeconds?: number | null;
    public status!: string;
    public startedAt?: Date | null;
    public endedAt?: Date | null;
    public locationLat?: number | null;
    public locationLng?: number | null;
    public notes?: string | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

CallModel.init(
    {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        callId: { type: DataTypes.STRING(64), allowNull: false, unique: true },
        customerId: { type: DataTypes.STRING(64), allowNull: true },
        customerName: { type: DataTypes.STRING, allowNull: false },
        agentId: { type: DataTypes.STRING(64), allowNull: true },
        agentName: { type: DataTypes.STRING, allowNull: true },
        durationSeconds: { type: DataTypes.INTEGER, allowNull: true },
        status: { type: DataTypes.STRING(32), allowNull: false },
        startedAt: { type: DataTypes.DATE, allowNull: true },
        endedAt: { type: DataTypes.DATE, allowNull: true },
        locationLat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
        locationLng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
        sequelize,
        tableName: "calls",
        timestamps: true,
        indexes: [{ fields: ["callId"] }, { fields: ["agentId"] }, { fields: ["customerId"] }],
    }
);

export default CallModel;
