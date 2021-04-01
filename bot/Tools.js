const { prefix }        = require('../config.json');

const Database          = require('./queries/GlobalQueries.js');
const BirthdayQueries   = require('./queries/BirthdayQueries.js');
const StreamQueries     = require('./queries/StreamQueries.js');
const MemberMgerQueries = require('./queries/MemberMgerQueries.js');

const { AccessDenied, ChannelNotFound, ErrorTxt, NotUnderstoodTxt, RoleNotFound, SuccessConfig, BirthdayTxt, StreamTxt, MemberMgerTxt } = require('./languages/fr.json');

/**
 * Check if the member has an admin role or not.
 * @param {GuildMember} member the member to check
 * @param {[string]} roles the list of admin roles
 */
async function checkAdmin(member) {
  const adminRolesConfig = await Database.getAdminRoles(member.guild.id);
  return member.roles.cache.some(role => {
    for (let row of adminRolesConfig) {
      if (row.role_id === role.id) {
        return true;
      }
    }
  });
}

/**
 * Check if the server has this role or not.
 * @param {Guild} guild 
 * @param {string} roleId 
 */
function checkRole(guild, roleId) {
  return guild.roles.cache.some(r => r.id === roleId);
}

/**
 * Check if the server has this channel or not.
 * @param {Guild} guild 
 * @param {string} channelId 
 */
function checkChannel(guild, channelId) {
  return guild.channels.cache.some(c => c.id === channelId);
}

/**
 * Send a question in a channel and wait for the answer from initial message author.
 * @param {Message} initMessage the original command
 * @param {string} question the question to answer to
 * @returns {Promise<string>} the content of the answer
 */
async function getReply(initMessage, question) {
  initMessage.channel.send(question);
  const collected = await initMessage.channel.awaitMessages(msg => msg.author.id === initMessage.author.id, {max: 1});
  return collected.first().content;
}

/**
 * Get the arguments of a command and return an array of arguments.
 * @param {Message} message the command message
 * @returns {[string]} the arguments of the command
 */
function getArgs(message) {
  return message.content.slice(prefix.length).split(' ').slice(1).filter(el => el.length);
}

/**
 * Write in the console the error and the date when it happened and send an error message to a channel.
 * @param {Exception} error 
 * @param {TextChannel} channel 
 */
function sendError(error, channel) {
  console.log(new Date());
  console.log(error);
  channel.send(ErrorTxt);
}

async function setup(feature, message) {
  try {
    const isAdmin = await checkAdmin(message.member);
    if (!isAdmin) {
      message.channel.send(AccessDenied);
      return;
    }

    const guildId = message.guild.id;

    let featureQueries, featureTxt, featurePrefix;
    let needChannel = false;
    let needRole = false;
    let needMsg = false;

    switch(feature) {
      case 'birthdays':
        featureQueries = BirthdayQueries;
        featureTxt = BirthdayTxt;
        featurePrefix = 'bd';
        needChannel = true;
        needMsg = true;
        break;

      case 'stream':
        featureQueries = StreamQueries;
        featureTxt = StreamTxt;
        featurePrefix = 'str';
        needChannel = true;
        needRole = true;
        needMsg = true;
        break;

      case 'checkMember':
        featureQueries = MemberMgerQueries;
        featureTxt = MemberMgerTxt;
        featurePrefix = 'mm';
        needMsg = true;
        break;
    }

    const [setup] = await featureQueries.getSetup(guildId);

    let channelId, msg;
    let roleId, role;

    if(setup) {
      channelId = setup.channel_id;
      const channel = message.guild.channels.resolve(channelId);

      if(needRole) {
        roleId = setup.role_id;
        role = message.guild.roles.resolve(roleId);
      }

      msg = setup.message;

      const currentSetupMsg = featureTxt.AlreadySetup
       + (needRole ? featureTxt.Role + (role ? '<@&' + role + '>' : '') + '\r' : '') 
       + (needChannel ? featureTxt.Channel + (channel ? '<#' + channel + '>' : '') + '\r' : '')
       + (needMsg ? featureTxt.Message + msg : '');

      message.channel.send(currentSetupMsg);
    }

    let wantSetup = await getReply(message, setup ? featureTxt.AskModifyCurrentSetup : featureTxt.NoSetup);

    while(wantSetup !== 'yes' && wantSetup !== 'no') {
      wantSetup = await getReply(message, NotUnderstoodTxt);
    }

    if(wantSetup === 'yes') {

      if(needRole) {
        let newRole = await getReply(message, (setup && setup.role_id) ? featureTxt.AskModifyRole : featureTxt.AskRole);

        if(newRole !== '!' + featurePrefix + ' next') {
          let newRoleId = newRole.replace('<@&', '').replace('>', '');
          let isRole = checkRole(message.guild, newRoleId);

          while(!isRole) {
            newRole = await getReply(message, RoleNotFound);
            newRoleId = newRole.replace('<@', '').replace('>', '');
            isRole = checkRole(message.guild, newRoleId);
          }

          roleId = newRoleId;
        }

      }

      if(needChannel) {
        let newChannel = await getReply(message, (setup && setup.channel_id) ? featureTxt.AskModifyChannel : featureTxt.AskChannel);
  
        if(newChannel !== '!' + featurePrefix + ' next') {
          let newChannelId = newChannel.replace('<#', '').replace('>', '');
          let isChannel = checkChannel(message.guild, newChannelId);
  
          while(!isChannel) {
            newChannel = await getReply(message, ChannelNotFound);
            newChannelId = newChannel.replace('<#', '').replace('>', '');
            isChannel = checkChannel(message.guild, newChannelId);
          }
  
          channelId = newChannelId;
        }
      }

      if(needMsg) {
        const reply = await getReply(message, (setup && setup.message) ? featureTxt.AskModifyMessage : featureTxt.AskMessage);
  
        if(reply !== '!' + featurePrefix + ' next') {
          msg = reply;
        }
      }

      let wantToActivate = await getReply(message, featureTxt.AskEnableAuto);

      while(wantToActivate !== 'yes' && wantToActivate !== 'no') {
        wantToActivate = await getReply(message, NotUnderstoodTxt);
      }
      const auto = wantToActivate === 'yes' ? 1 : 0;

      if(setup) {
        if(needChannel) {
          if(needRole) {
            await featureQueries.updateSetup(message.guild.id, roleId, channelId, msg, auto);
          } else {
            await featureQueries.updateSetup(message.guild.id, channelId, msg, auto);
          }
        } else {
          await featureQueries.updateSetup(message.guild.id, msg, auto);
        }
      } else {
        if(needChannel) {
          if(needRole) {
            await featureQueries.createSetup(message.guild.id, roleId, channelId, msg, auto);
          } else {
            await featureQueries.createSetup(message.guild.id, channelId, msg, auto);
          }
        } else {
          await featureQueries.createSetup(message.guild.id, msg, auto);
        }
      }

      message.channel.send(SuccessConfig);
    }

  } catch (err) {
    sendError(err, message.channel);
  }
}

async function toogleAuto(feature, message, toogle) {
  try {
    const isAdmin = await checkAdmin(message.member);
    if(!isAdmin) {
      message.channel.send(AccessDenied);
      return;
    }

    let featureQueries, featureTxt;

    switch(feature) {
      case 'birthdays':
        featureQueries = BirthdayQueries;
        featureTxt = BirthdayTxt;
        break;

      case 'stream':
        featureQueries = StreamQueries;
        featureTxt = StreamTxt;
        break;

      case 'checkMember':
        featureQueries = MemberMgerQueries;
        featureTxt = MemberMgerTxt;
        break;
    }

    const [setup] = await featureQueries.getSetup(message.guild.id);

    if(!setup) {
      message.channel.send(featureTxt.NoSetup);
      return;
    } else {
      await featureQueries.toogleAutoAnnouncement(toogle, message.guild.id);
      if(toogle === 1) {
        message.channel.send(featureTxt.AutoAnnouncementEnabled);
      } else {
        message.channel.send(featureTxt.AutoAnnouncementDisabled);
      }
    }
  } catch (err) {
    sendError(err, message.channel);
  }
}

module.exports = { checkAdmin, checkRole, checkChannel, getReply, getArgs, sendError, setup, toogleAuto };
