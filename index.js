'use strict';

const Discord = require('./lib/discord.js');
const DiscordLoader = require('./lib/discord-loader.js');

const minimist = require('minimist');


const argv = minimist(process.argv.slice(2), {
    default: {
        appdir: null,
        profile: null,
        debug: false,
    },
});

const {appdir, profile, debug} = argv;


const discordDir = appdir || Discord.searchDiscordDirs()[0];

if (!discordDir) {
    console.log('Usage: discord-loader --appdir /path/to/Discord/ [--profile profilename] [--debug]');
    process.exit(1);
}


if (profile && !DiscordLoader.isValidProfile(profile, false)) {
    console.log('Invalid profilename specified');
    process.exit(1);
}


if (debug) {
    console.info('Debug mode enabled.');
    console.info('\n');
}

console.info('DiscordDir:', discordDir);


const discordLoader = new DiscordLoader(discordDir);

discordLoader.installOrUpdate(true);


const proc = discordLoader.launch(profile, debug);

['stdout', 'stderr'].forEach(intf => {
    proc[intf].pipe(process[intf]);
});

proc.on('exit', code => {
    console.log(`Child process exited with code ${code}`);
    process.exit(code);
});
