const Moment   = require('moment');
const Cron   = require('cron');
const Tools  = require('../Tools.js');
const BirthdayQueries = require('../queries/BirthdayQueries.js');

const { BirthdayTxt } = require('../languages/fr.json');

/**
 * The menu of Birthday feature that call the appropriate function.
 * @param {Message} message 
 */
function menu(message) {
  const feature = 'birthdays';
  const [command] = Tools.getArgs(message);
  
  switch(command) {
  case 'setup': {
    Tools.setup(feature, message);
    break;
  }

  case 'go':
    Tools.toogleAuto(feature, message, 1);
    break;

  case 'stop':
    Tools.toogleAuto(feature, message, 0);
    break;
  
  case 'add':
    addBirthday(message);
    break;
  
  case 'remove':
    removeBirthday(message);
    break;

  case 'next':
    break;
  
  case 'help':
  default:
    help(message);
  }
}

async function autoBirthday(client) {
  try {
    const birthdayJob = new Cron.CronJob('00 00 08 * * *', async () => {
      const today = new Date();
      const todayMySQL = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
      const allBirthdays = await BirthdayQueries.getTodayAllBirthdays(todayMySQL);
      allBirthdays.forEach(bd => {
        if(bd.bd_auto === 1) {
          const guild = client.guilds.resolve(bd.guild_id);
          const channel = guild.channels.resolve(bd.bd_channel_id);
          let msg = bd.bd_message;
          msg = bd.bd_message.replace(/{name}/, `<@${bd.member_id}>`);
          channel.send(msg);
        }
      });
    });
    birthdayJob.start();
  } catch (err) {
    console.log(err);
  }
}

async function isSetup(message) {
  try {
    const [setup] = await BirthdayQueries.getSetup(message.guild.id);
    if(!setup) {
      message.channel.send(BirthdayTxt.NoSetup);
      return false;
    } else {
      return true;
    }
  } catch (err) {
    Tools.send(err);
  }
}

/**
 * Add the birthday of a member to the database.
 * Called with: `!bd add 31/12`
 * @param {Message} message 
 */
async function addBirthday(message) {
  try {
    if(await isSetup(message)) {
      const [memberBirthday] = await BirthdayQueries.getMemberBirthday(message.guild.id, message.member.id);
      
      if(!memberBirthday) {
        let [, date] = Tools.getArgs(message);
        const dateRegex = /(?:31\/((0[13578])|(1[02])))|(?:30\/((0[13456789])|(1[02])))|(?:(?:(?:0[1-9])|(?:[1-2][0-9]))\/(?:(?:0[1-9])|(?:1[0-2])))/g;
        let match = date.match(dateRegex);

        if(!match) {
          date = await Tools.getReply(message, BirthdayTxt.IncorrectDate);
          match = date.match(dateRegex);
        } else {
          const year = new Date().getFullYear();
          const fullDate = date + '/'+ year;
          const moment = Moment(fullDate, 'DD/MM/YYYY');
      
          await BirthdayQueries.addBirthday(message.member.id, moment.format('YYYY-MM-DD'), message.guild.id);
          message.channel.send(BirthdayTxt.BirthdayAddConfirm);
        }

      } else {
        message.channel.send(BirthdayTxt.AlreadyRegistered);
      }
    }
  } catch(err) {
    console.log(err);
  }
}

/**
 * Remove the birthday of a member from the database.
 * @param {Message} message 
 */
async function removeBirthday(message) {
  try {
    if(await isSetup(message)) {
      const [memberBirthday] = await BirthdayQueries.getMemberBirthday(message.guild.id, message.member.id);

      if(memberBirthday) {
        await BirthdayQueries.removeBirthday(message.guild.id, message.member.id);
        message.channel.send(BirthdayTxt.BirthdayDeleteConfirm);
      } else {
        message.channel.send(BirthdayTxt.BirthdayNotFound);
      }
    }
  } catch (err) {
    console.log(err);
  }
}

/**
 * Display help.
 * @param {Message} message 
 */
function help(message) {
  message.channel.send(BirthdayTxt.Help);
}

module.exports = { menu, autoBirthday };