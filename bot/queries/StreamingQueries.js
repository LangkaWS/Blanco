const Database = require('./GlobalQueries.js');

async function getStreaming(guildId) {
    let con = null;
    try {
        con    = await Database.getConnection();
        const [rows] = await con.execute('SELECT * FROM config WHERE guild_id = ?', [guildId]);
        return rows;
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

async function getStreamingRoleId(guildId) {
    let con = null;
    try {
        con    = await Database.getConnection();
        const [rows] = await con.execute('SELECT str_role_id FROM config WHERE guild_id = ?', [guildId]);
        return rows;
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

async function getStreamingChannelAndMessage(guildId) {
    let con = null;
    try {
        con    = await Database.getConnection();
        const [rows] = await con.execute('SELECT str_channel_id, str_message FROM config WHERE guild_id = ?', [guildId]);
        return rows;
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

async function toogleAutoAnnouncement(param, guildId) {
    let con = null;
    try {
        con = await Database.getConnection();
        await con.execute('UPDATE config SET str_active = ? WHERE guild_id = ?', [param, guildId]);
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

async function isStreamActive(guildId) {
    let con = null;
    try {
        con    = await Database.getConnection();
        const [rows] = await con.execute('SELECT str_active FROM config WHERE guild_id = ?', [guildId]);
        return rows;
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

async function setStreaming(guildId, role, channel, message, autoParam) {
    let con = null;
    try {
        con = await Database.getConnection();
        await con.execute('INSERT INTO config SET guild_id = ?, str_channel_id = ?, str_role_id = ?, str_message = ?, str_active = ?', [guildId, channel, role, message, autoParam]);
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

async function updateStreaming(guildId, role, channel, message, autoParam) {
    let con = null;
    try {
        con = await Database.getConnection();
        await con.execute('UPDATE config SET str_channel_id = ?, str_role_id = ?, str_message = ?, str_active = ? WHERE guild_id = ?', [channel, role, message, autoParam, guildId]);
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

module.exports = { getStreaming, getStreamingChannelAndMessage, getStreamingRoleId, toogleAutoAnnouncement, isStreamActive, setStreaming, updateStreaming };