const Database = require('./GlobalQueries.js');

async function addAdminRole(guildId, roleId) {
    const con    = await Database.getConnection();
    const [rows] = await con.execute('INSERT INTO admin_roles SET guild_id = ?, role_id = ?', [guildId, roleId]);
    return rows;
}

module.exports = { addAdminRole };