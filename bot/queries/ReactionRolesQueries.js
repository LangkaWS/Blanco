const Database = require('./GlobalQueries.js');

async function setRRMenu(guildId, channelId, menuMessageId, roleId, emoteId) {
    const con = await Database.getConnection();
    await con.execute('INSERT INTO RR_MENU SET guildID = ?, channelID = ?, menuID = ?, roleID = ?, emoteID = ?', [guildId, channelId, menuMessageId, roleId, emoteId]);
}

async function getRRMenu(menuMessageId) {
    const con = await Database.getConnection();
    const [rows] = await con.execute('SELECT * FROM RR_MENU WHERE menuID = ?', [menuMessageId]);
    return rows;
}

async function deleteRRMenu(menuMessageId) {
    const con = await Database.getConnection();
    await con.execute('DELETE FROM RR_MENU WHERE menuID = ?', [menuMessageId]);
}

async function deleteRole(menuMessageId, roleId) {
    const con = await Database.getConnection();
    await con.execute('DELETE FROM RR_MENU WHERE menuID = ? AND roleID = ?', [menuMessageId, roleId]);
}

module.exports = { getRRMenu, setRRMenu, deleteRRMenu, deleteRole };