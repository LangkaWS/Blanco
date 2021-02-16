const Cron     = require('cron');
const Tools    = require('../Tools.js');
const MemberMngQueries = require('../queries/MemberMgerQueries.js');
const GlobalQueries = require('../queries/GlobalQueries.js');

const { AccessDenied, ChannelNotFound, NotUnderstoodTxt } = require('../languages/fr.json');

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
        const cron = new Cron.CronJob('00 * * * * *', async () => {
            const guilds = await GlobalQueries.getAllGuilds();
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