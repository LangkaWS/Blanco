const Database = require('./GlobalQueries.js');

async function getSetup(guildId) {
    let con = null;
    try {
        con = await Database.getConnection();
        const [rows] = await con.execute('SELECT * FROM mbmger_config WHERE guild_id = ?', [guildId]);
        return rows;
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

async function createSetup(guildId, channelId, message, auto) {
    let con = null;
    try {
        con = await Database.getConnection();
        await con.execute('INSERT INTO mbmger_config SET guild_id = ?, message = ?, auto = ?', [guildId, channelId, message, auto]);
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

async function updateSetup(guildId, channelId, message, auto) {
    let con = null;
    try {
        con = await Database.getConnection();
        await con.execute('UPDATE mbmger_config SET message = ?, auto = ? WHERE guild_id = ?', [channelId, message, auto, guildId]);
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
        const [row] = await con.execute('UPDATE mbmger_config SET auto = ? WHERE guild_id = ?', [param, guildId]);
        return row;
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

module.exports = { getSetup, createSetup, updateSetup, toogleAutoAnnouncement };