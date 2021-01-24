class Music {
    
    static ytdl   = require('ytdl-core');
    static config = require('../../config.json');
    static Tools  = require('../Tools.js');

    static queue  = new Map();

    /**
     * Add the music to guild queue and start it if there is no current queue for the guild. 
     * @param {Message} message the command message
     */
    static async play(message) {
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

        const musicInfo = await this.ytdl.getInfo(this.Tools.getArgs(message)[0])
                                         .catch(e => this.sendError(e, message.channel));
        const music     = {
            title: musicInfo.videoDetails.title,
            url:   musicInfo.videoDetails.video_url
        };
        const guildQueue = this.queue.get(message.guild.id);

        if(!guildQueue) {
            const queueConstruct = {
                textChannel:  message.channel,
                voiceChannel: voiceChannel,
                connection:   null,
                musics:       [],
                volume:       5,
                playing:      true
            }

            this.queue.set(message.guild.id, queueConstruct);
            queueConstruct.musics.push(music);

            try {
                let connection            = await voiceChannel.join()
                                                              .catch(e => this.sendError(e, message.channel));
                queueConstruct.connection = connection;
                this.start(message.guild.id, queueConstruct.musics[0]);
            } catch (e) {
                console.log(e);
                this.queue.delete(message.guild.id);
                message.channel.send(e);
                return;
            }

        } else {
            guildQueue.musics.push(music);
            message.channel.send(`${music.title} a été ajouté à la liste de lecture.`);
            message.channel.send(this.printQueue(guildQueue));
            return;
        }  
    }

    /**
     * Play a music in the defined voice channel. If no music left, leave the channel and delete the guild queue.
     * @param {number} guildId the id of the guild
     * @param {object} music the music to play
     */
    static start(guildId, music) {
        const guildQueue = this.queue.get(guildId);

        if(!music) {
            guildQueue.voiceChannel.leave();
            this.queue.delete(guildId);
            guildQueue.textChannel.send('Il n\' y a plus de musique en attente de lecture. Au revoir !');
            return;
        }

        const dispatcher = guildQueue.connection.play(this.ytdl(music.url))
                                                .on('finish', () => {
                                                     guildQueue.musics.shift();
                                                     this.start(guildId, guildQueue.musics[0]);
                                                })
                                                .on('error', error => this.sendError(error, guildQueue.textChannel));
        dispatcher.setVolumeLogarithmic(1);
        guildQueue.textChannel.send(`Lecture en cours : **${music.title}**`);
        guildQueue.textChannel.send(this.printQueue(guildQueue));
    }

    /**
     * Skip the current music.
     * @param {Message} message the command message
     */
    static skip(message) {
        const memberVoiceChannel = message.member.voice.channel;
        const guildQueue         = this.queue.get(message.guild.id);

        if(memberVoiceChannel != guildQueue.voiceChannel) {
            this.notSameVoiceChannel(message.channel);
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
    static stop(message) {
        const memberVoiceChannel = message.member.voice.channel;
        const guildQueue         = this.queue.get(message.guild.id);

        if(memberVoiceChannel != guildQueue.voiceChannel) {
            this.notSameVoiceChannel(message.channel);
            return;
        }

        if(!guildQueue) {
            message.channel.send('Il n\'y a aucune musique en cours de lecture.');
            return;
        }

        guildQueue.voiceChannel.leave();
        this.queue.delete(message.guild.id);
        guildQueue.textChannel.send('Au revoir !');
    }

    /**
     * Pause current music.
     * @param {Message} message the command message
     */
    static pause(message) {
        const memberVoiceChannel = message.member.voice.channel;
        const guildQueue         = this.queue.get(message.guild.id);

        if(memberVoiceChannel != guildQueue.voiceChannel) {
            this.notSameVoiceChannel(message.channel);
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
    static resume(message) {
        const memberVoiceChannel = message.member.voice.channel;
        const guildQueue         = this.queue.get(message.guild.id);

        if(memberVoiceChannel != guildQueue.voiceChannel) {
            this.notSameVoiceChannel(message.channel);
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
    static printQueue(guildQueue) {
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
    static sendError(error, channel) {
        console.log(error);
        this.queue.delete(channel.guild.id);
        channel.send('J\'ai rencontré une erreur et dois partir.\n(Si l\'erreur persiste, contactez un administrateur.');
    }

    /**
     * Called when the member and the bot need to be in the same voice channel, send a warning message.
     * @param {TextChannel} textChannel the text channel to send the message
     */
    static notSameVoiceChannel(textChannel) {
        textChannel.send('Tu dois être dans le même channel que moi pour exécuter cette action.');
    }
}

module.exports = Music;