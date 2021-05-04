const StreamingQueries = require('../queries/StreamQueries.js');
const Tools = require('../Tools.js');

const { StreamTxt, AccessDenied, NotUnderstoodTxt, RoleNotFound, SuccessConfig } = require('../languages/fr.json');

/**
 * Call the appropriate function according to arguments of the command.
 * @param {Message} message 
 */
function menu(message) {
  const feature = 'stream';
  const [command] = Tools.getArgs(message);

  switch (command) {
  case 'setup':
    setup(message);
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

async function setup(message) {
  try {

    const isAdmin = await Tools.checkAdmin(message.member);
    if (!isAdmin) return message.channel.send(AccessDenied);

    const guild = message.guild;

    const [setup] = await StreamingQueries.getSetup(message.guild.id);

    if (setup) {

      const announcementChannel = guild.channels.resolve(setup.channel_id);
      const streamerRole = guild.roles.resolve(setup.streamer_role_id);
      const liveRole = guild.roles.resolve(setup.live_role_id);
      const announcementMessage = setup.message;

      const currentSetupMessage = StreamTxt.AlreadySetup
        + StreamTxt.StreamerRole + (streamerRole ? '<@&' + streamerRole + '>' : '') + '\r'
        + StreamTxt.LiveRole + (streamerRole ? '<@&' + liveRole + '>' : '') + '\r'
        + StreamTxt.Channel + (announcementChannel ? '<#' + announcementChannel + '>' : '') + '\r'
        + StreamTxt.Message + announcementMessage;

      message.channel.send(currentSetupMessage);
    
    }

    let wantToSetup = await Tools.getReply(message, setup ? StreamTxt.AskModifyCurrentSetup : StreamTxt.NoSetup);

    while (wantToSetup !== 'yes' && wantToSetup !== 'no') {
      wantToSetup = await Tools.getReply(message, NotUnderstoodTxt);
    }

    if (wantToSetup === 'no') return;

    //Setup new streamer role
    let newStreamerRole = await Tools.getReply(message, (setup && setup.streamer_role_id) ? StreamTxt.AskModifyStreamerRole : StreamTxt.AskStreamerRole);
    let newStreamerRoleId = setup.streamer_role_id;

    if (newStreamerRole !== '!str next') {
      newStreamerRoleId = newStreamerRole.replace('<@&', '').replace('>', '');
      let isRole = Tools.checkRole(guild, newStreamerRoleId);

      while (!isRole) {
        newStreamerRole = await Tools.getReply(message, RoleNotFound);
        newStreamerRoleId = newStreamerRole.replace('<@&', '').replace('>', '');
        isRole = Tools.checkRole(guild, newStreamerRoleId);
      }
    }

    //Setup new live role
    let newLiveRole = await Tools.getReply(message, (setup && setup.live_role_id) ? StreamTxt.AskModifyLiveRole : StreamTxt.AskLiveRole);
    let newLiveRoleId = setup.live_role_id;

    if (newLiveRole !== '!str next') {
      newLiveRoleId = newLiveRole.replace('<@&', '').replace('>', '');
      let isRole = Tools.checkRole(guild, newLiveRoleId);

      while (!isRole) {
        newLiveRole = await Tools.getReply(message, RoleNotFound);
        newLiveRoleId = newLiveRole.replace('<@&', '').replace('>', '');
        isRole = Tools.checkRole(guild, newLiveRoleId);
      }
    }

    //Setup new announcement channel
    let newAnnouncementChannel = await Tools.getReply(message, (setup && setup.channel_id) ? StreamTxt.AskModifyChannel : StreamTxt.AskChannel);
    let newAnnouncementChannelId = setup.channel_id;

    if (newAnnouncementChannel !== '!str next') {
      newAnnouncementChannelId = newAnnouncementChannel.replace('<#', '').replace('>', '');
      let isChannel = Tools.checkChannel(guild, newAnnouncementChannelId);

      while (!isChannel) {
        newAnnouncementChannel = await Tools.getReply(message, RoleNotFound);
        newAnnouncementChannelId = newAnnouncementChannel.replace('<#', '').replace('>', '');
        isChannel = Tools.checkChannel(guild, newAnnouncementChannelId);
      }
    }

    //Setup new announcement message
    const reply = await Tools.getReply(message, (setup && setup.message) ? StreamTxt.AskModifyMessage : StreamTxt.AskMessage);
    let newAnnouncementMessage = setup.message;

    if (reply !== '!str next') {
      newAnnouncementMessage = reply
    }

    //Setup auto announcement
    let wantToEnableAutoAnnouncement = await Tools.getReply(message, StreamTxt.AskEnableAuto);

    while (wantToEnableAutoAnnouncement !== 'yes' && wantToEnableAutoAnnouncement !== 'no') {
      wantToEnableAutoAnnouncement = await Tools.getReply(message, NotUnderstoodTxt);
    }
    const auto = wantToEnableAutoAnnouncement === 'yes' ? 1 : 0;

    if (setup) {
      await StreamingQueries.updateSetup(guild.id, newStreamerRoleId, newLiveRoleId, newAnnouncementChannelId, newAnnouncementMessage, auto);
    } else {
      await StreamingQueries.createSetup(guild.id, newStreamerRoleId, newLiveRoleId, newAnnouncementChannelId, newAnnouncementMessage, auto);
    }

    message.channel.send(SuccessConfig);


  } catch (error) {
    Tools.sendError(error, message.channel);
  }
}

async function getStreamerRole(guild) {
  try {
    const [result] = await StreamingQueries.getStreamerRoleId(guild.id);
    if (result) {
      return guild.roles.resolve(result.streamer_role_id);
    } else {
      return null;
    }
  } catch (err) {
    console.log(new Date());
    console.log(err);
  }
}

async function getLiveRole(guild) {
  try {
    const [result] = await StreamingQueries.getLiveRoleId(guild.id);
    if (result) {
      return guild.roles.resolve(result.live_role_id);
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
      return result.auto === 1 ? true : false;
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
    let message  = result.message;

    if (message.match(/{name}/)) {
      message = message.replace(/{name}/, '**' + (member.nickname ? member.nickname : member.user.username) + '**');
    }

    if (message.match(/{url}/)) {
      const url = member.presence.activities.find(act => act.type === 'STREAMING').url;
      message   = message.replace(/{url}/, url);
    }

    const announcementChannel = guild.channels.resolve(result.channel_id);
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

module.exports = { menu, getStreamerRole, getLiveRole, isStreamActive, announceStream }