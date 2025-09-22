// src/models/admin.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import bcrypt from 'bcrypt';

export interface AdminAttributes {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role?: string;

    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}

export type AdminCreationAttributes = Optional<
    AdminAttributes,
    'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class AdminModel extends Model<AdminAttributes, AdminCreationAttributes>
    implements AdminAttributes {
    public id!: string;
    public name!: string;
    public email!: string;
    public passwordHash!: string;
    public role!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date | null;

    public async verifyPassword(plain: string): Promise<boolean> {
        return bcrypt.compare(plain, this.passwordHash);
    }
}

AdminModel.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        passwordHash: { type: DataTypes.STRING, allowNull: false },
        role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'admin' },
    },
    {
        sequelize,
        tableName: 'admins',
        timestamps: true,
        paranoid: true,
        indexes: [{ unique: true, fields: ['email'] }],
    }
);

export default AdminModel;
