const Database = require('./GlobalQueries.js');

async function addAdminRole(guildId, roleId) {
  let con = null;
  try {
    con      = await Database.getConnection();
    const [rows] = await con.execute('INSERT INTO admin_roles SET guild_id = ?, role_id = ?', [guildId, roleId]);
    return rows;
  } catch (err) {
    console.log(err);
    throw 'SQL Exception';
  } finally {
    con.end();
  }
}

async function removeAdminRole(guildId, roleId) {
  let con = null;
  try {
    con = await Database.getConnection();
    await con.execute('DELETE FROM admin_roles WHERE guild_id = ? AND role_id = ?', [guildId, roleId]);
  } catch (err) {
    console.log(err);
    throw 'SQL Exception';
  } finally {
    con.end();
  }
}

module.exports = { addAdminRole, removeAdminRole };