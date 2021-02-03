const Database = require('./GlobalQueries.js');

async function getGuildConfig(guildId) {
    const con = await Database.getConnection();
    const [rows] = await con.execute('SELECT * FROM BD_CONFIG WHERE guildID = ?', [guildId]);
    return rows;
}

async function createGuildConfig(guildId, channelId, message) {
    const con = await Database.getConnection();
    await con.execute('INSERT INTO BD_CONFIG SET guildID = ?, channelID = ?, message = ?', [guildId, channelId, message]);
}

async function getMemberBirthday(guildId, memberId) {
    const con = await Database.getConnection();
    const [rows] = await con.execute('SELECT * FROM BIRTHDAYS WHERE guildID = ? AND memberID = ?', [guildId, memberId]);
    return rows;
}

async function addBirthday(memberId, date, guildId) {
    const con = await Database.getConnection();
    await con.execute('INSERT INTO BIRTHDAYS SET memberID = ?, date = ?, guildID = ?', [memberId, date, guildId]);
}

async function removeBirthday(guildId, memberId) {
    const con = await Database.getConnection();
    await con.execute('DELETE FROM BIRTHDAYS WHERE memberID = ? AND guildID = ?', [memberId, guildId]);
}

async function getTodayAllBirthdays(date) {
    const con = await Database.getConnection();
    const [rows] = await con.execute('SELECT * FROM BIRTHDAYS b INNER JOIN BD_CONFIG c ON b.guildID = c.guildID WHERE date = ?', [date]);
    return rows;
}

module.exports = { getGuildConfig, createGuildConfig, getMemberBirthday, addBirthday, removeBirthday, getTodayAllBirthdays };