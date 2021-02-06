const { prefix }   = require('../config.json');
const { ErrorTxt } = require('./languages/fr.json');

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

module.exports = { getReply, getArgs, sendError };