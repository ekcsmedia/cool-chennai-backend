// src/models/calllog.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../sequelize"; // adjust to your sequelize instance path

export interface CallLogAttributes {
    id: string;
    telecallerId: string | null;
    telecallerName?: string | null;
    customerId?: string | null;
    customerName?: string | null;
    phoneNumber?: string | null;
    startTime?: Date | null;
    endTime?: Date | null;
    durationSeconds?: number | null;
    callType?: string | null; // INCOMING / OUTGOING / MISSED etc
    notes?: string | null;
    callId?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}

export type CallLogCreationAttributes = Optional<
    CallLogAttributes,
    | "id"
    | "telecallerId"
    | "telecallerName"
    | "customerId"
    | "customerName"
    | "phoneNumber"
    | "startTime"
    | "endTime"
    | "durationSeconds"
    | "callType"
    | "notes"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
>;

export class CallLogModel extends Model<CallLogAttributes, CallLogCreationAttributes>
    implements CallLogAttributes {
    public id!: string;
    public telecallerId!: string | null;
    public telecallerName!: string | null;
    public customerId!: string | null;
    public customerName!: string | null;
    public phoneNumber!: string | null;
    public startTime!: Date | null;
    public endTime!: Date | null;
    public durationSeconds!: number | null;
    public callType!: string | null;
    public notes!: string | null;
    public callId!: string | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date | null;
}

CallLogModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        telecallerId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        telecallerName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        customerId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        customerName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        startTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        durationSeconds: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        callType: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        callId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: "call_logs",
        timestamps: true,
        paranoid: true,
    }
);

export default CallLogModel;
