const Database = require('./GlobalQueries.js');

async function addAdminRole(guildId, roleId) {
    const con    = await Database.getConnection();
    const [rows] = await con.execute('INSERT INTO admin_roles SET guild_id = ?, role_id = ?', [guildId, roleId]);
    return rows;
}

async function removeAdminRole(guildId, roleId) {
    const con = await Database.getConnection();
    await con.execute('DELETE FROM admin_roles WHERE guild_id = ? AND role_id = ?', [guildId, roleId]);
}

module.exports = { addAdminRole, removeAdminRole };