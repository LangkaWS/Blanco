require('dotenv').config();

const { Client, Intents } = require('discord.js');

const { prefix }  = require('../config.json');

const Birthday    = require('./commands/Birthday.js');
const Main      = require('./commands/Main.js');
const Music     = require('./commands/Music.js');
const ReactionRoles = require('./commands/ReactionRoles.js');
const Admin     = require('./commands/Admin.js');
const Stream    = require('./commands/Stream.js');
const MemberManager = require('./commands/MemberManager.js');

const client = new Client({
  partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER'],
  ws: {
    intents: [Intents.ALL]
  }
});

try {
  client.login(process.env.BOT_TOKEN);
  
  client.on('ready', () => {
    console.log('Hello');
    client.user.setActivity('!help', {type : 'LISTENING'});
    Birthday.autoBirthday(client);
    MemberManager.autoCheckNewMembers(client);
  });

} catch (err) {
  console.log(err);
}

client.on('message', message => {
  if(message.author.bot || !message.content.startsWith(prefix)) {
    return;
  }

  const args  = message.content.slice(prefix.length).split(' ');
  const command = args.shift().toLowerCase();

  switch(command) {

    case 'blanco':
      Admin.menu(message);
      break;

    case 'help':
      Main.help(message);
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
      ReactionRoles.menu(message);
      break;

    /* Birthday commands */
    case 'bd':
      Birthday.menu(message);
      break;

    case 'mm':
      MemberManager.menu(message);
      break;
  }

});

client.on('messageReactionAdd', async (reaction, user) => {
  if(user.bot) {
    return;
  }
  const rrMenu = await ReactionRoles.isReactionMenu(reaction);
  if(rrMenu) {
    ReactionRoles.addReactionRole(rrMenu, reaction, user);
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if(user.bot) {
    return;
  }
  const rrMenu = await ReactionRoles.isReactionMenu(reaction);
  if(rrMenu) {
    ReactionRoles.removeReactionRole(rrMenu, reaction, user);
  }
});

client.on('presenceUpdate', async (oldPresence, newPresence) => {

  try {

    const streamStarted = newPresence.activities.some(activity => activity.type === 'STREAMING');

    if (streamStarted) {
      const streamerRole = await Stream.getStreamerRole(newPresence.guild);
      if (!streamerRole) return;

      const isStreamer = newPresence.member.roles.cache.some(role => role.id === streamerRole.id);
      if (!isStreamer) return;

      const liveRole = await Stream.getLiveRole(newPresence.guild);
      newPresence.member.roles.add(liveRole);
      return Stream.announceStream(newPresence);
    }

    const streamEnded = oldPresence.activities.some(activity => activity.type === 'STREAMING');

    if (streamEnded) {
      const liveRole = await Stream.getLiveRole(newPresence.guild);
      return oldPresence.member.roles.remove(liveRole);
    }

  } catch (error) {
    console.log(new Date());
    console.log(error);
  }
});