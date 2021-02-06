require('dotenv').config();

const { Client, Intents } = require('discord.js');

const { prefix }          = require('../config.json');

const Music               = require('./commands/Music.js');
const Stream              = require('./commands/Stream.js');
const ReactionRoles       = require('./commands/ReactionRoles.js');
const Birthday = require('./commands/Birthday.js');
const Setup = require('./commands/Setup.js');

const client  = new Client({
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    ws: {
        intents: [Intents.NON_PRIVILEGED, 'GUILD_PRESENCES', 'GUILD_MEMBERS']
    }
});
client.login(process.env.BOT_TOKEN);

client.on('ready', () => {
    console.log('Hello');
});

client.on('message', message => {
    if(message.author.bot || !message.content.startsWith(prefix)) {
        return;
    }

    const args    = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();

    switch(command) {

        case 'blanco':
            Setup.menu(message);
            break;

        /* Music commands */
        case 'm':
            Music.menu(message);
            break;

        /* Streaming commands */
        case 'str':
            Stream.menu(message);
            break;
        
        /* Reaction roles commands */
        case 'rr':
            ReactionRoles.rrMenu(message);
            break;

        /* Birthday commands */
        case 'bd':
            Birthday.menu(message);
            break;
    }

});

client.on('messageReactionAdd', async (reaction, user) => {
    const rrMenu = await ReactionRoles.isReactionMenu(reaction);
    if(rrMenu) {
        ReactionRoles.addReactionRole(rrMenu, reaction, user);
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    const rrMenu = await ReactionRoles.isReactionMenu(reaction);
    if(rrMenu) {
        ReactionRoles.removeReactionRole(rrMenu, reaction, user);
    }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
        const diffRole = newMember.roles.cache.difference(oldMember.roles.cache).first();
        if(diffRole) {
            const streamingRole = await Stream.getStreamingRoleName(oldMember.guild.id);
            if(streamingRole && diffRole.name === streamingRole && newMember.roles.cache.get(diffRole.id)) {
                Stream.announceStream(newMember);
            }
        }
    } catch (error) {
        console.log(error);
    }
});