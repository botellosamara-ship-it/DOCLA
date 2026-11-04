
require("dotenv").config();

const { MongoClient } = require("mongodb");
const mysql = require("mysql2/promise");


const client = new MongoClient(process.env.MONGODB_URI);

let db;

async function connectMongoDB() {
    try {
        if (db) {
            return db;
        }

        await client.connect();

        db = client.db("DOCLA");

        console.log("MongoDB conectado correctamente");

        return db;

    } catch (error) {
        console.error("Error al conectar con MongoDB:", error.message);
        throw error;
    }
}


const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

async function connectMariaDB() {
    let connection;

    try {
        connection = await pool.getConnection();

        await connection.ping();

        console.log("MariaDB conectado correctamente");

        return true;

    } catch (error) {
        console.error("Error al conectar con MariaDB:", error.message);
        throw error;

    } finally {
        if (connection) {
            connection.release();
        }
    }
}


module.exports = {
    connectMongoDB,
    connectMariaDB,
    pool
};
