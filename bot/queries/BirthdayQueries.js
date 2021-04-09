const Database = require('./GlobalQueries.js');

async function getSetup(guildId) {
  let con = null;
  try {
    con = await Database.getConnection();
    const [rows] = await con.execute('SELECT * FROM bd_config WHERE guild_id = ?', [guildId]);
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
    await con.execute('INSERT INTO bd_config SET guild_id = ?, channel_id = ?, message = ?, auto = ?', [guildId, channelId, message, auto]);
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
    await con.execute('UPDATE bd_config SET channel_id = ?, message = ?, auto = ? WHERE guild_id = ?', [channelId, message, auto, guildId]);
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
    const [row] = await con.execute('UPDATE bd_config SET auto = ? WHERE guild_id = ?', [param, guildId]);

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
    const [rows] = await con.execute('SELECT * FROM birthdays WHERE guild_id = ? AND member_id = ?', [guildId, memberId]);
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
    await con.execute('INSERT INTO birthdays SET member_id = ?, date = ?, guild_id = ?', [memberId, date, guildId]);
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
    await con.execute('DELETE FROM birthdays WHERE member_id = ? AND guild_id = ?', [memberId, guildId]);
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
    const [rows] = await con.execute('SELECT * FROM birthdays b INNER JOIN bd_config c ON b.guild_id = c.guild_id WHERE date = ?', [date]);
    return rows;
  } catch (err) {
    console.log(err);
    throw 'SQL Exception';
  } finally {
    con.end();
  }
}

module.exports = { getSetup, createSetup, updateSetup, toogleAutoAnnouncement, getMemberBirthday, addBirthday, removeBirthday, getTodayAllBirthdays };