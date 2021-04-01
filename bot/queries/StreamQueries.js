const Database = require('./GlobalQueries.js');

async function getSetup(guildId) {
  let con = null;
  try {
    con  = await Database.getConnection();
    const [rows] = await con.execute('SELECT * FROM str_config WHERE guild_id = ?', [guildId]);
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
    con  = await Database.getConnection();
    const [rows] = await con.execute('SELECT role_id FROM str_config WHERE guild_id = ?', [guildId]);
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
    con  = await Database.getConnection();
    const [rows] = await con.execute('SELECT channel_id, message FROM str_config WHERE guild_id = ?', [guildId]);
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
    await con.execute('UPDATE str_config SET auto = ? WHERE guild_id = ?', [param, guildId]);
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
    con  = await Database.getConnection();
    const [rows] = await con.execute('SELECT auto FROM str_config WHERE guild_id = ?', [guildId]);
    return rows;
  } catch (err) {
    console.log(err);
    throw 'SQL Exception';
  } finally {
    con.end();
  }
}

async function createSetup(guildId, role, channel, message, autoParam) {
  let con = null;
  try {
    con = await Database.getConnection();
    await con.execute('INSERT INTO str_config SET guild_id = ?, channel_id = ?, role_id = ?, message = ?, auto = ?', [guildId, channel, role, message, autoParam]);
  } catch (err) {
    console.log(err);
    throw 'SQL Exception';
  } finally {
    con.end();
  }
}

async function updateSetup(guildId, role, channel, message, autoParam) {
  let con = null;
  try {
    con = await Database.getConnection();
    await con.execute('UPDATE str_config SET channel_id = ?, role_id = ?, message = ?, auto = ? WHERE guild_id = ?', [channel, role, message, autoParam, guildId]);
  } catch (err) {
    console.log(err);
    throw 'SQL Exception';
  } finally {
    con.end();
  }
}

module.exports = { getSetup, getStreamingChannelAndMessage, getStreamingRoleId, toogleAutoAnnouncement, isStreamActive, createSetup, updateSetup };