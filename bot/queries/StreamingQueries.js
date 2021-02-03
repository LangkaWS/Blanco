const Database = require('./GlobalQueries.js');

async function getStreaming(guildId) {
    const con = await Database.getConnection();
    const [rows] =  await con.execute('SELECT * FROM STREAMING_CONFIG WHERE guildID = ?', [guildId]);
    return rows;
}

async function setStreaming(guildId, role, channel, message) {
    const con = await Database.getConnection();
    await con.execute('INSERT INTO STREAMING_CONFIG SET guildID = ?, streamingRole = ?, streamingChannelId = ?, streamingMessage = ?', [guildId, role, channel, message]);
}

async function updateStreaming(guildId, role, channel, message) {
    const con = await Database.getConnection();
    await con.execute('UPDATE STREAMING_CONFIG SET streamingRole = ?, streamingChannelId = ?, streamingMessage = ? WHERE guildID = ?', [role, channel, message, guildId]);
}

module.exports = { getStreaming, setStreaming, updateStreaming };