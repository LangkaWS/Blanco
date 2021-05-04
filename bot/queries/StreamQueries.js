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

async function getStreamerRoleId(guildId) {
  let con = null;
  try {
    con  = await Database.getConnection();
    const [rows] = await con.execute('SELECT streamer_role_id FROM str_config WHERE guild_id = ?', [guildId]);
    return rows;
  } catch (err) {
    console.log(err);
    throw 'SQL Exception';
  } finally {
    con.end();
  }
}

async function getLiveRoleId(guildId) {
  let con = null;
  try {
    con  = await Database.getConnection();
    const [rows] = await con.execute('SELECT live_role_id FROM str_config WHERE guild_id = ?', [guildId]);
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

async function createSetup(guildId, streamerRole, liveRole, channel, message, autoParam) {
  let con = null;
  try {
    con = await Database.getConnection();
    await con.execute('INSERT INTO str_config SET guild_id = ?, channel_id = ?, streamer_role_id = ?, live_role_id = ?, message = ?, auto = ?', [guildId, channel, streamerRole, liveRole, message, autoParam]);
  } catch (err) {
    console.log(err);
    throw 'SQL Exception';
  } finally {
    con.end();
  }
}

async function updateSetup(guildId, streamerRole, liveRole, channel, message, autoParam) {
  let con = null;
  try {
    con = await Database.getConnection();
    await con.execute('UPDATE str_config SET channel_id = ?, streamer_role_id = ?, live_role_id = ?, message = ?, auto = ? WHERE guild_id = ?', [channel, streamerRole, liveRole, message, autoParam, guildId]);
  } catch (err) {
    console.log(err);
    throw 'SQL Exception';
  } finally {
    con.end();
  }
}

module.exports = { getSetup, getStreamingChannelAndMessage, getStreamerRoleId, getLiveRoleId, toogleAutoAnnouncement, isStreamActive, createSetup, updateSetup };