const { getArgs }  = require('../Tools.js');
const { ReactionRoles } = require('../languages/fr.json');
const Database     = require('../Database.js');

function rrMenu(message) {
    const [command] = getArgs(message);

    switch(command) {
        case 'create':
            createMenu(message);
            break;
        case 'next':
        case 'val':
        case 'end' :
            break;
        case 'help':
        default:
            help(message);
            break;
    }
}

//TODO
// If already existing menu : delete id
// Modify menu
// Delete menu
async function createMenu(message) {

    try {
        const guild = message.guild;
        let menu    = '';

        await message.channel.send(ReactionRoles.CreationStep1);

        const filter = msg => msg.author.id === message.author.id;
        const msgCollector = message.channel.createMessageCollector(filter);

        msgCollector.on('collect', msg => {
            if(msg.content === '!rr next' || msg.content === '!rr end') {
                msgCollector.stop();
                return;
            }
            menu += msg.content + '\n';
        });

        msgCollector.on('end', async collected => {
            if(collected.last().content === '!rr end') {
                message.channel.send(ReactionRoles.CancelMenu);
                return;
            }

            const reactionRoles = new Map();

            message.channel.send(ReactionRoles.CreationStep2);
            const example = await message.channel.send(ReactionRoles.MessageExample);
            example.react(ReactionRoles.MessageExampleReaction);

            const roleCollector = message.channel.createMessageCollector(filter);

            roleCollector.on('collect', async msg => {
                if(msg.content === '!rr end') {
                    roleCollector.stop();
                    return;
                }

                menu += msg.content + '\n';

                const reactionFilter = (reaction, user) => user.id == msg.author.id;
                const reactionCollector = await msg.awaitReactions(reactionFilter, {max: 1});

                if(msg.mentions.roles) {
                    reactionRoles.set(msg.mentions.roles.first().id, reactionCollector.first().emoji.identifier);
                }

            });

            roleCollector.on('end', async () => {
                message.channel.send(ReactionRoles.MenuPreview);
                const menuMessage = await message.channel.send(menu);
                for(let reaction of reactionRoles.values()) {
                    menuMessage.react(reaction);
                }

                const filterValidation = msg => msg.content === '!rr val';
                const validate = await message.channel.awaitMessages(filterValidation, {max: 1, time: 60000});

                if(!validate.first()) {
                    return;
                }

                message.channel.send(ReactionRoles.AskChannelForMenu);
                const filterChannel = msg => Number.isInteger(parseInt(msg.content));
                const channelIdMsg = await message.channel.awaitMessages(filterChannel, {max: 1});
                const channelId = channelIdMsg.first().content;
                const channel = guild.channels.resolve(channelId);

                if(channel) {
                    message.channel.send(ReactionRoles.ChannelFound);

                    const guildMenuMessage = await channel.send(menu);
                    const guildMenuMessageId = guildMenuMessage.id;
                    for(let reaction of reactionRoles.values()) {
                        guildMenuMessage.react(reaction);
                    }

                    for(let [key, value] of reactionRoles) {
                        await Database.setRRMenu(guild.id, channelId, guildMenuMessageId, key, value);
                    }
                }

            });
            
        });

    } catch (err) {
        console.log(err);
    } 
}

async function isReactionMenu(reaction) {
    try {
        const rrMenu = await Database.getRRMenu(reaction.message.id);
        if(rrMenu.length) {
            return rrMenu;
        } else {
            return false;
        }
    } catch (err) {
        console.log(err);
    }
}

async function addReactionRole(menu, reaction, user) {
    try {
        const member = reaction.message.guild.members.resolve(user);
        const rrMenu = menu;
        const reactionRole = rrMenu.find(el => el.emoteID == reaction.emoji.identifier);
        if(reactionRole) {
            member.roles.add(reactionRole.roleID);
        }
    } catch (err) {
        console.log(err);
    }
}

async function removeReactionRole(menu, reaction, user) {
    try {
        const member = reaction.message.guild.members.resolve(user);
        const rrMenu = menu;
        const reactionRole = rrMenu.find(el => el.emoteID == reaction.emoji.identifier);
        if(reactionRole) {
            member.roles.remove(reactionRole.roleID);
        }
    } catch (err) {
        console.log(err);
    }
}

function help(message) {
    message.channel.send(ReactionRoles.Help);
}

module.exports = { rrMenu, isReactionMenu, addReactionRole, removeReactionRole };