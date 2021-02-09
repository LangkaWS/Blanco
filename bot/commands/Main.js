const { Help } = require('../languages/fr.json');

function help(message) {
    message.channel.send(Help);
}

module.exports = { help };