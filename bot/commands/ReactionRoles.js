const { MessageCollector } = require("discord.js");

class ReactionRoles {

    static rrMenuIdList = new Map();
    static reactionsMap = new Map();

    static rrMenu(message) {
        const args = message.content.split(' ');

        switch(args[1]) {
            case 'create':
                this.createMenu(message);
                break;
            case 'next':
            case 'end' :
                break;
        }
    }

    static async createMenu(message) {

        await message.channel.send('Création du menu d\'attribution des rôles...');
        await message.channel.send('Tapez "!rr end" quand votre menu est terminé et pour le mettre en service.');
        await message.channel.send('D\'abord la description :\r- en 1 ou plusieurs messages\r- tapez "!rr next" quand vous avez fini la description.');

        const reactionRoles = new Map();
        this.reactionsMap.set(message.guild.id, reactionRoles);
        
        let menuMessage = '';

        const msgCollector = new MessageCollector(message.channel, m => m.author == message.author);

        msgCollector.on('collect', msg => {
            if(msg.content == '!rr next' || msg.content == '!rr end') {
                msgCollector.stop();
                return;
            }
            menuMessage += msg.content + '\n';
        });

        msgCollector.on('end', collected => {
            if(collected.last() == '!rr end') {
                message.channel.send('Arrêt de la création de menu. Aucun rôle configuré.');
                return;
            }

            message.channel.send('Ok, j\'ai la description du menu. Passons aux rôles. Voici quelques règles :\r- 1 message par rôle\r- Pensez à mentionner le rôle dans le message et indiquer l\'émoticône à utiliser pour s\'attribuer ce rôle.\r- **Réagissez au message** avec l\'émoticône à utiliser\r- Tapez "!rr end" quand vous avez fini.')
                           .then(message.channel.send('Par exemple :\rVous voulez devenir un @bot ? Réagissez avec 🤖')
                                                .then(value => value.react('🤖')));

            const roleCollector = new MessageCollector(message.channel, m => m.author == message.author);

            roleCollector.on('collect', msg => {
                if(msg.content == '!rr end') {
                    roleCollector.stop();
                    return;
                }

                menuMessage += msg.content + '\n';

                const filter            = (reaction, user) => user.id == msg.author.id;
                const reactionCollector = msg.createReactionCollector(filter, { max: 1 });

                reactionCollector.on('collect', r => {
                    if(msg.mentions.roles) {
                        reactionRoles.set(r.emoji.name, msg.mentions.roles.first().id);
                    }
                });
            });

            roleCollector.on('end', () => {
                message.channel.send(menuMessage).then(msg => {
                    for(let e of reactionRoles.keys()) {
                        msg.react(e);
                    }
                    this.rrMenuIdList.set(message.guild.id, msg.id);
                });
            });
        });
    }

    static addRole(reaction, user) {
        const member = reaction.message.guild.members.cache.find(member => member.id == user.id);
        const map    = this.reactionsMap.get(reaction.message.guild.id);

        if(map.has(reaction.emoji.name)) {
            member.roles.add(map.get(reaction.emoji.name));
        }
    }

    static removeRole(reaction, user) {
        const member = reaction.message.guild.members.cache.find(member => member.id == user.id);
        const map    = this.reactionsMap.get(reaction.message.guild.id);
        
        if(map.has(reaction.emoji.name)) {
            member.roles.remove(map.get(reaction.emoji.name));
        }
    }




}

module.exports = ReactionRoles;