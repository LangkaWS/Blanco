const mysql = require('mysql2/promise');

async function getConnection() {
    return await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
}

/* Setup */

async function getAdminRoles(guildId) {
    const con    = await getConnection();
    const [rows] = await con.execute('SELECT * FROM admin_roles WHERE guild_id = ?', [guildId]);
    return rows;
}

async function getSetup(guildId) {
    const con    = await getConnection();
    const [rows] = await con.execute('SELECT * FROM config WHERE guild_id = ?', [guildId]);
    return rows;
}

module.exports = { getConnection, getAdminRoles, getSetup }