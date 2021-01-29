require('dotenv').config();

const { Client, Intents } = require('discord.js');

const { prefix }          = require('../config.json');

const Music               = require('./commands/Music.js');
const Stream              = require('./commands/Stream.js');
const ReactionRoles       = require('./commands/ReactionRoles.js');


const client  = new Client({
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    ws: {
        intents: [Intents.NON_PRIVILEGED, 'GUILD_PRESENCES', 'GUILD_MEMBERS']
    }
});
client.login(process.env.BOT_TOKEN);

client.on('ready', () => {
    console.log('Hello');
    console.log('Remember to configure the Stream feature with !config.');
});


client.on('message', message => {
    if(message.author.bot || !message.content.startsWith(prefix)) {
        return;
    }

    const args    = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();

    switch(command) {

        /* Music commands */
        case 'm':
            Music.menu(message);
            break;

        /* Streaming commands */
        case 'config':
            Stream.config(message);
            break;
        
        /* Reaction roles commands */
        case 'rr':
            ReactionRoles.rrMenu(message);
            break;
    }

});

client.on('messageReactionAdd', (reaction, user) => {
    if(reaction.message.id != ReactionRoles.rrMenuIdList.get(reaction.message.guild.id)) {
        return;
    }

    ReactionRoles.addRole(reaction, user);
});

client.on('messageReactionRemove', (reaction, user) => {
    if(reaction.message.id != ReactionRoles.rrMenuIdList.get(reaction.message.guild.id)) {
        return;
    }
    
    ReactionRoles.removeRole(reaction, user);
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
    try {
        if(newMember.roles.cache.find(r => r.name == Stream.streamingConfig.get(newMember.guild.id).role)) {
            Stream.announceStream(newMember);
        }
    } catch (error) {
        console.log(error);
    }
});
