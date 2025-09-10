import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../sequelize";

interface ReminderAttributes {
    id: number;
    collectionId: number;
    customerId: number;
    agentId: number;
    notifyVia: string;
    remindAt: Date;
    message?: string | null;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface ReminderCreation extends Optional<ReminderAttributes, "id" | "status" | "createdAt" | "updatedAt"> {}

export class ReminderModel extends Model<ReminderAttributes, ReminderCreation> implements ReminderAttributes {
    public id!: number;
    public collectionId!: number;
    public customerId!: number;
    public agentId!: number;
    public notifyVia!: string;
    public remindAt!: Date;
    public message?: string | null;
    public status!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

ReminderModel.init(
    {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        collectionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        customerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        agentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        notifyVia: { type: DataTypes.ENUM("sms", "push", "both"), allowNull: false },
        remindAt: { type: DataTypes.DATE, allowNull: false },
        message: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.ENUM("scheduled", "sent", "cancelled"), allowNull: false, defaultValue: "scheduled" },
    },
    {
        sequelize,
        tableName: "reminders",
        timestamps: true,
    }
);

export default ReminderModel;
