const Tools = require('../Tools.js');
const Database = require('../Database.js');
const Moment = require('moment');
const { BirthdayTxt, AccessDenied } = require('../languages/fr.json');

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
        
        const [conf] = await Database.getGuildConfig(message.guild.id);
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

                    await Database.updateGuildConfig(message.guild.id, channelId, bdMessage);
                    message.channel.send(BirthdayTxt.UpdateDone);
                }


            }
        } else {
            const channelId = await collectMessages(message, BirthdayTxt.AskChannel);
                
            if(message.guild.channels.resolve(channelId)) {
                const birthdayMessage = await collectMessages(message, BirthdayTxt.AskMessage);

                await Database.createGuildConfig(message.guild.id, channelId, birthdayMessage);
                message.channel.send("La configuration est terminée.");
            }
        }
        
    } catch (err) {
        console.log(err);
    }

}

async function collectMessages(originalMessage, question) {
    originalMessage.channel.send(question);
    const filter = msg => msg.author.id === originalMessage.author.id;
    const collector = await originalMessage.channel.awaitMessages(filter, { max: 1 });
    return collector.first().content;
}

function happyBirthday(message) {

}

async function isConfig(message) {
    const [config] = await Database.getGuildConfig(message.guild.id);
    if(!config) {
        message.channel.send("Le service des anniversaires n'est pas encore configuré sur ce serveur. Pour le configurer, faites \"!bd config\".");
        return false;
    } else {
        return true;
    }
}

/**
 * Called with: `!bd add 31/12`
 * @param {Message} message 
 */
async function addBirthday(message) {
    try {
        if(isConfig(message)) {
            const [memberBirthday] = await Database.getMemberBirthday(message.guild.id, message.member.id);
            
            if(!memberBirthday) {
                const [, date] = Tools.getArgs(message);
                const dateRegex = /(?:31\/(0[13578])|(1[02]))|(?:30\/(0[13456789])|(1[02]))|(?:(?:(?:0[1-9])|(?:[1-2][0-9]))\/(?:(?:0[1-9])|(?:1[0-2])))/g;
                console.log(date.match(dateRegex));
                const year = new Date().getFullYear();
                const fullDate = date + '/'+ year;
                const moment = Moment(fullDate, 'DD/MM/YYYY');
        
                await Database.addBirthday(message.member.id, moment.toDate(), message.guild.id);
                message.channel.send(BirthdayTxt.BirthdayAddConfirm);
            } else {
                message.channel.send(BirthdayTxt.AlreadyRegistered);
            }
        }
    } catch(err) {
        console.log(err);
    }
}

async function removeBirthday(message) {
    try {
        if(isConfig(message)) {
            const [memberBirthday] = await Database.getMemberBirthday(message.guild.id, message.member.id);

            if(memberBirthday) {
                await Database.removeBirthday(message.member.id);
                message.channel.send("Votre anniversaire a bien été supprimé.");
            } else {
                message.channel.send("Vous n'avez pas d'anniversaire enregistré.");
            }
        }
    } catch (err) {
        console.log(err);
    }
}

module.exports = { menu };