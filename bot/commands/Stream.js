const Database     = require('../Database.js');
const { getReply } = require('../Tools.js');

const { StreamTxt, ErrorTxt, NotUnderstoodTxt } = require('../languages/fr.json');

async function config(message) {
    try {
        const guildId = message.guild.id;
        const [result]  = await Database.getStreaming(guildId);

        if(!result) {
            message.channel.send(StreamTxt.NoConfig);

            const streamRole    = await getReply(message, StreamTxt.AskRole);
            const streamChannel = await getReply(message, StreamTxt.AskChannel);
            const streamMessage = await getReply(message, StreamTxt.AskMessage);

            await Database.setStreaming(guildId, streamRole, streamChannel, streamMessage);

            message.channel.send(StreamTxt.SuccessConfig);

        } else {
            message.channel.send(StreamTxt.AlreadyConfig);

            const currentRole      = result.streamingRole;
            const currentChannelId = result.streamingChannelId;
            const currentMessage   = result.streamingMessage;

            const channel = message.guild.channels.resolve(currentChannelId);

            message.channel.send(StreamTxt.StreamingRole + currentRole + '\r'
                + StreamTxt.StreamingChannel + (channel ? channel.name : StreamTxt.ChannelNotFound) + '\r'
                + StreamTxt.StreamingMessage + currentMessage);

            let isReplyOk = false;
            let endModify = false;

            let newRole    = currentRole;
            let newChannel = currentChannelId;
            let newMessage = currentMessage;

            do {
                const reply = await getReply(message, StreamTxt.AskWhatToModify);
                switch(reply) {
                    case 'role':
                        isReplyOk = true;
                        newRole   = await getReply(message, StreamTxt.AskNewRole);
                        break;

                    case 'channel':
                        isReplyOk  = true;
                        newChannel = await getReply(message, StreamTxt.AskNewChannel);
                        break;

                    case 'message':
                        isReplyOk  = true;
                        newMessage = await getReply(message, StreamTxt.AskNewMessage);
                        break;

                    case 'end':
                        isReplyOk = true;
                        endModify = true;
                        await Database.updateStreaming(guildId, newRole, newChannel, newMessage);
                        message.channel.send(StreamTxt.SuccessConfig);
                        break;

                    default:
                        message.channel.send(NotUnderstoodTxt);
                }
            } while(!isReplyOk || !endModify);
        }

    } catch (err) {
        console.log(err);
        message.channel.send(ErrorTxt);
    }

}

async function getStreamingRoleName(guildId) {
    try {
        const [result]  = await Database.getStreaming(guildId);
        return result.streamingRole;
    } catch (err) {
        console.log(err);
    }
}

async function announceStream(member) {
    try {
        const guild = member.guild;
        const [result]  = await Database.getStreaming(guild.id);
        let message = result.streamingMessage;

        if(message.match(/{name}/)) {
            message = message.replace(/{name}/, '**' + (member.nickname ? member.nickname : member.user.username) + '**');
        }

        if(message.match(/{url}/)) {
            const url = member.presence.activities.find(act => act.type == 'STREAMING').url;
            message = message.replace(/{url}/, url);
        }

        const announcementChannel = guild.channels.resolve(result.streamingChannelId);
        announcementChannel.send(message);
    } catch (err) {
        console.log(err);
    }
}

module.exports = { config, getStreamingRoleName, announceStream }