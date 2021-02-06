const ReactionRolesQueries = require('../queries/ReactionRolesQueries.js');
const Tools                = require('../Tools.js');

const { ReactionRolesTxt, AccessDenied, NotUnderstoodTxt, RoleNotFound } = require('../languages/fr.json');

/**
 * Call the appropriate function according to arguments of the command.
 * @param {Message} message 
 */
function menu(message) {
    const [command] = Tools.getArgs(message);

    switch(command) {
        case 'create':
            createMenu(message);
            break;

        case 'modify':
            modifyMenu(message);
            break;

        case 'delete':
            deleteMenu(message);
            break;

        case 'add':
            addRoleToMenu(message);
            break;

        case 'remove':
            removeRoleFromMenu(message);
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

/**
 * Create a reaction roles menu.
 * @param {Message} message 
 */
async function createMenu(message) {

    try {

        const isAdmin = await Tools.isAdmin(message.member);
        if (!isAdmin) {
            message.channel.send(AccessDenied);
            return;
        }

        const guild = message.guild;
        let menu    = '';

        await message.channel.send(ReactionRolesTxt.CreationStep1);

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
                message.channel.send(ReactionRolesTxt.CancelMenu);
                return;
            }

            const reactionRoles = new Map();

            message.channel.send(ReactionRolesTxt.CreationStep2 + ' ' + ReactionRolesTxt.RoleRules);
            const example = await message.channel.send(ReactionRolesTxt.MessageExample);
            example.react(ReactionRolesTxt.MessageExampleReaction);

            const roleCollector = message.channel.createMessageCollector(filter);

            roleCollector.on('collect', async msg => {
                if(msg.content === '!rr next' || msg.content === '!rr end') {
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

            roleCollector.on('end', async (collected) => {

                if(collected.last().content === '!rr end') {
                    message.channel.send(ReactionRolesTxt.CancelMenu);
                    return;
                }

                message.channel.send(ReactionRolesTxt.MenuPreview);
                const menuMessage = await message.channel.send(menu);
                for(let reaction of reactionRoles.values()) {
                    menuMessage.react(reaction);
                }

                let validate = await Tools.getReply(message, ReactionRolesTxt.AskValidation);

                while (validate !== '!rr val' && validate !== '!rr end') {
                    validate = await Tools.getReply(message, NotUnderstoodTxt);
                }

                if(validate === '!rr end') {
                    return;
                }

                let menuChannelStr = await Tools.getReply(message, ReactionRolesTxt.AskChannelForMenu);

                let menuChannelId  = menuChannelStr.replace('<#', '').replace('>', '');
                let isChannel      = Tools.isChannel(message.guild, menuChannelId);

                while (!isChannel) {
                    menuChannelStr   = await Tools.getReply(message, ReactionRolesTxt.ChannelNotFound);
                    menuChannelId = menuChannelStr.replace('<#', '').replace('>', '');
                    isChannel     = Tools.isChannel(message.guild, menuChannelId);
                }
                
                if(menuChannelStr) {
                    const menuChannel = guild.channels.resolve(menuChannelId);

                    message.channel.send(ReactionRolesTxt.ChannelFound);

                    const guildMenuMessage = await menuChannel.send(menu);
                    const guildMenuMessageId = guildMenuMessage.id;
                    for(let reaction of reactionRoles.values()) {
                        guildMenuMessage.react(reaction);
                    }

                    for(let [key, value] of reactionRoles) {
                        await ReactionRolesQueries.setRRMenu(guild.id, menuChannelId, guildMenuMessageId, key, value);
                    }
                }

            });
            
        });

    } catch (err) {
        Tools.sendError(err, message.channel);
    } 
}

/**
 * Modify a reaction roles menu. The command need to be a reply to the menu.
 * @param {Message} message 
 */
async function modifyMenu(message) {
    try {

        const isAdmin = await Tools.isAdmin(message.member);
        if (!isAdmin) {
            message.channel.send(AccessDenied);
            return;
        }

        const menuId = message.reference.messageID;
        const channelId = message.reference.channelID;
        const channel = message.guild.channels.resolve(channelId);

        const menuMsg = await channel.messages.fetch(menuId);

        message.channel.send(ReactionRolesTxt.CurrentMenu);
        const sanitizedMenuMsg = menuMsg.content
            .replace(/\*/g, '\\*')
            .replace(/_/g, '\\_')
            .replace(/~/g, '\\~')
            .replace(/`/g, '\\`')
            .replace(/\\/g, '\\\\');
        message.channel.send(sanitizedMenuMsg);
        const reply = await Tools.getReply(message, ReactionRolesTxt.SanitizedMenu);

        menuMsg.edit(reply);

    } catch (err) {
        Tools.sendError(err, message.channel);
    }
}

/**
 * Delete a reaction roles menu. The command need to be a reply to the menu.
 * @param {Message} message 
 */
async function deleteMenu(message) {
    try {

        const isAdmin = await Tools.isAdmin(message.member);
        if (!isAdmin) {
            message.channel.send(AccessDenied);
            return;
        }

        const menuId = message.reference.messageID;
        const channelId = message.reference.channelID;
        const channel = message.guild.channels.resolve(channelId);

        const menuMsg = await channel.messages.fetch(menuId);

        let confirmDelete =  await Tools.getReply(message, ReactionRolesTxt.DeleteConfirm);
        while (confirmDelete !== 'yes' && confirmDelete !== 'no') {
            confirmDelete = await Tools.getReply(message, NotUnderstoodTxt);
        }

        if(confirmDelete === 'yes') {
            await ReactionRolesQueries.deleteRRMenu(menuId);

            menuMsg.delete();
    
            message.channel.send(ReactionRolesTxt.DeleteDone);
        }

    } catch (err) {
        console.log(err);
    }
}

/**
 * Add a role to the reaction roles menu. The command need to be a reply to the menu.
 * @param {Message} message 
 */
async function addRoleToMenu(message) {
    try {

        const isAdmin = await Tools.isAdmin(message.member);
        if (!isAdmin) {
            message.channel.send(AccessDenied);
            return;
        }

        const menuId = message.reference.messageID;
        const channelId = message.reference.channelID;
        const channel = message.guild.channels.resolve(channelId);

        const menuMsg = await channel.messages.fetch(menuId);

        const rrMenu = await ReactionRolesQueries.getRRMenu(menuId);

        let newMenuContent = menuMsg.content;

        message.channel.send(ReactionRolesTxt.AskRolesToAdd + '\r' + ReactionRolesTxt.RoleRules);

        const reactionRoles = new Map();

        const filter = msg => msg.author.id === message.author.id;
        const roleCollector = message.channel.createMessageCollector(filter);

        roleCollector.on('collect', async msg => {
            if(msg.content === '!rr next' || msg.content === '!rr end') {
                roleCollector.stop();
                return;
            }

            newMenuContent += '\n' + msg.content;

            const reactionFilter = (reaction, user) => user.id == msg.author.id;
            const reactionCollector = await msg.awaitReactions(reactionFilter, {max: 1});

            const roleMentioned = msg.mentions.roles.first();
            const isInMenu = rrMenu.find(el => el.role_id === roleMentioned.id);

            if(roleMentioned && !isInMenu) {
                reactionRoles.set(roleMentioned.id, reactionCollector.first().emoji.identifier);
            }

        });
        
        roleCollector.on('end', async (collected) => {

            if(collected.last().content === '!rr end') {
                message.channel.send(ReactionRolesTxt.CancelMenu);
                return;
            }

            await menuMsg.edit(newMenuContent);
            
            for(let reaction of reactionRoles.values()) {
                menuMsg.react(reaction);
            }

            for(let [key, value] of reactionRoles) {
                await ReactionRolesQueries.setRRMenu(menuMsg.guild.id, channel.id, menuMsg.id, key, value);
            }
            message.channel.send(ReactionRolesTxt.AddRoleDone);
        });


    } catch (err) {
        Tools.sendError(err, message.channel);
    }
}

/**
 * Modify a reaction roles menu. The command needs to be a reply to the menu and mention the role to remove.
 * @param {Message} message 
 */
async function removeRoleFromMenu(message) {
    try {

        const isAdmin = await Tools.isAdmin(message.member);
        if (!isAdmin) {
            message.channel.send(AccessDenied);
            return;
        }

        const menuId = message.reference.messageID;
        const channelId = message.reference.channelID;
        const channel = message.guild.channels.resolve(channelId);

        const menuMsg = await channel.messages.fetch(menuId);

        const [, roleMention] = Tools.getArgs(message);
        const roleId = roleMention.replace('<@&', '').replace('>', '');

        if (Tools.isRole(message.guild, roleId)) {

            let confirmDelete =  await Tools.getReply(message, ReactionRolesTxt.DeleteRoleConfirm);
            while (confirmDelete !== 'yes' && confirmDelete !== 'no') {
                confirmDelete = await Tools.getReply(message, NotUnderstoodTxt);
            }
            
            if(confirmDelete === 'yes') {

                const rrMenu = await ReactionRolesQueries.getRRMenu(menuId);

                rrMenu.forEach(el => console.log(el.role_id));
                const reaction = rrMenu.find(el => el.role_id === roleId).emote_id;
                
                let newMenuContent = menuMsg.content;
                
                const roleIndex = newMenuContent.search(roleMention);

                let contentToRemove;
                
                if(newMenuContent.indexOf('\n', roleIndex) !== -1) {
                    contentToRemove = newMenuContent.slice(roleIndex, newMenuContent.indexOf('\n', roleIndex));
                } else {
                    contentToRemove = newMenuContent.slice(roleIndex);
                }
                
                newMenuContent = newMenuContent.replace(contentToRemove, '');
                
                await ReactionRolesQueries.deleteRole(menuId, roleId);
                const emoji = menuMsg.reactions.cache.find(el => el.emoji.identifier === reaction);
                menuMsg.reactions.resolve(emoji).remove();
                menuMsg.edit(newMenuContent);
        
                message.channel.send(ReactionRolesTxt.DeleteRoleDone);
                
            }
        } else {
            message.channel.send(RoleNotFound);
        }


    } catch (err) {
        Tools.sendError(err, message.channel);
    }
}

/**
 * Check if the message is registered in database as a reaction roles menu.
 * @param {MessageReaction} reaction 
 */
async function isReactionMenu(reaction) {
    try {
        const rrMenu = await ReactionRolesQueries.getRRMenu(reaction.message.id);
        if(rrMenu.length) {
            return rrMenu;
        } else {
            return false;
        }
    } catch (err) {
        console.log(err);
    }
}

/**
 * Add a role to the member.
 * @param {[BinaryRow]} menu the menu from database
 * @param {MessageReaction} reaction the reaction that corresponds to a role
 * @param {User} user the member to add the role to 
 */
async function addReactionRole(menu, reaction, user) {
    try {
        const member = reaction.message.guild.members.resolve(user);
        const rrMenu = menu;
        const reactionRole = rrMenu.find(el => el.emote_id == reaction.emoji.identifier);
        if(reactionRole) {
            member.roles.add(reactionRole.role_id);
        }
    } catch (err) {
        console.log(err);
    }
}

/**
 * Remove a role from the member.
 * @param {[BinaryRow]} menu the menu from database
 * @param {MessageReaction} reaction the reaction that corresponds to a role
 * @param {User} user the member to remove the role from 
 */
async function removeReactionRole(menu, reaction, user) {
    try {
        const member = reaction.message.guild.members.resolve(user);
        const rrMenu = menu;
        const reactionRole = rrMenu.find(el => el.emote_id == reaction.emoji.identifier);
        if(reactionRole) {
            member.roles.remove(reactionRole.role_id);
        }
    } catch (err) {
        console.log(err);
    }
}

/**
 * Display help about the reaction roles menu.
 * @param {Message} message 
 */
function help(message) {
    message.channel.send(ReactionRolesTxt.Help);
}

module.exports = { menu, isReactionMenu, addReactionRole, removeReactionRole };