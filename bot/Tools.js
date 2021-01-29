const { prefix } = require('../config.json');

exports.getReply = async (initMessage, question) => {
    initMessage.channel.send(question);
    const collected = await initMessage.channel.awaitMessages(msg => msg.author.id === initMessage.author.id, {max: 1});
    return collected.first().content;
}

exports.getArgs = (message) => {
    return message.content.slice(prefix.length).split(' ').slice(1);
}