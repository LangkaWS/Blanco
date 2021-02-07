const Database = require('./GlobalQueries.js');

async function getSetup(guildId) {
    const con = await Database.getConnection();
    const [rows] = await con.execute('SELECT guild_id, bd_channel_id, bd_message, bd_auto FROM config WHERE guild_id = ?', [guildId]);
    return rows;
}

async function createSetup(guildId, channelId, message, auto) {
    const con = await Database.getConnection();
    await con.execute('INSERT INTO config SET guild_id = ?, bd_channel_id = ?, bd_message = ?, bd_auto = ?', [guildId, channelId, message, auto]);
}

async function updateSetup(guildId, channelId, message, auto) {
    const con = await Database.getConnection();
    await con.execute('UPDATE config SET bd_channel_id = ?, bd_message = ?, bd_auto = ? WHERE guild_id = ?', [channelId, message, auto, guildId]);
}

async function toogleAutoAnnouncement(param, guildId) {
    const con = await Database.getConnection();
    const [row] = await con.execute('UPDATE config SET bd_active = ? WHERE guild_id = ?', [param, guildId]);
    return row;
}

async function getMemberBirthday(guildId, memberId) {
    const con = await Database.getConnection();
    const [rows] = await con.execute('SELECT * FROM BIRTHDAYS WHERE guild_id = ? AND member_id = ?', [guildId, memberId]);
    return rows;
}

async function addBirthday(memberId, date, guildId) {
    const con = await Database.getConnection();
    await con.execute('INSERT INTO BIRTHDAYS SET member_id = ?, date = ?, guild_id = ?', [memberId, date, guildId]);
}

async function removeBirthday(guildId, memberId) {
    const con = await Database.getConnection();
    await con.execute('DELETE FROM BIRTHDAYS WHERE member_id = ? AND guild_id = ?', [memberId, guildId]);
}

async function getTodayAllBirthdays(date) {
    const con = await Database.getConnection();
    const [rows] = await con.execute('SELECT * FROM BIRTHDAYS b INNER JOIN config c ON b.guild_id = c.guild_id WHERE date = ?', [date]);
    return rows;
}

module.exports = { getSetup, createSetup, updateSetup, toogleAutoAnnouncement, getMemberBirthday, addBirthday, removeBirthday, getTodayAllBirthdays };