import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from "../sequelize";
import {CustomerModel} from "./customers.model";
import CollectionPingModel from "./collection_ping_model";

export class AgentModel extends Model {}
AgentModel.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: DataTypes.STRING,
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    status: { type: DataTypes.ENUM('on_duty', 'idle', 'off_duty'), defaultValue: 'idle' },
    lastSeenAt: DataTypes.DATE,
    password: { type: DataTypes.STRING, allowNull: false },
}, { sequelize, tableName: 'agents', timestamps: true, paranoid: true });

interface DeviceTokenAttributes {
    id: string;
    agentId?: string | null;
    platform: "android" | "ios" | "web";
    token: string;
    lastSeenAt: Date;
}

// 2. Define creation attributes (id & lastSeenAt are auto-generated)
interface DeviceTokenCreationAttributes
    extends Optional<DeviceTokenAttributes, "id" | "lastSeenAt"> {}

// 3. Extend Sequelize Model with types
export class DeviceTokenModel
    extends Model<DeviceTokenAttributes, DeviceTokenCreationAttributes>
    implements DeviceTokenAttributes
{
    public id!: string;
    public agentId!: string | null;
    public platform!: "android" | "ios" | "web";
    public token!: string;
    public lastSeenAt!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

// 4. Init model
DeviceTokenModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        agentId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        platform: {
            type: DataTypes.ENUM("android", "ios", "web"),
            allowNull: false,
        },
        token: {
            type: DataTypes.STRING(512),
            allowNull: false,
            unique: true,
        },
        lastSeenAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    { sequelize, tableName: "device_tokens", timestamps: true }
);

// src/models/collection.model.ts  (adjust path if needed)
// ---- 1) Attribute interfaces ----
export type CollectionType = 'pickup' | 'delivery' | 'service' | 'collection';
export type CollectionStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'collected';

export interface CollectionAttributes {
    id: string;
    code: string;
    title: string;
    address: string;
    customerName?: string | null; // ✅ added
    type: CollectionType;
    area?: string | null;
    city?: string | null;
    amount: number;
    status: CollectionStatus;
    customerId?: string | null;
    assignedAgentId?: string | null;

    // ✅ tracking/location fields
    lastLat?: number | null;
    lastLng?: number | null;
    lastPingAt?: Date | null;
    batteryLevel?: number | null;
    trackingStartedAt?: Date | null;
    trackingStoppedAt?: Date | null;

    // due date
    dueAt?: Date | null;

    // audit timestamps
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}

// When creating a collection, these fields can be optional:
export type CollectionCreationAttributes = Optional<
    CollectionAttributes,
    'id' | 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

// ---- 2) Model class with typed properties ----
export class CollectionModel extends Model<CollectionAttributes, CollectionCreationAttributes>
    implements CollectionAttributes {
    public id!: string;
    public title!: string;
    public address!: string;
    public code!: string;
    public type!: CollectionType;
    public area!: string | null;
    public city!: string | null;
    public amount!: number;
    public status!: CollectionStatus;
    public customerId!: string | null;
    public customerName!: string | null; // ✅ added
    public assignedAgentId!: string | null;
    public dueAt!: Date | null;

    public lastLat!: number | null;
    public lastLng!: number | null;
    public lastPingAt!: Date | null;
    public batteryLevel!: number | null;
    public trackingStartedAt!: Date | null;
    public trackingStoppedAt!: Date | null;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date | null;
}

// ---- 3) Init / mapping (updated) ----
CollectionModel.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        code: { type: DataTypes.STRING, allowNull: false, unique: true },
        title: { type: DataTypes.STRING, allowNull: false, unique: false },
        address: { type: DataTypes.STRING, allowNull: false, unique: false },
        pincode: {
            type: DataTypes.STRING(6),
            allowNull: false,
            validate: {
                isNumeric: true,
                len: [6, 6], // must be exactly 6 chars long
            },
        },
        type: { type: DataTypes.ENUM('pickup', 'delivery', 'service', 'collection'), allowNull: false },
        area: DataTypes.STRING,
        city: DataTypes.STRING,
        amount: { type: DataTypes.INTEGER, allowNull: false },
        status: {
            type: DataTypes.ENUM('pending','assigned','in_progress','completed','cancelled', 'collected'),
            defaultValue: 'pending'
        },
        customerId: { type: DataTypes.UUID, allowNull: true },
        customerName: { type: DataTypes.STRING, allowNull: true }, // ✅ added
        assignedAgentId: { type: DataTypes.UUID, allowNull: true },
        dueAt: { type: DataTypes.DATE, allowNull: true },
        lastLat: { type: DataTypes.DOUBLE, allowNull: true },
        lastLng: { type: DataTypes.DOUBLE, allowNull: true },
        lastPingAt: { type: DataTypes.DATE, allowNull: true },
        batteryLevel: { type: DataTypes.DOUBLE, allowNull: true },
        trackingStartedAt: { type: DataTypes.DATE, allowNull: true },
        trackingStoppedAt: { type: DataTypes.DATE, allowNull: true }
    },
    {
        sequelize,
        tableName: 'collections',
        timestamps: true,
        paranoid: true,
        underscored: false,
    }
);


export class AssignmentModel extends Model {}
AssignmentModel.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    collectionId: { type: DataTypes.UUID, allowNull: false },
    agentId: { type: DataTypes.UUID, allowNull: false },
    assignedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    reassignedFromId: { type: DataTypes.UUID, allowNull: true },
}, { sequelize, tableName: 'assignments', timestamps: true, paranoid: true });

export class LocationPingModel extends Model {}
LocationPingModel.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    agentId: { type: DataTypes.UUID, allowNull: false },
    lat: { type: DataTypes.DOUBLE, allowNull: false },
    lng: { type: DataTypes.DOUBLE, allowNull: false },
    recordedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    batteryLevel: { type: DataTypes.FLOAT, allowNull: true },
    stop: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, tableName: 'location_pings', timestamps: false });

export class NotificationModel extends Model {}
NotificationModel.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    kind: { type: DataTypes.ENUM('assignment','overdue','generic'), defaultValue: 'generic' },
    status: { type: DataTypes.ENUM('new','snoozed','in_progress','done'), defaultValue: 'new' },
    actorRole: { type: DataTypes.ENUM('admin','agent'), defaultValue: 'admin' },
    meta: { type: DataTypes.JSON, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    dueAt: { type: DataTypes.DATE, allowNull: true },
}, { sequelize, tableName: 'notifications', updatedAt: false, createdAt: false });

export class TripHistoryModel extends Model {}
TripHistoryModel.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    agentId: { type: DataTypes.UUID, allowNull: false },
    collectionId: { type: DataTypes.UUID, allowNull: false },
    startedAt: { type: DataTypes.DATE, allowNull: false },
    completedAt: { type: DataTypes.DATE, allowNull: false },
    distanceKm: { type: DataTypes.FLOAT, allowNull: false },
    routeSummary: { type: DataTypes.STRING, allowNull: true },
}, { sequelize, tableName: 'trip_history', timestamps: false });

// Associations (optional minimal)
CollectionModel.belongsTo(AgentModel, { foreignKey: 'assignedAgentId', as: 'assignedAgent' });
AssignmentModel.belongsTo(CollectionModel, { foreignKey: 'collectionId' });
AssignmentModel.belongsTo(AgentModel, { foreignKey: 'agentId' });


TripHistoryModel.belongsTo(CollectionModel, { foreignKey: 'collectionId', as: 'collection' });
TripHistoryModel.belongsTo(AgentModel, { foreignKey: 'agentId', as: 'agent' });
CollectionModel.belongsTo(CustomerModel, { foreignKey: 'customerId', as: 'customer' });
AgentModel.hasMany(TripHistoryModel, { foreignKey: 'agentId', as: 'trips' });
CollectionPingModel.belongsTo(AgentModel, { foreignKey: 'agentId', as: 'agent' });
AgentModel.hasMany(CollectionPingModel, { foreignKey: 'agentId', as: 'pings' });

CollectionPingModel.belongsTo(CollectionModel, { foreignKey: "collectionId", as: "collection" });
CollectionModel.hasMany(CollectionPingModel, { foreignKey: "collectionId", as: "pings" });
