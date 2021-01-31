const Tools = require('../Tools.js');
const Database = require('../Database.js');
const Moment = require('moment');

function menu(message) {
    const [command] = Tools.getArgs(message);
    
    switch(command) {
    case 'setup':
        setup(message);
        break;

    case 'auto':
        happyBirthday(message);
        break;
    
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
            message.channel.send("Il existe déjà une configuration pour votre serveur :\nChannel : " + channel.name + "\rMessage d'annonce :\r" + conf.message + "\nVoulez-vous la remplacer ? (yes/no)");
            const confirm = await message.channel.awaitMessages(filter, { max: 1 });
            if(confirm.first().content === 'yes') {
                message.channel.send("Dans quel canal veux-tu que je souhaite les anniversaires ? (copie et colle l'identifiant du canal)");
                const channel = await message.channel.awaitMessages(filter, { max: 1 });
                const channelId = channel.first().content;

                if(message.guild.channels.resolve(channelId)) {
                    message.channel.send("Quel message veux-tu afficher ? Utilises `{name}` pour me signaler que je dois indiquer ici le nom du membre.");
                    const msgCollector = await message.channel.awaitMessages(filter ,{ max: 1 });
                    const bdMessage = msgCollector.first().content;

                    await Database.updateGuildConfig(message.guild.id, channelId, bdMessage);
                    message.channel.send("La mise à jour a bien été faite.");
                }


            }
        } else {
            message.channel.send("Dans quel canal veux-tu que je souhaite les anniversaires ? (copie et colle l'identifiant du canal)");
            const channel = await message.channel.awaitMessages(filter, { max: 1 });
            const channelId = channel.first().content;
                
            if(message.guild.channels.resolve(channelId)) {
                message.channel.send("Quel message veux-tu afficher ? Utilises `{name}` pour me signaler que je dois indiquer ici le nom du membre.");
                const msgCollector = await message.channel.awaitMessages(filter ,{ max: 1 });
                const bdMessage = msgCollector.first().content;

                await Database.createGuildConfig(message.guild.id, channelId, bdMessage);
                message.channel.send("La configuration est terminée.");
            }
        }
        
    } catch (err) {
        console.log(err);
    }

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
        if(!isConfig(message)) {
            return;
        }
    
        const [memberBirthday] = await Database.getMemberBirthday(message.guild.id, message.member.id);
        
        if(memberBirthday) {
            message.channel.send("Votre anniversaire est déjà enregistré.");
            return;
        }
    
        const [, date] = Tools.getArgs(message);
        const dateRegex = /(?:31\/(0[13578])|(1[02]))|(?:30\/(0[13456789])|(1[02]))|(?:(?:(?:0[1-9])|(?:[1-2][0-9]))\/(?:(?:0[1-9])|(?:1[0-2])))/g;
        console.log(date.match(dateRegex));
        const year = new Date().getFullYear();
        const fullDate = date + '/'+ year;
        const moment = Moment(fullDate, 'DD/MM/YYYY');

        await Database.addBirthday(message.member.id, moment.toDate(), message.guild.id);
        message.channel.send("Votre anniversaire a bien été ajouté.");

    } catch(err) {
        console.log(err);
    }
}

async function removeBirthday(message) {
    try {
        if(!isConfig(message)) {
            return;
        }

        const [memberBirthday] = await Database.getMemberBirthday(message.guild.id, message.member.id);
    
        if(!memberBirthday) {
            message.channel.send("Vous n'avez pas d'anniversaire enregistré.");
            return;
        }

        await Database.removeBirthday(message.member.id);
        message.channel.send("Votre anniversaire a bien été supprimé.");

    } catch (err) {
        console.log(err);
    }
}
module.exports = { menu };