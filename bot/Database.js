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

/* Streaming */

async function getStreaming(guildId) {
    const con = await getConnection();
    const [rows] =  await con.execute('SELECT * FROM STREAMING_CONFIG WHERE guildID = ?', [guildId]);
    return rows;
}

async function setStreaming(guildId, role, channel, message) {
    const con = await getConnection();
    await con.execute('INSERT INTO STREAMING_CONFIG SET guildID = ?, streamingRole = ?, streamingChannelId = ?, streamingMessage = ?', [guildId, role, channel, message]);
}

async function updateStreaming(guildId, role, channel, message) {
    const con = await getConnection();
    await con.execute('UPDATE STREAMING_CONFIG SET streamingRole = ?, streamingChannelId = ?, streamingMessage = ? WHERE guildID = ?', [role, channel, message, guildId]);
}

/* Reaction Roles */

async function setRRMenu(guildId, menuMessageId, roleId, emoteId) {
    const con = await getConnection();
    await con.execute('INSERT INTO RR_MENU SET guildID = ?, menuID = ?, roleID = ?, emoteID = ?', [guildId, menuMessageId, roleId, emoteId]);
}

async function getRRMenu(menuMessageId) {
    const con = await getConnection();
    const [rows] = await con.execute('SELECT * FROM RR_MENU WHERE menuID = ?', [menuMessageId]);
    return rows;
}

module.exports = { getStreaming, setStreaming, updateStreaming, setRRMenu, getRRMenu }