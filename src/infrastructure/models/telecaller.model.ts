// src/models/telecaller.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../sequelize";

export interface TelecallerAttributes {
    id: string;
    name: string;
    email: string;
    passwordHash: string;

    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}

export type TelecallerCreationAttributes = Optional<
    TelecallerAttributes,
    "id" | "createdAt" | "updatedAt" | "deletedAt"
>;

export class TelecallerModel
    extends Model<TelecallerAttributes, TelecallerCreationAttributes>
    implements TelecallerAttributes {
    public id!: string;
    public name!: string;
    public email!: string;
    public passwordHash!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date | null;
}

TelecallerModel.init(
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
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: "telecallers",
        timestamps: true,
        paranoid: true,
    }
);
