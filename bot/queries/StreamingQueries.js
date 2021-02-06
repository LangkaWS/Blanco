const Database = require('./GlobalQueries.js');

async function getStreaming(guildId) {
    const con    = await Database.getConnection();
    const [rows] =  await con.execute('SELECT str_channel_id, str_role_id, str_message, str_active FROM config WHERE guild_id = ?', [guildId]);
    return rows;
}

async function setStreaming(guildId, role, channel, message) {
    const con = await Database.getConnection();
    await con.execute('INSERT INTO config SET guild_id = ?, str_channel_id = ?, str_role_id = ?, str_message = ?', [guildId, channel, role, message]);
}

async function updateStreaming(guildId, role, channel, message) {
    const con = await Database.getConnection();
    await con.execute('UPDATE config SET str_channel_id = ?, str_role_id = ?, str_message = ? WHERE guild_id = ?', [channel, role, message, guildId]);
}

module.exports = { getStreaming, setStreaming, updateStreaming };