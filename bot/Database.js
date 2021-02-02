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

async function setRRMenu(guildId, channelId, menuMessageId, roleId, emoteId) {
    const con = await getConnection();
    await con.execute('INSERT INTO RR_MENU SET guildID = ?, channelID = ?, menuID = ?, roleID = ?, emoteID = ?', [guildId, channelId, menuMessageId, roleId, emoteId]);
}

async function getRRMenu(menuMessageId) {
    const con = await getConnection();
    const [rows] = await con.execute('SELECT * FROM RR_MENU WHERE menuID = ?', [menuMessageId]);
    return rows;
}

async function deleteRRMenu(menuMessageId) {
    const con = await getConnection();
    await con.execute('DELETE FROM RR_MENU WHERE menuID = ?', [menuMessageId]);
}

async function deleteRole(menuMessageId, roleId) {
    const con = await getConnection();
    await con.execute('DELETE FROM RR_MENU WHERE menuID = ? AND roleID = ?', [menuMessageId, roleId]);
}

/* Birthdays */

async function getGuildConfig(guildId) {
    const con = await getConnection();
    const [rows] = await con.execute('SELECT * FROM BD_CONFIG WHERE guildID = ?', [guildId]);
    return rows;
}

async function createGuildConfig(guildId, channelId, message) {
    const con = await getConnection();
    await con.execute('INSERT INTO BD_CONFIG SET guildID = ?, channelID = ?, message = ?', [guildId, channelId, message]);
}

async function getMemberBirthday(guildId, memberId) {
    const con = await getConnection();
    const [rows] = await con.execute('SELECT * FROM BIRTHDAYS WHERE guildID = ? AND memberID = ?', [guildId, memberId]);
    return rows;
}

async function addBirthday(memberId, date, guildId) {
    const con = await getConnection();
    await con.execute('INSERT INTO BIRTHDAYS SET memberID = ?, date = ?, guildID = ?', [memberId, date, guildId]);
}

async function removeBirthday(guildId, memberId) {
    const con = await getConnection();
    await con.execute('DELETE FROM BIRTHDAYS WHERE memberID = ? AND guildID = ?', [memberId, guildId]);
}

module.exports = { getStreaming, setStreaming, updateStreaming, setRRMenu, getRRMenu, deleteRRMenu, deleteRole, getGuildConfig, getMemberBirthday, createGuildConfig, addBirthday, removeBirthday }