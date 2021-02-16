const Database = require('./GlobalQueries.js');

async function setRRMenu(guildId, channelId, menuMessageId, roleId, emoteId) {
    let con = null;
    try {
        con = await Database.getConnection();
        await con.execute('INSERT INTO rr_menu SET guild_id = ?, channel_id = ?, menu_id = ?, role_id = ?, emote_id = ?', [guildId, channelId, menuMessageId, roleId, emoteId]);
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

async function getRRMenu(menuMessageId) {
    let con = null;
    try {
        con = await Database.getConnection();
        const [rows] = await con.execute('SELECT * FROM rr_menu WHERE menu_id = ?', [menuMessageId]);
        return rows;
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

async function deleteRRMenu(menuMessageId) {
    let con = null;
    try {
        con = await Database.getConnection();
        await con.execute('DELETE FROM rr_menu WHERE menu_id = ?', [menuMessageId]);
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

async function deleteRole(menuMessageId, roleId) {
    let con = null;
    try {
        con = await Database.getConnection();
        await con.execute('DELETE FROM rr_menu WHERE menu_id = ? AND role_id = ?', [menuMessageId, roleId]);
    } catch (err) {
        console.log(err);
        throw 'SQL Exception';
    } finally {
        con.end();
    }
}

module.exports = { getRRMenu, setRRMenu, deleteRRMenu, deleteRole };