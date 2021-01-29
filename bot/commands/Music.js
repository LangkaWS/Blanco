const ytdl   = require('ytdl-core');
const Tools  = require('../Tools.js');

const queue  = new Map();

/**
 * Call the suitable function according to arguments of the command.
 * @param {Message} message 
 */
function menu(message) {
    const [command] = Tools.getArgs(message);

    switch(command) {
    case 'play':
        play(message);
        break;
    
    case 'skip':
        skip(message);
        break;

    case 'stop':
        stop(message);
        break;
    
    case 'pause':
        pause(message);
        break;

    case 'resume':
        resume(message);
        break;
    
    case 'help':
    default:
        help(message);
    }
}

/**
 * Add the music to guild queue and start it if there is no current queue for the guild. 
 * @param {Message} message the command message
 */
async function play(message) {
    if(!message.member.voice.channel) {
        message.channel.send('Tu dois d\'abord te connecter à un canal vocal');
        return;
    }

    const voiceChannel = message.member.voice.channel;
    const permissions  = voiceChannel.permissionsFor(message.client.user);

    if(!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        message.channel.send('J\'ai besoin des permissions de me connecter et de parler dans ton canal vocal pour jouer de la musique. Contactes un administrateur.');
        return;
    }

    const musicInfo = await ytdl.getInfo(Tools.getArgs(message)[1])
                                     .catch(e => sendError(e, message.channel));
    const music     = {
        title: musicInfo.videoDetails.title,
        url:   musicInfo.videoDetails.video_url
    };
    const guildQueue = queue.get(message.guild.id);

    if(!guildQueue) {
        const queueConstruct = {
            textChannel:  message.channel,
            voiceChannel: voiceChannel,
            connection:   null,
            musics:       [],
            volume:       5,
            playing:      true
        }

        queue.set(message.guild.id, queueConstruct);
        queueConstruct.musics.push(music);

        try {
            let connection            = await voiceChannel.join()
                                                          .catch(e => sendError(e, message.channel));
            queueConstruct.connection = connection;
            start(message.guild.id, queueConstruct.musics[0]);
        } catch (e) {
            console.log(e);
            queue.delete(message.guild.id);
            message.channel.send(e);
            return;
        }

    } else {
        guildQueue.musics.push(music);
        message.channel.send(`${music.title} a été ajouté à la liste de lecture.`);
        message.channel.send(printQueue(guildQueue));
        return;
    }  
}

/**
 * Play a music in the defined voice channel. If no music left, leave the channel and delete the guild queue.
 * @param {number} guildId the id of the guild
 * @param {object} music the music to play
 */
function start(guildId, music) {
    const guildQueue = queue.get(guildId);

    if(!music) {
        guildQueue.voiceChannel.leave();
        queue.delete(guildId);
        guildQueue.textChannel.send('Il n\' y a plus de musique en attente de lecture. Au revoir !');
        return;
    }

    const dispatcher = guildQueue.connection.play(ytdl(music.url))
                                            .on('finish', () => {
                                                 guildQueue.musics.shift();
                                                 start(guildId, guildQueue.musics[0]);
                                            })
                                            .on('error', error => sendError(error, guildQueue.textChannel));
    dispatcher.setVolumeLogarithmic(1);
    guildQueue.textChannel.send(`Lecture en cours : **${music.title}**`);
    guildQueue.textChannel.send(printQueue(guildQueue));
}

/**
 * Skip the current music.
 * @param {Message} message the command message
 */
function skip(message) {
    const memberVoiceChannel = message.member.voice.channel;
    const guildQueue         = queue.get(message.guild.id);

    if(memberVoiceChannel != guildQueue.voiceChannel) {
        notSameVoiceChannel(message.channel);
        return;
    }

    if(!guildQueue) {
        message.channel.send('Il n\'y a aucune musique en cours de lecture que je puisse passer.');
        return;
    }

    guildQueue.connection.dispatcher.end();
}

/**
 * Stop the music and delete the guild queue.
 * @param {Message} message the command message
 */
function stop(message) {
    const memberVoiceChannel = message.member.voice.channel;
    const guildQueue         = queue.get(message.guild.id);

    if(memberVoiceChannel != guildQueue.voiceChannel) {
        notSameVoiceChannel(message.channel);
        return;
    }

    if(!guildQueue) {
        message.channel.send('Il n\'y a aucune musique en cours de lecture.');
        return;
    }

    guildQueue.voiceChannel.leave();
    queue.delete(message.guild.id);
    guildQueue.textChannel.send('Au revoir !');
}

/**
 * Pause current music.
 * @param {Message} message the command message
 */
function pause(message) {
    const memberVoiceChannel = message.member.voice.channel;
    const guildQueue         = queue.get(message.guild.id);

    if(memberVoiceChannel != guildQueue.voiceChannel) {
        notSameVoiceChannel(message.channel);
        return;
    }

    if(!guildQueue) {
        message.channel.send('Il n\'y a aucune musique en cours de lecture.');
        return;
    }

    guildQueue.connection.dispatcher.pause();
}

/**
 * Resume the current paused music.
 * @param {Message} message the command message
 */
function resume(message) {
    const memberVoiceChannel = message.member.voice.channel;
    const guildQueue         = queue.get(message.guild.id);

    if(memberVoiceChannel != guildQueue.voiceChannel) {
        notSameVoiceChannel(message.channel);
        return;
    }

    if(!guildQueue || guildQueue.connection.dispatcher.paused == false) {
        message.channel.send('Il n\'y a aucune musique en pause.');
        return;
    }

    guildQueue.connection.dispatcher.resume();
}

/**
 * Take the guild queue and format it in user friendly playlist.
 * @param {object} guildQueue 
 * @returns {string} the playlist
 */
function printQueue(guildQueue) {
    let str = '**__Liste de lecture :__**\n';

    for(let i = 0; i < guildQueue.musics.length; i++) {
        str += `${i == 0 ? '*(En cours) ' : '- '}` + guildQueue.musics[i].title + `${i == 0 ? '*' : ''}\n`;
    }
    
    return str;
}

/**
 * Prints the error in the console, delete the guild queue and send an error message in the channel.
 * @param {object} error 
 * @param {object} channel 
 */
function sendError(error, channel) {
    console.log(error);
    queue.get(channel.guild.id).voiceChannel.leave();
    queue.delete(channel.guild.id);
    channel.send('J\'ai rencontré une erreur et dois partir.\n(Si l\'erreur persiste, contactez un administrateur)');
}

/**
 * Called when the member and the bot need to be in the same voice channel, send a warning message.
 * @param {TextChannel} textChannel the text channel to send the message
 */
function notSameVoiceChannel(textChannel) {
    textChannel.send('Tu dois être dans le même channel que moi pour exécuter cette action.');
}

/**
 * Display help on the music commands
 * @param {Message} message 
 */
function help(message) {
    message.channel.send(`
Voici les différentes fonctions de la catégorie musique :
- \`!m\` \`play\` \`youtube_video_url\` : lit la piste audio de la vidéo dans le canal vocal où tu es connecté
- \`!m\` \`pause\` : met en pause la lecture
- \`!m\` \`resume\` : reprend la lecture en pause
- \`!m\` \`skip\` : passe à la vidéo suivante ; s'il n'y en a aucune en attente, arrête la lecture et quitte le canal vocal
- \`!m\` \`stop\` : arrête la lecture et quitte le canal vocal
Si vous avez des questions ou rencontrez des problèmes, n'hésitez pas à en faire part aux administrateurs.
    `);
}

module.exports = { menu };
