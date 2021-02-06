const Database     = require('../queries/GlobalQueries.js');
const Tools        = require('../Tools.js');
const AdminQueries = require('../queries/AdminQueries.js');

const { Setup, AccessDenied, NotUnderstoodTxt } = require('../languages/fr.json');

/**
 * Call the appropriate function according to arguments of the command.
 * @param {Message} message 
 */
function menu(message) {
    const [command] = Tools.getArgs(message);

    switch (command) {
    case 'admin':
        setupAdmin(message);
        break;

    case 'next':
    case 'add':
    case 'remove':
        break;
    
    case 'help':
    default:
        help(message);
    }
}

/**
 * Get the admin roles of the server and ask if the member want to modify them or create them if not set up.
 * @param {Message} message 
 */
async function setupAdmin(message) {
    try {
        const adminRolesConfig = await Database.getAdminRoles(message.guild.id);
        const adminRoles = [];
        adminRolesConfig.forEach(role => adminRoles.push(role.role_id));

        let isNewAdminSetup = false;

        if (!adminRolesConfig.length) {
            isNewAdminSetup = true;

            let wantCreateAdminRoles =  await Tools.getReply(message, Setup.AskSetupAdminRole);
            while (wantCreateAdminRoles !== 'yes' && wantCreateAdminRoles !== 'no') {
                wantCreateAdminRoles = await Tools.getReply(message, NotUnderstoodTxt);
            }

            if (wantCreateAdminRoles === 'yes') {
                let reply;
                do {
                    const roleMention = await Tools.getReply(message, Setup.AskAdminRoleToAdd);
                    reply = await addRole(message, roleMention, adminRoles);
                } while (reply !== '!blanco next')
            }

            message.channel.send(Setup.AdminSetupEnd);
        }
        
        if (isAdmin(message.member, adminRoles)) {
            if (isNewAdminSetup === false) {

                let wantModifyAdminRoles =  await Tools.getReply(message, Setup.AskModifyAdminRoles);
                while (wantModifyAdminRoles !== 'yes' && wantModifyAdminRoles !== 'no') {
                    wantModifyAdminRoles = await Tools.getReply(message, NotUnderstoodTxt);
                }
    
                if (wantModifyAdminRoles === 'yes') {

                    message.channel.send(Setup.AdminRolesList);
                    let roleList = '';
                    adminRoles.forEach(roleId => {
                        let role = message.guild.roles.resolve(roleId);
                        roleList += '- ' + role.name + '\r';
                    });
                    message.channel.send(roleList);
    
                    message.channel.send(Setup.AskAdminRolesModification);
    
                    let modificationCommand = '';
    
                    do {
                        modificationCommand = await message.channel.awaitMessages(msg => msg.author.id === message.author.id, {max: 1});
                        const [command, role] = Tools.getArgs(modificationCommand.first());
                        if (command === 'add') {
                            await addRole(message, role, adminRoles);
                        } else if (command === 'remove') {
                            await removeRole(message, role, adminRoles);
                        } else if (command !== 'next') {
                            message.channel.send(NotUnderstoodTxt);
                        }
                    } while (modificationCommand.first().content !== '!blanco next')
                }

                message.channel.send(Setup.AdminSetupEnd);
            }
        } else {
            message.channel.send(AccessDenied);
            return;
        }
    } catch (err) {
        console.error(new Date());
        console.error(err);
    }
}

/**
 * Check if the role is already set up as admin and if exists in the server, then add it as admin.
 * @param {Message} message 
 * @param {string} roleMention 
 * @param {[string]} roles 
 */
async function addRole(message, roleMention, roles) {
    const roleId = roleMention.replace('<@&', '').replace('>', '');
    if (!roles.includes(roleId)) {
        if (isRole(message.guild, roleId)) {
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

/**
 * Check if the role is set up as admin and if exists in the server, then remove it from admin.
 * @param {Message} message 
 * @param {string} roleMention 
 * @param {[string]} roles 
 */
async function removeRole(message, roleMention, roles) {
    const roleId = roleMention.replace('<@&', '').replace('>', '');
    if (roles.includes(roleId)) {
        if (isRole(message.guild, roleId)) {
            await AdminQueries.removeAdminRole(message.guild.id, roleId);
            roles.splice(roles.indexOf(roleId), 1);
            message.channel.send(Setup.RoleSuccessfullyRemoved);
        } else {
            message.channel.send(Setup.RoleNotFoundInGuild);
        }
    } else {
        message.channel.send(Setup.RoleIsNotAdmin);
    }
}

/**
 * Check if the member has an admin role or not.
 * @param {GuildMember} member 
 * @param {[string]} roles 
 */
function isAdmin(member, roles) {
    return member.roles.cache.some(role => roles.includes(role.id));
}

/**
 * Check if the server has this role or not.
 * @param {Guild} guild 
 * @param {string} roleId 
 */
function isRole(guild, roleId) {
    return guild.roles.cache.some(r => r.id === roleId);
}

/**
 * Display help about the admin setup.
 * @param {Message} message 
 */
function help(message) {
    message.channel.send(Setup.Help);
}

module.exports = { menu }