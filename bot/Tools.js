class Tools {

    static config = require('../config.json');
    static prefix = this.config.prefix;

    static getArgs(message) {
        return message.content.slice(this.prefix.length).split(' ').slice(1);
    }
}

module.exports = Tools;