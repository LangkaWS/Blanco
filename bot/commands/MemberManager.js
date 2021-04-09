const Cron   = require('cron');
const Tools  = require('../Tools.js');
const MemberMngQueries = require('../queries/MemberMgerQueries.js');

function menu(message) {
  const feature = 'checkMember';
  const [command] = Tools.getArgs(message);

  switch(command) {
    case 'setup':
      Tools.setup(feature, message);
      break;
    case 'go':
      Tools.toogleAuto(feature, message, 1);
      break;
    case 'stop':
      Tools.toogleAuto(feature, message, 0);
      break;
    case 'help':
    default:
      break;
  }
}

function autoCheckNewMembers(client) {
  try {
    const cron = new Cron.CronJob('00 00 14 * * 6', async () => {
      const guilds = await MemberMngQueries.getAllGuilds();
      const guildsEnabled = guilds.filter(guild => guild.auto === 1);
      guildsEnabled.forEach(element => {
        const guild = client.guilds.resolve(element.guild_id);
        guild.members.cache.each(member => {
          if(!member.user.bot && member.roles.cache.size === 1) {
            sendReminder(member, element.message);
          }
        });
      });
    });
    cron.start();
  } catch (err) {
    console.log(err);
  }
}

async function sendReminder(member, message) {
  try {
    let channel = await member.user.createDM();
    channel.send(message);
  } catch (err) {
    console.log(err);
  }
}

module.exports = { menu, autoCheckNewMembers };