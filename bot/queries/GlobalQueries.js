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
    let con = null;
    try {
        con    = await getConnection();
        const [rows] = await con.execute('SELECT * FROM admin_roles WHERE guild_id = ?', [guildId]);
        return rows;
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

async function getSetup(guildId) {
    let con = null;
    try {
        con    = await getConnection();
        const [rows] = await con.execute('SELECT * FROM config WHERE guild_id = ?', [guildId]);
        return rows;
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

module.exports = { getConnection, getAdminRoles, getSetup }