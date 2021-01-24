const { Client }            = require('discord.js');
const { PREFIX, BOT_TOKEN } = require('../config.json');
const Music                 = require('./commands/Music.js');

const client  = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
client.login(BOT_TOKEN);

client.on('message', async message => {
    if(message.author.bot)                  return;
    if(!message.content.startsWith(PREFIX)) return;

    const args    = message.content.slice(PREFIX.length).split(' ');
    const command = args.shift().toLowerCase();

    switch(command) {

        /* Music commands */
        case 'play':
            Music.play(message);
            break;
        
        case 'skip':
            Music.skip(message);
            break;

        case 'stop':
            Music.stop(message);
            break;
        
        case 'pause':
            Music.pause(message);
            break;

        case 'resume':
            Music.resume(message);
            break;
    }

});
