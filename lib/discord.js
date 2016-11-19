'use strict';

const fs = require('fs');
const path = require('path');


class Discord {
    /**
     * @param {string} discordDir - '/path/to/Discord/'
     */
    constructor(discordDir) {
        discordDir = path.normalize(discordDir);

        if (!Discord.isValidDiscordDir(discordDir)) {
            throw new Discord.Error.InvalidDiscordDir();
        }

        this.discordDir = discordDir;
    }

    /**
     * Search for /Discord/app/ directory
     * @param {boolean} relativePath - whether retrieve paths in relative.
     * @returns {string[]} - found '/path/to/Discord/app/'s
     */
    searchAppDirs(relativePath = false) {
        let appDirs = fs.readdirSync(this.discordDir).filter(dir => /^app-/.test(dir));
        return relativePath ? appDirs : appDirs.map(dir => path.join(this.discordDir, dir));
    }

    /**
     * Check if the path to the Discord is valid.
     * @param {string} discordDir - '/path/to/Discord/'
     * @returns {boolean} - true if valid
     */
    static isValidDiscordDir(discordDir) {
        if (!fs.existsSync(path.join(discordDir, 'app.ico'))) return false;
        if (!fs.existsSync(path.join(discordDir, 'packages'))) return false;
        return true;
    }

    /**
     * Search for /Discord/ directory
     * @returns {string[]} - found '/path/to/Discord/'s
     */
    static searchDiscordDirs() {
        let candidates = [];

        candidates.push(path.dirname(process.argv[1]));

        switch (process.platform) {
            case 'win32':
                if (process.env.LOCALAPPDATA) {
                    candidates.push(path.join(process.env.LOCALAPPDATA, 'Discord'));
                }
                break;
        }

        candidates = candidates.filter(Discord.isValidDiscordDir);

        return candidates;
    }
}

Discord.Error = {
    InvalidDiscordDir: class{},
};


module.exports = Discord;
