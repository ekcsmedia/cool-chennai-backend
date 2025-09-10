import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from "../sequelize";

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

export class CustomerModel extends Model {}
CustomerModel.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: DataTypes.STRING,
    area: DataTypes.STRING,
}, { sequelize, tableName: 'customers', timestamps: true, paranoid: true });

export class CollectionModel extends Model {}
CollectionModel.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    type: { type: DataTypes.ENUM('pickup', 'delivery', 'service'), allowNull: false },
    area: DataTypes.STRING,
    city: DataTypes.STRING,
    amount: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('pending','assigned','in_progress','completed','cancelled'), defaultValue: 'pending' },
    customerId: { type: DataTypes.UUID, allowNull: true },
    assignedAgentId: { type: DataTypes.UUID, allowNull: true },
    dueAt: { type: DataTypes.DATE, allowNull: true },
}, { sequelize, tableName: 'collections', timestamps: true, paranoid: true });

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
CollectionModel.belongsTo(CustomerModel, { foreignKey: 'customerId' });
CollectionModel.belongsTo(AgentModel, { foreignKey: 'assignedAgentId', as: 'assignedAgent' });
AssignmentModel.belongsTo(CollectionModel, { foreignKey: 'collectionId' });
AssignmentModel.belongsTo(AgentModel, { foreignKey: 'agentId' });


TripHistoryModel.belongsTo(CollectionModel, { foreignKey: 'collectionId', as: 'collection' });
TripHistoryModel.belongsTo(AgentModel, { foreignKey: 'agentId', as: 'agent' });
CollectionModel.belongsTo(CustomerModel, { foreignKey: 'customerId', as: 'customer' });
AgentModel.hasMany(TripHistoryModel, { foreignKey: 'agentId', as: 'trips' });