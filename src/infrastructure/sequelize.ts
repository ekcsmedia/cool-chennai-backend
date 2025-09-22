import { Sequelize } from "sequelize";

// const sequelize = new Sequelize(
//     process.env.DB_NAME as string,
//     process.env.DB_USER as string,
//     process.env.DB_PASS as string,
//     {
//         host: process.env.DB_HOST,
//         port: Number(process.env.DB_PORT),
//         dialect: "mysql",
//         logging: false,
//     }
// );

export const sequelize = new Sequelize({
    dialect: 'mysql',
    host: 'maglev.proxy.rlwy.net',
    port: 47343,
    username: 'root',
    password: 'mxyVSiAyRsOBcVEpRvEfVVNYWdIoHltD',
    database: 'railway',
    logging: console.log,
});

export default sequelize;
