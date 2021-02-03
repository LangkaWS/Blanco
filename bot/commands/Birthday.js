const Moment   = require('moment');
const Cron     = require('cron');
const Tools    = require('../Tools.js');
const BirthdayQueries = require('../queries/BirthdayQueries.js');

const { BirthdayTxt, AccessDenied } = require('../languages/fr.json');

/**
 * The menu of Birthday feature that call the appropriate function.
 * @param {Message} message 
 */
function menu(message) {
    const [command] = Tools.getArgs(message);
    
    switch(command) {
    case 'setup': {
        const isAdmin = message.member.roles.cache.get('805321593198477342');
        if(!isAdmin) {
            message.channel.send(AccessDenied);
            return;
        }
        setup(message);
        break;
    }

    case 'auto': {
        const isAdmin = message.member.roles.cache.get('492407354537541635');
        if(!isAdmin) {
            message.channel.send(AccessDenied);
            return;
        }
        happyBirthday(message);
        break;
    }
    
    case 'add':
        addBirthday(message);
        break;
    
    case 'remove':
        removeBirthday(message);
        break;
    
    case 'help':
    default:
        help(message);
    }
}

/**
 * Setup the birthday feature for the guild by adding guild ID, channel ID and the birthday message into database.
 * Called with: `!bd setup`
 * @param {Message} message 
 */
async function setup(message) {
    try {
        const filter = msg => msg.author.id === message.author.id;
        
        const [conf] = await BirthdayQueries.getGuildConfig(message.guild.id);
        if(conf) {
            const channel = message.guild.channels.resolve(conf.channelID);
            message.channel.send(BirthdayTxt.AlreadyConfig + '\r' + BirthdayTxt.Channel + channel.name + '\r' + BirthdayTxt.Message + conf.message + '\r' + BirthdayTxt.AskModifyConfig);
            const confirm = await message.channel.awaitMessages(filter, { max: 1 });
            if(confirm.first().content === 'yes') {
                message.channel.send(BirthdayTxt.AskChannel);
                const channel = await message.channel.awaitMessages(filter, { max: 1 });
                const channelId = channel.first().content;

                if(message.guild.channels.resolve(channelId)) {
                    message.channel.send(BirthdayTxt.AskMessage);
                    const msgCollector = await message.channel.awaitMessages(filter ,{ max: 1 });
                    const bdMessage = msgCollector.first().content;

                    await BirthdayQueries.updateGuildConfig(message.guild.id, channelId, bdMessage);
                    message.channel.send(BirthdayTxt.UpdateDone);
                }


            }
        } else {
            const channelId = await collectMessages(message, BirthdayTxt.AskChannel);
                
            if(message.guild.channels.resolve(channelId)) {
                const birthdayMessage = await collectMessages(message, BirthdayTxt.AskMessage);

                await BirthdayQueries.createGuildConfig(message.guild.id, channelId, birthdayMessage);
                message.channel.send(BirthdayTxt.SetupComplete);
            }
        }
        
    } catch (err) {
        console.log(err);
    }

}

/**
 * Send a message and collect one reply in a channel (the same as originalMessage was post in).
 * @param {Message} originalMessage 
 * @param {string} question 
 * @returns {string} the content of the first message
 */
async function collectMessages(originalMessage, question) {
    originalMessage.channel.send(question);
    const filter = msg => msg.author.id === originalMessage.author.id;
    const collector = await originalMessage.channel.awaitMessages(filter, { max: 1 });
    return collector.first().content;
}

/**
 * Activate the auto-birthday : in each guild, send an happy birthday message for each member that have a birthday today.
 * @param {Message} message 
 */
async function happyBirthday(message) {
    try {
        if(await isSetup(message)) {
            const birthdayJob = new Cron.CronJob('00 00 08 * * *', async () => {
                const today = new Date();
                const todayMySQL = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
                console.log(todayMySQL);
                const allBirthdays = await BirthdayQueries.getTodayAllBirthdays(todayMySQL);
                allBirthdays.forEach(bd => {
                    const guild = message.client.guilds.resolve(bd.guildID);
                    const channel = guild.channels.resolve(bd.channelID);
                    let msg = bd.message;
                    console.log(msg.match(/\{name\}/));
                    msg = bd.message.replace(/{name}/, `<@${bd.memberID}>`);
                    channel.send(msg);
                });
                console.log(allBirthdays);
            });
            birthdayJob.start();
        }
    } catch (err) {
        console.log(err);
    }
}

async function isSetup(message) {
    const [setup] = await BirthdayQueries.getGuildConfig(message.guild.id);
    if(!setup) {
        message.channel.send(BirthdayTxt.NoConfig);
        return false;
    } else {
        return true;
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
                    date = await collectMessages(message, BirthdayTxt.IncorrectDate);
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

module.exports = { menu };