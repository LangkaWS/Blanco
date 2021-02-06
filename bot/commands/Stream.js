const StreamingQueries = require('../queries/StreamingQueries.js');
const Database = require('../queries/GlobalQueries.js');
const Tools = require('../Tools.js');

const { StreamTxt, NotUnderstoodTxt, AccessDenied } = require('../languages/fr.json');

/**
 * Call the appropriate function according to arguments of the command.
 * @param {Message} message 
 */
function menu(message) {
    const [command] = Tools.getArgs(message);

    switch (command) {
    case 'setup':
        setupStream(message);
        break;

    case 'next':
        break;
    
    case 'help':
    default:
        help(message);
    }
}

async function setupStream(message) {
    try {
        const isAdmin = await Tools.isAdmin(message.member);
        if (!isAdmin) {
            message.channel.send(AccessDenied);
            return;
        }

        const guildId = message.guild.id;
        const [strSetup] = await StreamingQueries.getStreaming(guildId);

        const isNewSetup = !strSetup || (!strSetup.str_channel_id && !strSetup.str_role_id && !strSetup.str_message);
        createSetupInDB(message, isNewSetup, strSetup);

    } catch (err) {
        Tools.sendError(err, message.channel);
    }

}

async function createSetupInDB (message, newSetup, strSetup) {
    try {
        let strRoleId, strChannelId;

        if (!newSetup) {
            strRoleId = strSetup.str_role_id;
            strChannelId = strSetup.str_channel_id;
    
            const currentRole = message.guild.roles.resolve(strRoleId);
            const currentChannel = message.guild.channels.resolve(strChannelId);
        
            const currentSetupMsg = StreamTxt.AlreadySetup + StreamTxt.StreamerRole + (currentRole ? currentRole.name : '') + '\r' + StreamTxt.StreamChannel + (currentChannel ? currentChannel : '') + '\r' + StreamTxt.StreamMessage + strSetup.str_message;
            message.channel.send(currentSetupMsg);
        }
    
        const wantSetupStream =  await Tools.getReply(message, newSetup ? StreamTxt.NoSetup : StreamTxt.AskModifyCurrentSetup);
        
        if (wantSetupStream === 'yes') {
            let streamRole = await Tools.getReply(message, (!newSetup && strSetup.str_role_id) ? StreamTxt.AskModifyRole : StreamTxt.AskRole);
    
            if (streamRole !== '!str next') {
                strRoleId = streamRole.replace('<@&', '').replace('>', '');
                let isRole = Tools.isRole(message.guild, strRoleId);
                while (!isRole) {
                    streamRole = await Tools.getReply(message, StreamTxt.RoleNotFound);
                    strRoleId = streamRole.replace('<@&', '').replace('>', '');
                    isRole = Tools.isRole(message.guild, strRoleId);
                }
            }
    
            let streamChannel = await Tools.getReply(message, (!newSetup && strSetup.str_channel_id) ? StreamTxt.AskModifyChannel : StreamTxt.AskChannel);
            if (streamChannel !== '!str next') {
                strChannelId = streamChannel.replace('<#', '').replace('>', '');
                let isChannel = Tools.isChannel(message.guild, strChannelId);
                while (!isChannel) {
                    streamRole = await Tools.getReply(message, StreamTxt.ChannelNotFound);
                    strChannelId = streamChannel.replace('<#', '').replace('>', '');
                    isChannel = Tools.isChannel(message.guild, strRoleId);
                }
            }
            
            const streamMessage = await Tools.getReply(message, (!newSetup && strSetup.str_message) ? StreamTxt.AskModifyMessage : StreamTxt.AskMessage);
        
            if (newSetup && !strSetup) {
                await StreamingQueries.setStreaming(message.guild.id, strRoleId, strChannelId, streamMessage);
            } else {
                await StreamingQueries.updateStreaming(message.guild.id, strRoleId, strChannelId, streamMessage);
            }
        
            message.channel.send(StreamTxt.SuccessConfig);
        }
    } catch (err) {
        Tools.sendError(err, message.channel);
    }
}

async function getStreamingRoleName(guildId) {
    try {
        const [result]  = await StreamingQueries.getStreaming(guildId);
        if (result) {
            return result.streamingRole;
        } else {
            return null;
        }
    } catch (err) {
        console.log(err);
    }
}

async function announceStream(member) {
    try {
        const guild = member.guild;
        const [result]  = await StreamingQueries.getStreaming(guild.id);
        let message = result.streamingMessage;

        if (message.match(/{name}/)) {
            message = message.replace(/{name}/, '**' + (member.nickname ? member.nickname : member.user.username) + '**');
        }

        if (message.match(/{url}/)) {
            const url = member.presence.activities.find(act => act.type === 'STREAMING').url;
            message = message.replace(/{url}/, url);
        }

        const announcementChannel = guild.channels.resolve(result.streamingChannelId);
        announcementChannel.send(message);
    } catch (err) {
        console.log(err);
    }
}

module.exports = { menu, getStreamingRoleName, announceStream }