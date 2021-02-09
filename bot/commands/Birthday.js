const Moment   = require('moment');
const Cron     = require('cron');
const Tools    = require('../Tools.js');
const BirthdayQueries = require('../queries/BirthdayQueries.js');

const { BirthdayTxt, AccessDenied, ChannelNotFound, NotUnderstoodTxt } = require('../languages/fr.json');

/**
 * The menu of Birthday feature that call the appropriate function.
 * @param {Message} message 
 */
function menu(message) {
    const [command] = Tools.getArgs(message);
    
    switch(command) {
    case 'setup': {
        setupBirthdays(message);
        break;
    }

    case 'go':
        enableAutoBirthday(message);
        break;

    case 'stop':
        disableAutoBirthday(message);
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

/**
 * Setup the birthday feature for the guild by adding guild ID, channel ID and the birthday message into database.
 * Called with: `!bd setup`
 * @param {Message} message 
 */
async function setupBirthdays(message) {
    try {

        const isAdmin = await Tools.isAdmin(message.member);
        if (!isAdmin) {
            message.channel.send(AccessDenied);
            return;
        }

        const guildId = message.guild.id;
        const [bdSetup]  = await BirthdayQueries.getSetup(guildId);

        const isNewSetup = !bdSetup || (!bdSetup.bd_channel_id && !bdSetup.bd_message && bdSetup.bd_auto !== 1 && bdSetup.bd_auto !== 0);
        createSetupInDB(message, isNewSetup, bdSetup);
        
    } catch (err) {
        Tools.sendError(err, message.channel);
    }

}

async function createSetupInDB(message, newSetup, bdSetup) {
    try {
        let bdChannelId;

        if(!newSetup) {
            bdChannelId = bdSetup.bd_channel_id;
            const currentChannel = message.guild.channels.resolve(bdChannelId);

            const currentSetupMsg = BirthdayTxt.AlreadySetup + BirthdayTxt.BirthdayChannel + (currentChannel ? currentChannel : '') + '\r' + BirthdayTxt.BirthdayMessage + bdSetup.bd_message;

            message.channel.send(currentSetupMsg);
        }

        let wantSetup = await Tools.getReply(message, newSetup ? BirthdayTxt.NoSetup : BirthdayTxt.AskModifyCurrentSetup);

        while(wantSetup !== 'yes' && wantSetup !== 'no') {
            wantSetup = await Tools.getReply(message, NotUnderstoodTxt);
        }

        if(wantSetup === 'yes') {
            let bdChannel = await Tools.getReply(message, (!newSetup && bdSetup.bd_channel_id) ? BirthdayTxt.AskModifyChannel : BirthdayTxt.AskChannel);

            if(bdChannel !== '!bd next') {
                bdChannelId = bdChannel.replace('<#', '').replace('>', '');
                let isChannel = Tools.isChannel(message.guild, bdChannelId);

                while(!isChannel) {
                    bdChannel = await Tools.getReply(message, ChannelNotFound);
                    bdChannelId = bdChannel.replace('<#', '').replace('>', '');
                    isChannel = Tools.isChannel(message.guild, bdChannelId);
                }
            }

            const bdMessage = await Tools.getReply(message, (!newSetup && bdSetup.bd_message) ? BirthdayTxt.AskModifyMessage : BirthdayTxt.AskMessage);

            let wantToActivate = await Tools.getReply(message, BirthdayTxt.AskEnableAutoAnnouncement);
            while (wantToActivate !== 'yes' && wantToActivate !== 'no') {
                wantToActivate = await Tools.getReply(message, NotUnderstoodTxt);
            }
            const autoParam = wantToActivate === 'yes' ? 1 : 0;

            if(newSetup && !bdSetup) {
                await BirthdayQueries.createSetup(message.guild.id, bdChannelId, bdMessage, autoParam);
            } else {
                await BirthdayQueries.updateSetup(message.guild.id, bdChannelId, bdMessage, autoParam);
            }

            message.channel.send(BirthdayTxt.SuccessConfig);
        }

    } catch (err) {
        Tools.sendError(err, message.channel);
    }
}

async function enableAutoBirthday(message) {
    try {
        const isAdmin = await Tools.isAdmin(message.member);
        if (!isAdmin) {
            message.channel.send(AccessDenied);
            return;
        }

        const [setup] = await isSetup(message);
        const bdAuto = setup.bd_auto;

        if(bdAuto && bdAuto === 0) {
            await BirthdayQueries.toogleAutoAnnouncement(1, message.guild.id);
        }

    } catch (err) {
        Tools.sendError(err, message.channel);
    }
}

async function disableAutoBirthday(message) {
    try {
        const isAdmin = await Tools.isAdmin(message.member);
        if (!isAdmin) {
            message.channel.send(AccessDenied);
            return;
        }

        const [setup] = await isSetup(message);
        const bdActive = setup.bd_auto;

        if(bdActive && bdActive === 1) {
           await BirthdayQueries.toogleAutoAnnouncement(0, message.guild.id);
        }
    } catch (err) {
        Tools.sendError(err, message.channel);
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