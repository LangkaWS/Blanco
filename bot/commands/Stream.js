class Stream {

    static Tools = require('../Tools.js');

    static streamingConfig = new Map();

    static config(message) {
        const args = this.Tools.getArgs(message);

        if(!this.streamingConfig.get(message.guild.id)) {
            const configConstruct = {
                role: '',
                channel: '',
                announc: ''
            }

            this.streamingConfig.set(message.guild.id, configConstruct);
        }

        switch(args[0]) {
            case 'role':
                this.streamingConfig.get(message.guild.id).role = args[1];
                break;
            case 'channel':
                this.streamingConfig.get(message.guild.id).channel = args[1];
                break;
            case 'message':
                this.streamingConfig.get(message.guild.id).announc = args.slice(1).join(' ');
                break;
            case 'full':
                this.streamingConfig.get(message.guild.id).role = args[1];
                this.streamingConfig.get(message.guild.id).channel = args[2];
                this.streamingConfig.get(message.guild.id).announc = args.slice(3).join(' ');
                break;
        }
    }

    static announceStream(member) {
        member.guild.channels.cache.find(c => c.type == 'text' && c.name == this.streamingConfig.get(member.guild.id).channel)
                                   .send(`Hello @here! ${member.nickname} est en live ! C'est ici que ça se passe : ${member.presence.activities.find(act => act.type == 'PLAYING').url} !`);
    }
}

module.exports = Stream;