// src/models/reminder.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';

export type NotifyVia = 'sms' | 'push' | 'both';
export type ReminderStatus = 'scheduled' | 'sent' | 'cancelled';

export interface ReminderAttributes {
    id: string;               // UUID
    collectionId: string;     // UUID
    customerId?: string | null;
    agentId?: string | null;
    notifyVia: NotifyVia;
    remindAt: Date;
    message?: string | null;
    status?: ReminderStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ReminderCreationAttributes = Optional<ReminderAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

export class ReminderModel extends Model<ReminderAttributes, ReminderCreationAttributes>
    implements ReminderAttributes {
    public id!: string;
    public collectionId!: string;
    public customerId!: string | null;
    public agentId!: string | null;
    public notifyVia!: NotifyVia;
    public remindAt!: Date;
    public message!: string | null;
    public status!: ReminderStatus;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

ReminderModel.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    collectionId: { type: DataTypes.UUID, allowNull: false },
    customerId: { type: DataTypes.UUID, allowNull: true },
    agentId: { type: DataTypes.UUID, allowNull: true },
    notifyVia: { type: DataTypes.ENUM('sms','push','both'), allowNull: false },
    remindAt: { type: DataTypes.DATE, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('scheduled','sent','cancelled'), defaultValue: 'scheduled' },
}, {
    sequelize,
    tableName: 'reminders',
    timestamps: true,
});
