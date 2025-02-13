import dotenv from 'dotenv';
import sql from 'mssql';
dotenv.config();
const config = {
    user: process.env["DB_USER"] || '',
    password: process.env["DB_PASSWORD"] || '',
    server: process.env["DB_HOST"] || '',
    port: process.env["DB_PORT"] ? parseInt(process.env["DB_PORT"], 10) : 1433,
    database: process.env["DB_NAME"] || '',
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};
export async function connectToDatabase() {
    try {
        console.log("Attempting to connect to SQL Server...");
        const pool = await sql.connect(config);
        console.log("Connected to SQL Server!");
        return pool;
    }
    catch (err) {
        console.error("SQL error:", err);
        throw err;
    }
}
