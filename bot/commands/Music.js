const ytdl         = require('ytdl-core');
const { getArgs }  = require('../Tools.js');

const { MusicTxt, ErrorTxt } = require('../languages/fr.json');

const queue  = new Map();

/**
 * Call the suitable function according to arguments of the command.
 * @param {Message} message 
 */
function menu(message) {
    const [command] = getArgs(message);

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
    try {
        const voiceChannel = message.member.voice.channel;
        if(!voiceChannel) {
            message.channel.send(MusicTxt.NotInVoiceChannel);
            return;
        }
    
        const permissions  = voiceChannel.permissionsFor(message.client.user);
        if(!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            message.channel.send(MusicTxt.NoPermissions);
            return;
        }

        const [, musicURL] = getArgs(message);
        try {
            const musicInfo = await ytdl.getInfo(musicURL);
            const music     = {
                title: musicInfo.videoDetails.title,
                url  : musicInfo.videoDetails.video_url
            };
            const guildQueue = queue.get(message.guild.id);
            
            if(!guildQueue) {
                const queueConstruct = {
                    textChannel : message.channel,
                    voiceChannel: voiceChannel,
                    connection  : null,
                    musics      : [],
                    volume      : 5,
                    playing     : true
                }
        
                queue.set(message.guild.id, queueConstruct);
                queueConstruct.musics.push(music);
        
                let connection = await voiceChannel.join();
                queueConstruct.connection = connection;
                start(message.guild.id, queueConstruct.musics[0]);

            } else {
                guildQueue.musics.push(music);
                message.channel.send(music.title + MusicTxt.MusicAddedToPlaylist);
                message.channel.send(printQueue(guildQueue));
            }  
        } catch (err) {
            console.log(err);
            message.channel.send(MusicTxt.URLNotFound);
        }
    } catch (err) {
        console.log(err);
        message.channel.send(ErrorTxt);
        if(queue.get(message.guild.id)) {
            if(message.guild.voice) {
                queue.get(message.guild.id).voiceChannel.leave();
                queue.delete(message.guild.id);
            }
        }
    }
}

/**
 * Play a music in the defined voice channel. If no music left, leave the channel and delete the guild queue.
 * @param {Number} guildId the id of the guild
 * @param {Object} music the music to play
 * @param {String} music.title the title of the music
 * @param {String} music.url the url of the music
 */
function start(guildId, music) {
    try {
        const guildQueue = queue.get(guildId);
    
        if(!music) {
            guildQueue.voiceChannel.leave();
            queue.delete(guildId);
            guildQueue.textChannel.send(MusicTxt.EmptyPlaylist);
            return;
        }
    
        const dispatcher = guildQueue.connection
            .play(ytdl(music.url))
            .on('finish', () => {
                guildQueue.musics.shift();
                start(guildId, guildQueue.musics[0]);
            })
        dispatcher.setVolumeLogarithmic(1);
        guildQueue.textChannel.send(MusicTxt.NowPlaying + "**" + music.title + "**");
        guildQueue.textChannel.send(printQueue(guildQueue));

    } catch (err) {
        console.log(err);
        queue.get(guildId).voiceChannel.leave();
        queue.delete(guildId);
    }
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
        message.channel.send(MusicTxt.NoNowPlaying);
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
        message.channel.send(MusicTxt.NoNowPlaying);
        return;
    }

    guildQueue.voiceChannel.leave();
    queue.delete(message.guild.id);
    guildQueue.textChannel.send(MusicTxt.Bye);
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
        message.channel.send(MusicTxt.NoNowPlaying);
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

    if(!guildQueue || guildQueue.connection.dispatcher.paused === false) {
        message.channel.send(MusicTxt.NoPausedMusic);
        return;
    }

    guildQueue.connection.dispatcher.resume();
}

/**
 * Take the guild queue and format it in user friendly playlist.
 * @param {Object} guildQueue the queue for the guild
 * @param {TextChannel} guildQueue.textChannel the text channel to send messages to 
 * @param {VoiceChannel} guildQueue.voiceChannel the voice channel where the music is played
 * @param {VoiceConnection} guildQueue.connection the connection to the voice channel
 * @param {[Object]} guildQueue.musics the playlist
 * @param {Number} guildQueue.volume the volume
 * @param {Boolean} guildQueue.playing if is playing or not
 * @returns {string} the playlist
 */
function printQueue(guildQueue) {
    let str = MusicTxt.Playlist;

    for(let i = 0; i < guildQueue.musics.length; i++) {
        str += `${i === 0 ? MusicTxt.Current : '- '}` + guildQueue.musics[i].title + `${i === 0 ? '*' : ''}\n`;
    }
    
    return str;
}

/**
 * Called when the member and the bot need to be in the same voice channel, send a warning message.
 * @param {TextChannel} textChannel the text channel to send the message
 */
function notSameVoiceChannel(textChannel) {
    textChannel.send(MusicTxt.NotInSameVoiceChannel);
}

/**
 * Display help on the music commands
 * @param {Message} message 
 */
function help(message) {
    message.channel.send(MusicTxt.Help);
}

module.exports = { menu };
