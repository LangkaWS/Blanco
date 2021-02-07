const Database = require('./GlobalQueries.js');

async function setRRMenu(guildId, channelId, menuMessageId, roleId, emoteId) {
    const con = await Database.getConnection();
    await con.execute('INSERT INTO rr_menu SET guild_id = ?, channel_id = ?, menu_id = ?, role_id = ?, emote_id = ?', [guildId, channelId, menuMessageId, roleId, emoteId]);
}

async function getRRMenu(menuMessageId) {
    const con = await Database.getConnection();
    const [rows] = await con.execute('SELECT * FROM rr_menu WHERE menu_id = ?', [menuMessageId]);
    return rows;
}

async function deleteRRMenu(menuMessageId) {
    const con = await Database.getConnection();
    await con.execute('DELETE FROM rr_menu WHERE menu_id = ?', [menuMessageId]);
}

async function deleteRole(menuMessageId, roleId) {
    const con = await Database.getConnection();
    await con.execute('DELETE FROM rr_menu WHERE menu_id = ? AND role_id = ?', [menuMessageId, roleId]);
}

module.exports = { getRRMenu, setRRMenu, deleteRRMenu, deleteRole };