// src/models/customer.model.ts
import {DataTypes, Model, Optional} from "sequelize";
import sequelize from "../sequelize"; // adjust path if needed

// 1) Attribute interfaces
export interface CustomerAttributes {
    id: string;
    name: string;
    phone1: string;             // ✅ primary phone (mandatory)
    phone2?: string | null;     // ✅ secondary (optional)
    phone3?: string | null;     // ✅ tertiary (optional)
    area?: string | null;
    pincode?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}

// 2) Creation attributes (id and timestamps auto-generated)
export type CustomerCreationAttributes = Optional<
    CustomerAttributes,
    "id" | "phone2" | "phone3" | "createdAt" | "updatedAt" | "deletedAt"
>;

// 3) Model class
export class CustomerModel
    extends Model<CustomerAttributes, CustomerCreationAttributes>
    implements CustomerAttributes {
    public id!: string;
    public name!: string;

    public phone1!: string;
    public phone2!: string | null;
    public phone3!: string | null;

    public area!: string | null;
    public pincode!: string | null;

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
        phone1: {
            type: DataTypes.STRING,
            allowNull: false, // ✅ mandatory
        },
        phone2: {
            type: DataTypes.STRING,
            allowNull: true, // ✅ optional
        },
        phone3: {
            type: DataTypes.STRING,
            allowNull: true, // ✅ optional
        },
        area: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        pincode: {
            type: DataTypes.STRING(6),
            allowNull: false,
            defaultValue: "000000",
            validate: {
                is: {
                    args: [/^\d{6}$/],
                    msg: "Pincode must be exactly 6 digits",
                },
            },
        },
    },
    {
        sequelize,
        tableName: "customers",
        timestamps: true,
        paranoid: true,
        underscored: false,
    }
);
