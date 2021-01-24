class Music {
    
    static ytdl   = require('ytdl-core');
    static config = require('../../config.json');

    static prefix = this.config.PREFIX;
    static queue  = new Map();

    /**
     * 
     * @param {Message} message 
     */
    static async execute(message) {
        if(!this.isInVoiceChannel(message.member)) {
            return message.channel.send('Tu dois d\'abord te connecter à un canal vocal');
        }

        const voiceChannel = message.member.voice.channel;
        const permissions = voiceChannel.permissionsFor(message.client.user);

        if(!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return message.channel.send('J\'ai besoin des permissions de me connecter et de parler dans ton canal vocal pour jouer de la musique. Contactes un administrateur.');
        }

        const songInfo = await this.ytdl.getInfo(this.getArgs(message)[0]).catch(e => this.sendError(e, message.channel));
        const song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url
        };

        const serverQueue = this.queue.get(message.guild.id);

        if(!serverQueue) {
            const queueConstruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            }

            this.queue.set(message.guild.id, queueConstruct);
            queueConstruct.songs.push(song);

            try {
                var connection = await voiceChannel.join().catch(e => this.sendError(e, message.channel));
                queueConstruct.connection = connection;
                this.play(message.guild.id, queueConstruct.songs[0]);
            } catch (e) {
                console.log(e);
                this.queue.delete(message.guild.id);
                return message.channel.send(e);
            }

        } else {
            serverQueue.songs.push(song);
            message.channel.send(`${song.title} a été ajouté à la liste de lecture.`);
            return message.channel.send(this.printQueue(serverQueue));
        }  
    }

    static play(guildId, song) {
        const serverQueue = this.queue.get(guildId);

        if(!song) {
            serverQueue.voiceChannel.leave();
            this.queue.delete(guildId);
            return serverQueue.textChannel.send('Il n\' y a plus de musique en attente de lecture. Au revoir !');
        }

        const dispatcher = serverQueue.connection.play(this.ytdl(song.url))
                                                 .on('finish', () => {
                                                     serverQueue.songs.shift();
                                                     this.play(guildId, serverQueue.songs[0]);
                                                 })
                                                 .on('error', error => this.sendError(error, serverQueue.textChannel));
        dispatcher.setVolumeLogarithmic(1);
        serverQueue.textChannel.send(`Lecture en cours : **${song.title}**`);
        serverQueue.textChannel.send(this.printQueue(serverQueue));
    }

    static skip(message) {
        if(this.isInVoiceChannel(message.member)) {
            const serverQueue = this.queue.get(message.guild.id);
            if(!serverQueue) {
                return message.channel.send('Il n\'y a aucune musique en cours de lecture que je puisse passer.');
            }
            serverQueue.connection.dispatcher.end();
        }
    }

    static stop(message) {
        if(this.isInVoiceChannel(message.member)) {
            const serverQueue = this.queue.get(message.guild.id);
            if(!serverQueue) {
                return message.channel.send('Il n\'y a aucune musique en cours de lecture.');
            }
            serverQueue.voiceChannel.leave();
            this.queue.delete(message.guild.id);
            return serverQueue.textChannel.send('Au revoir !');
        }
    }

    static pause(message) {
        if(this.isInVoiceChannel(message.member)) {
            const serverQueue = this.queue.get(message.guild.id);
            if(!serverQueue) {
                return message.channel.send('Il n\'y a aucune musique en cours de lecture.');
            }
            serverQueue.connection.dispatcher.pause();
        }
    }

    static resume(message) {
        if(this.isInVoiceChannel(message.member)) {
            const serverQueue = this.queue.get(message.guild.id);
            if(!serverQueue || serverQueue.connection.dispatcher.paused == false) {
                return message.channel.send('Il n\'y a aucune musique en pause.');
            }
            serverQueue.connection.dispatcher.resume();
        }
    }

    static isInVoiceChannel(member) {
        return member.voice.channel ? true : false;
    }

    static getArgs(message) {
        return message.content.slice(this.prefix.length).split(' ').slice(1);
    }

    static printQueue(serverQueue) {
        let str = '**__Liste de lecture :__**\n';
        for(let i = 0; i < serverQueue.songs.length; i++) {
            str += `${i == 0 ? '*(En cours) ' : '- '}` + serverQueue.songs[i].title + `${i == 0 ? '*' : ''}\n`;
        }
        return str;
    }

    static sendError(error, channel) {
        console.log(error);
        this.queue.delete(channel.guild.id);
        return channel.send('J\'ai rencontré une erreur et dois partir.\n(Si l\'erreur persiste, contactez un administrateur.');
    }
}

module.exports = Music;