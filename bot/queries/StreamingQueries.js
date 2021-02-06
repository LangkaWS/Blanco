const Database = require('./GlobalQueries.js');

async function getStreaming(guildId) {
    const con    = await Database.getConnection();
    const [rows] = await con.execute('SELECT * FROM config WHERE guild_id = ?', [guildId]);
    return rows;
}

async function getStreamingRoleId(guildId) {
    const con    = await Database.getConnection();
    const [rows] = await con.execute('SELECT str_role_id FROM config WHERE guild_id = ?', [guildId]);
    return rows;
}

async function getStreamingChannelAndMessage(guildId) {
    const con    = await Database.getConnection();
    const [rows] = await con.execute('SELECT str_channel_id, str_message FROM config WHERE guild_id = ?', [guildId]);
    return rows;
}

async function toogleAutoAnnouncement(param, guildId) {
    const con = await Database.getConnection();
    await con.execute('UPDATE config SET str_active = ? WHERE guild_id = ?', [param, guildId]);
}

async function isStreamActive(guildId) {
    const con    = await Database.getConnection();
    const [rows] = await con.execute('SELECT str_active FROM config WHERE guild_id = ?', [guildId]);
    return rows;
}

async function setStreaming(guildId, role, channel, message, autoParam) {
    const con = await Database.getConnection();
    await con.execute('INSERT INTO config SET guild_id = ?, str_channel_id = ?, str_role_id = ?, str_message = ?, str_active = ?', [guildId, channel, role, message, autoParam]);
}

async function updateStreaming(guildId, role, channel, message, autoParam) {
    const con = await Database.getConnection();
    await con.execute('UPDATE config SET str_channel_id = ?, str_role_id = ?, str_message = ?, str_active = ? WHERE guild_id = ?', [channel, role, message, autoParam, guildId]);
}

module.exports = { getStreaming, getStreamingChannelAndMessage, getStreamingRoleId, toogleAutoAnnouncement, isStreamActive, setStreaming, updateStreaming };