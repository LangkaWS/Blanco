const Database = require('../queries/GlobalQueries.js');
const AdminQueries = require('../queries/AdminQueries.js');
const Tools = require('../Tools.js');
const { Setup, AccessDenied, NotUnderstoodTxt } = require('../languages/fr.json');

/**
 * Call the suitable function according to arguments of the command.
 * @param {Message} message 
 */
function menu(message) {
    const [command] = Tools.getArgs(message);

    switch(command) {
    case 'setup':
        config(message);
        break;

    case 'next':
        break;
    
    case 'help':
    default:
        help(message);
    }
}

async function config(message) {
    try {
        const adminRolesConfig = await Database.getAdminRoles(message.guild.id);
        const adminRoles = [];
        adminRolesConfig.forEach(role => adminRoles.push(role.role_id));
        console.log('adminRoles: ' + adminRoles);

        if(!adminRolesConfig.length) {
            console.log('no admin config yet');
            let wantCreateAdminRoles =  await Tools.getReply(message, Setup.AskSetupAdminRole);
            while(wantCreateAdminRoles !== 'yes' && wantCreateAdminRoles !== 'no') {
                wantCreateAdminRoles = await Tools.getReply(message, NotUnderstoodTxt);
            }
            if(wantCreateAdminRoles === 'yes') {
                let reply;
                do {
                    reply = await addRole(message, adminRoles);
                } while(reply !== '!blanco end')
            } else {
                return;
            }
        }
        
        if(isAdmin(message.member, adminRoles)) {
            console.log('is admin');
            //Ask want to modify admin roles?

            const config = await Database.getSetup(message.guild.id);
            console.log('config: ' + config);
            console.log('Il y a déjà une configuration pour ce serveur : ');
        } else {
            message.channel.send(AccessDenied);
            return;
        }
        
    } catch (err) {
        console.error(new Date());
        console.error(err);
    }
}

async function addRole(message, roles) {
    const roleMention = await Tools.getReply(message, Setup.AskAdminRoleToAdd);
    const roleId = roleMention.replace('<@&', '').replace('>', '');
    if(!roles.includes(roleId)) {
        if(isRole(message.guild, roleId)) {
            await AdminQueries.addAdminRole(message.guild.id, roleId);
            roles.push(roleId);
            message.channel.send(Setup.RoleSuccessfullyAdded);
        } else {
            message.channel.send(Setup.RoleNotFoundInGuild);
        }
    } else {
        message.channel.send(Setup.RoleAlreadyAdmin);
    }
    return roleId;
}

function isAdmin(member, roles) {
    return member.roles.cache.some(role => roles.includes(role.id));
}

function isRole(guild, roleId) {
    return guild.roles.cache.some(r => r.id === roleId);
}

function help(message) {
    message.channel.send(Setup.Help);
}

module.exports = { menu }