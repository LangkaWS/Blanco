const Database = require('./GlobalQueries.js');

async function getSetup(guildId) {
    let con = null;
    try {
        con = await Database.getConnection();
        const [rows] = await con.execute('SELECT guild_id, bd_channel_id, bd_message, bd_auto FROM config WHERE guild_id = ?', [guildId]);
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
        await con.execute('INSERT INTO config SET guild_id = ?, bd_channel_id = ?, bd_message = ?, bd_auto = ?', [guildId, channelId, message, auto]);
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
        await con.execute('UPDATE config SET bd_channel_id = ?, bd_message = ?, bd_auto = ? WHERE guild_id = ?', [channelId, message, auto, guildId]);
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
        const [row] = await con.execute('UPDATE config SET bd_active = ? WHERE guild_id = ?', [param, guildId]);
        return row;
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

async function getMemberBirthday(guildId, memberId) {
    let con = null;
    try {
        con = await Database.getConnection();
        const [rows] = await con.execute('SELECT * FROM BIRTHDAYS WHERE guild_id = ? AND member_id = ?', [guildId, memberId]);
        return rows;
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

async function addBirthday(memberId, date, guildId) {
    let con = null;
    try {
        con = await Database.getConnection();
        await con.execute('INSERT INTO BIRTHDAYS SET member_id = ?, date = ?, guild_id = ?', [memberId, date, guildId]);
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

async function removeBirthday(guildId, memberId) {
    let con = null;
    try {
        con = await Database.getConnection();
        await con.execute('DELETE FROM BIRTHDAYS WHERE member_id = ? AND guild_id = ?', [memberId, guildId]);
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

async function getTodayAllBirthdays(date) {
    let con = null;
    try {
        con = await Database.getConnection();
        const [rows] = await con.execute('SELECT * FROM BIRTHDAYS b INNER JOIN config c ON b.guild_id = c.guild_id WHERE date = ?', [date]);
        return rows;
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

module.exports = { getSetup, createSetup, updateSetup, toogleAutoAnnouncement, getMemberBirthday, addBirthday, removeBirthday, getTodayAllBirthdays };