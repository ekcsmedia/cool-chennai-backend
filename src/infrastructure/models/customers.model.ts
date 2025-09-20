// src/models/customer.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../sequelize"; // adjust path if your sequelize export is elsewhere

// 1) Attribute interfaces
export interface CustomerAttributes {
    id: string;
    name: string;
    phone?: string | null;
    area?: string | null;

    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}

// 2) Creation attributes (id is generated)
export type CustomerCreationAttributes = Optional<CustomerAttributes, "id" | "createdAt" | "updatedAt" | "deletedAt">;

// 3) Model class
export class CustomerModel extends Model<CustomerAttributes, CustomerCreationAttributes>
    implements CustomerAttributes {
    public id!: string;
    public name!: string;
    public phone!: string | null;
    public area!: string | null;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date | null;
}

// 4) Init / mapping
CustomerModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        area: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: "customers",
        timestamps: true,
        paranoid: true, // soft delete uses deletedAt
        underscored: false,
    }
);

