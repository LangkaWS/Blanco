const { prefix } = require('../config.json');
const { ErrorTxt } = require('./languages/fr.json');

async function getReply(initMessage, question) {
    initMessage.channel.send(question);
    const collected = await initMessage.channel.awaitMessages(msg => msg.author.id === initMessage.author.id, {max: 1});
    return collected.first().content;
}

function getArgs(message) {
    return message.content.slice(prefix.length).split(' ').slice(1);
}

function sendError(error, channel) {
    console.log(new Date());
    console.log(error);
    channel.send(ErrorTxt);
}

module.exports = { getReply, getArgs, sendError };