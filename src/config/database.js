
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
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "docla_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function connectMariaDB() {
    let connection;

    try {
        connection = await pool.getConnection();

        await connection.ping();

        console.log("MySQL conectado correctamente");

        return true;

    } catch (error) {
        console.error("Error al conectar con MySQL:", error.message);
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


