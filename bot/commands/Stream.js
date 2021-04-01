const StreamingQueries = require('../queries/StreamQueries.js');
const Tools = require('../Tools.js');

const { StreamTxt } = require('../languages/fr.json');

/**
 * Call the appropriate function according to arguments of the command.
 * @param {Message} message 
 */
function menu(message) {
  const feature = 'stream';
  const [command] = Tools.getArgs(message);

  switch (command) {
  case 'setup':
    Tools.setup(feature, message);
    break;

  case 'next':
    break;

  case 'go':
    Tools.toogleAuto(feature, message, 1);
    break;
  
  case 'stop':
    Tools.toogleAuto(feature, message, 0);
    break;
  
  case 'help':
  default:
    help(message);
  }
}

async function getStreamingRole(guild) {
  try {
    const [result] = await StreamingQueries.getStreamingRoleId(guild.id);
    if (result) {
      return guild.roles.resolve(result.str_role_id);
    } else {
      return null;
    }
  } catch (err) {
    console.log(new Date());
    console.log(err);
  }
}

async function isStreamActive(guild) {
  try {
    const [result] = await StreamingQueries.isStreamActive(guild.id);
    if (result) {
      return result.str_active === 1 ? true : false;
    } else {
      return null;
    }
  } catch (err) {
    console.log(new Date());
    console.log(err);
  }
}

async function announceStream(member) {
  try {
    const guild  = member.guild;
    const [result] = await StreamingQueries.getStreamingChannelAndMessage(guild.id);
    let message  = result.streamingMessage;

    if (message.match(/{name}/)) {
      message = message.replace(/{name}/, '**' + (member.nickname ? member.nickname : member.user.username) + '**');
    }

    if (message.match(/{url}/)) {
      const url = member.presence.activities.find(act => act.type === 'STREAMING').url;
      message   = message.replace(/{url}/, url);
    }

    const announcementChannel = guild.channels.resolve(result.streamingChannelId);
    announcementChannel.send(message);
  } catch (err) {
    console.log(new Date());
    console.log(err);
  }
}

/**
 * Display help about the streaming feature.
 * @param {Message} message 
 */
function help(message) {
  message.channel.send(StreamTxt.Help);
}

module.exports = { menu, getStreamingRole, isStreamActive, announceStream }