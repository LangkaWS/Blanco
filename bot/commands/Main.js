const { MessageEmbed } = require('discord.js');
const { Help } = require('../languages/fr.json');

function help(message) {
    const helpMsg = new MessageEmbed({
        title: Help.MsgTitle,
        description: Help.MsgDescription,
        fields: [
            {
                name: Help.AdminTitle,
                value: Help.AdminHelp
            },
            {
                name: Help.BirthdaysTitle,
                value: Help.BirthdaysHelp
            },
            {
                name: Help.MusicTitle,
                value: Help.MusicHelp
            },
            {
                name: Help.ReactionRolesTitle,
                value: Help.ReactionRolesHelp
            },
            {
                name: Help.StreamTitle,
                value: Help.StreamHelp
            }
        ]
    });
    message.channel.send(helpMsg);
}

module.exports = { help };