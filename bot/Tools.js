const { prefix } = require('../config.json');

async function getReply(initMessage, question) {
    initMessage.channel.send(question);
    const collected = await initMessage.channel.awaitMessages(msg => msg.author.id === initMessage.author.id, {max: 1});
    return collected.first().content;
}

function getArgs(message) {
    return message.content.slice(prefix.length).split(' ').slice(1);
}

module.exports = { getReply, getArgs };