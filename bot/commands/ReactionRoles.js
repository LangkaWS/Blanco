const { getArgs }  = require('../Tools.js');
const { ReactionRoles, AccessDenied } = require('../languages/fr.json');
const Database     = require('../Database.js');

function rrMenu(message) {
    const [command] = getArgs(message);

    const isAdmin = message.member.roles.cache.get('492407354537541635');
        
    switch(command) {
        case 'create':
            if(!isAdmin) {
                message.channel.send(AccessDenied);
                return;
            }
            createMenu(message);
            break;
        case 'modify':
            if(!isAdmin) {
                message.channel.send(AccessDenied);
                return;
            }
            modifyMenu(message);
            break;
        case 'delete':
            if(!isAdmin) {
                message.channel.send(AccessDenied);
                return;
            }
            deleteMenu(message);
            break;
        case 'add':
            if(!isAdmin) {
                message.channel.send(AccessDenied);
                return;
            }
            addRoleToMenu(message);
            break;
        case 'remove':
            if(!isAdmin) {
                message.channel.send(AccessDenied);
                return;
            }
            removeRoleFromMenu(message);
            break;
        case 'next':
        case 'val':
        case 'end' :
            if(!isAdmin) {
                message.channel.send(AccessDenied);
                return;
            }
            break;
        case 'help':
        default:
            help(message);
            break;
    }
}

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

            message.channel.send(ReactionRoles.CreationStep2 + ' ' + ReactionRoles.RoleRules);
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

async function modifyMenu(message) {
    try {
        const [, menuId] = getArgs(message);
        const rrMenu = await Database.getRRMenu(menuId);

        const channel = message.guild.channels.resolve(rrMenu[0].channelID);
        const menuMsg = await channel.messages.fetch(menuId);

        message.channel.send(ReactionRoles.CurrentMenu);
        const sanitizedMenuMsg = menuMsg.content
            .replace(/\*/g, '\\*')
            .replace(/_/g, '\\_')
            .replace(/~/g, '\\~')
            .replace(/`/g, '\\`')
            .replace(/\\/g, '\\\\');
        message.channel.send(sanitizedMenuMsg);
        message.channel.send(ReactionRoles.SanitizedMenu);
        const filter = msg => msg.author.id === message.author.id;
        const reply = await message.channel.awaitMessages(filter, {max: 1});

        menuMsg.edit(reply.first().content);

    } catch (err) {
        console.log(err);
    }
}

async function deleteMenu(message) {
    try {
        const [, menuId] = getArgs(message);
        const rrMenu = await Database.getRRMenu(menuId);

        message.channel.send(ReactionRoles.DeleteConfirm);
        const filter = msg => msg.author.id === message.author.id;
        const reply = await message.channel.awaitMessages(filter, {max: 1});

        if(reply.first().content === "yes") {

            await Database.deleteRRMenu(menuId);

            const channel = message.guild.channels.resolve(rrMenu[0].channelID);
            const menuMsg = await channel.messages.fetch(menuId);
            menuMsg.delete();

            message.channel.send(ReactionRoles.DeleteDone);
        }
    } catch (err) {
        console.log(err);
    }
}

async function addRoleToMenu(message) {
    try {
        const [, menuId] = getArgs(message);
        const rrMenu = await Database.getRRMenu(menuId);

        const channel = message.guild.channels.resolve(rrMenu[0].channelID);
        const menuMsg = await channel.messages.fetch(menuId);
        let newMenuContent = menuMsg.content;

        message.channel.send(ReactionRoles.AskRolesToAdd + '\r' + ReactionRoles.RoleRules);

        const reactionRoles = new Map();

        const filter = msg => msg.author.id === message.author.id;
        const roleCollector = message.channel.createMessageCollector(filter);

        roleCollector.on('collect', async msg => {
            if(msg.content === '!rr end') {
                roleCollector.stop();
                return;
            }

            newMenuContent += '\n' + msg.content;

            const reactionFilter = (reaction, user) => user.id == msg.author.id;
            const reactionCollector = await msg.awaitReactions(reactionFilter, {max: 1});

            const roleMentioned = msg.mentions.roles.first();
            const isInMenu = rrMenu.find(el => el.roleId === roleMentioned.id);

            if(roleMentioned && !isInMenu) {
                reactionRoles.set(roleMentioned.id, reactionCollector.first().emoji.identifier);
            }

        });
        
        roleCollector.on('end', async () => {
            await menuMsg.edit(newMenuContent);
            
            for(let reaction of reactionRoles.values()) {
                menuMsg.react(reaction);
            }

            for(let [key, value] of reactionRoles) {
                await Database.setRRMenu(menuMsg.guild.id, channel.id, menuMsg.id, key, value);
            }
        });

        message.channel.send(ReactionRoles.AddRoleDone);

    } catch (err) {
        console.log(err);
    }
}

async function removeRoleFromMenu(message) {
    try {
        const [, menuId, roleId] = getArgs(message);
        const rrMenu = await Database.getRRMenu(menuId);

        message.channel.send(ReactionRoles.DeleteRoleConfirm);
        const filter = msg => msg.author.id === message.author.id;
        const reply = await message.channel.awaitMessages(filter, {max: 1});
        
        if(reply.first().content === "yes") {
            const channel = message.guild.channels.resolve(rrMenu[0].channelID);
            const menuMsg = await channel.messages.fetch(menuId);
            const reaction = rrMenu.find(el => el.roleID === roleId).emoteID;
            
            let newMenuContent = menuMsg.content;
            
            const roleStr = '<@&' + roleId + '>';
            const roleIndex = newMenuContent.search(roleStr);
            let contentToRemove;
            
            if(newMenuContent.indexOf('\n', roleIndex) !== -1) {
                contentToRemove = newMenuContent.slice(roleIndex, newMenuContent.indexOf('\n', roleIndex));
            } else {
                contentToRemove = newMenuContent.slice(roleIndex);
            }
            
            newMenuContent = newMenuContent.replace(contentToRemove, '');
            
            await Database.deleteRole(menuId, roleId);
            const emoji = menuMsg.reactions.cache.find(el => el.emoji.identifier === reaction);
            menuMsg.reactions.resolve(emoji).remove();
            menuMsg.edit(newMenuContent);

            message.channel.send(ReactionRoles.DeleteRoleDone);
        }
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