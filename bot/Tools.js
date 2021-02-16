const { prefix }   = require('../config.json');
const { ErrorTxt } = require('./languages/fr.json');
const Database = require('./queries/GlobalQueries.js');

/**
 * Check if the member has an admin role or not.
 * @param {GuildMember} member the member to check
 * @param {[string]} roles the list of admin roles
 */
async function checkAdmin(member) {
    const adminRolesConfig = await Database.getAdminRoles(member.guild.id);
    return member.roles.cache.some(role => {
        for (let row of adminRolesConfig) {
            if (row.role_id === role.id) {
                return true;
            }
        }
    });
}

/**
 * Check if the server has this role or not.
 * @param {Guild} guild 
 * @param {string} roleId 
 */
function checkRole(guild, roleId) {
    return guild.roles.cache.some(r => r.id === roleId);
}

/**
 * Check if the server has this channel or not.
 * @param {Guild} guild 
 * @param {string} channelId 
 */
function checkChannel(guild, channelId) {
    return guild.channels.cache.some(c => c.id === channelId);
}

/**
 * Send a question in a channel and wait for the answer from initial message author.
 * @param {Message} initMessage the original command
 * @param {string} question the question to answer to
 * @returns {Promise<string>} the content of the answer
 */
async function getReply(initMessage, question) {
    initMessage.channel.send(question);
    const collected = await initMessage.channel.awaitMessages(msg => msg.author.id === initMessage.author.id, {max: 1});
    return collected.first().content;
}

/**
 * Get the arguments of a command and return an array of arguments.
 * @param {Message} message the command message
 * @returns {[string]} the arguments of the command
 */
function getArgs(message) {
    return message.content.slice(prefix.length).split(' ').slice(1);
}

/**
 * Write in the console the error and the date when it happened and send an error message to a channel.
 * @param {Exception} error 
 * @param {TextChannel} channel 
 */
function sendError(error, channel) {
    console.log(new Date());
    console.log(error);
    channel.send(ErrorTxt);
}

module.exports = { isAdmin, isRole, isChannel, getReply, getArgs, sendError };