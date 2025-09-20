// src/models/calllog.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../sequelize";
import { TelecallerModel } from "./telecaller.model";
import {CustomerModel} from "./customers.model";

export interface CallLogAttributes {
    id: string;
    telecallerId: string;
    telecallerName?: string | null;
    customerId: string;
    customerName?: string | null;
    phoneNumber: string;
    startTime: Date;
    endTime?: Date | null;
    durationSeconds?: number | null;
    notes?: string | null;

    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}

export type CallLogCreationAttributes = Optional<
    CallLogAttributes,
    "id" | "telecallerName" | "customerName" | "endTime" | "durationSeconds" | "notes" | "createdAt" | "updatedAt" | "deletedAt"
>;

export class CallLogModel
    extends Model<CallLogAttributes, CallLogCreationAttributes>
    implements CallLogAttributes {
    public id!: string;
    public telecallerId!: string;
    public telecallerName?: string | null;
    public customerId!: string;
    public customerName?: string | null;
    public phoneNumber!: string;
    public startTime!: Date;
    public endTime?: Date | null;
    public durationSeconds?: number | null;
    public notes?: string | null;

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
            allowNull: false,
        },
        telecallerName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        customerId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        customerName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        startTime: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        durationSeconds: {
            type: DataTypes.INTEGER,
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

// Associations
TelecallerModel.hasMany(CallLogModel, { foreignKey: "telecallerId" });
CustomerModel.hasMany(CallLogModel, { foreignKey: "customerId" });
CallLogModel.belongsTo(TelecallerModel, { foreignKey: "telecallerId" });
CallLogModel.belongsTo(CustomerModel, { foreignKey: "customerId" });
