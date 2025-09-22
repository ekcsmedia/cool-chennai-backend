// src/models/customer.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../sequelize"; // adjust path if your sequelize export is elsewhere

// 1) Attribute interfaces
export interface CustomerAttributes {
    id: string;
    name: string;
    phone?: string | null;
    area?: string | null;
    pincode?: string | null;   // ✅ new field

    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}

// 2) Creation attributes (id is generated)
export type CustomerCreationAttributes = Optional<
    CustomerAttributes,
    "id" | "createdAt" | "updatedAt" | "deletedAt"
>;

// 3) Model class
export class CustomerModel
    extends Model<CustomerAttributes, CustomerCreationAttributes>
    implements CustomerAttributes
{
    public id!: string;
    public name!: string;
    public phone!: string | null;
    public area!: string | null;
    public pincode!: string | null;   // ✅ new field

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
        pincode: {
            type: DataTypes.STRING(6), // ✅ store as string to preserve leading zeros
            allowNull: false,
            defaultValue: '000000',
            validate: {
                is: {
                    args: [/^\d{6}$/], // must be exactly 6 digits
                    msg: "Pincode must be exactly 6 digits",
                },
            },
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
