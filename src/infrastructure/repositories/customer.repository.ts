// repositories/customer.repository.ts
import { Transaction, WhereOptions } from "sequelize";
import {CustomerAttributes, CustomerCreationAttributes, CustomerModel} from "../models/customers.model";

export class CustomerRepository {
    async create(data: CustomerCreationAttributes, tx?: Transaction): Promise<CustomerModel> {
        return CustomerModel.create(data, { transaction: tx });
    }

    async findById(id: string): Promise<CustomerModel | null> {
        return CustomerModel.findByPk(id);
    }

    async findAll(opts?: {
        limit?: number;
        offset?: number;
        where?: WhereOptions;
        order?: any;
    }): Promise<{ rows: CustomerModel[]; count: number }> {
        const { limit = 20, offset = 0, where = {}, order = [["createdAt", "DESC"]] } = opts || {};
        const result = await CustomerModel.findAndCountAll({
            where,
            limit,
            offset,
            order,
        });
        return { rows: result.rows, count: result.count };
    }

    async update(id: string, data: Partial<any>, tx?: Transaction): Promise<number> {
        const [affectedCount] = await CustomerModel.update(data, {
            where: { id },
            transaction: tx,
            // returning: true // only useful on PG; on MySQL/MariaDB this is ignored
        });
        return typeof affectedCount === "number" ? affectedCount : 0;
    }

    async softDelete(id: string, tx?: Transaction): Promise<void> {
        const instance = await CustomerModel.findByPk(id);
        if (!instance) throw new Error("Customer not found");
        await instance.destroy({ transaction: tx }); // sets deletedAt
    }

    async hardDelete(id: string, tx?: Transaction): Promise<void> {
        const instance = await CustomerModel.findByPk(id, { paranoid: false });
        if (!instance) throw new Error("Customer not found");
        await instance.destroy({ force: true, transaction: tx }); // physical delete
    }
}
