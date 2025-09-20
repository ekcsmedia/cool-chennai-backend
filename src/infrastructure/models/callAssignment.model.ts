// src/models/callAssignment.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../sequelize";
import { TelecallerModel } from "./telecaller.model";
import {CustomerModel} from "./customers.model";

export interface CallAssignmentAttributes {
    id: string;
    telecallerId: string;
    customerId: string;
    assignedAt?: Date;

    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}

export type CallAssignmentCreationAttributes = Optional<
    CallAssignmentAttributes,
    "id" | "assignedAt" | "createdAt" | "updatedAt" | "deletedAt"
>;

export class CallAssignmentModel
    extends Model<CallAssignmentAttributes, CallAssignmentCreationAttributes>
    implements CallAssignmentAttributes {
    public id!: string;
    public telecallerId!: string;
    public customerId!: string;
    public assignedAt?: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date | null;
}

CallAssignmentModel.init(
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
        customerId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        assignedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: "call_assignments", // 👈 renamed table
        timestamps: true,
        paranoid: true,
    }
);

// Associations
TelecallerModel.hasMany(CallAssignmentModel, { foreignKey: "telecallerId" });
CustomerModel.hasMany(CallAssignmentModel, { foreignKey: "customerId" });
CallAssignmentModel.belongsTo(TelecallerModel, { foreignKey: "telecallerId" });
CallAssignmentModel.belongsTo(CustomerModel, { foreignKey: "customerId" });
