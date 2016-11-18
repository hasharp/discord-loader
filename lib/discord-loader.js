'use strict';

const Discord = require('./discord.js');
const resource = require('./resource.js');
const {writeJsonSync} = require('./writejson.js');

const asar = require('asar-lite');
const fs = require('fs-extra');

const childProcess = require('child_process');
const path = require('path');


class DiscordLoader {
    /**
     * @param discordDir {string} - '/path/to/Discord/'
     */
    constructor(discordDir) {
        discordDir = path.normalize(discordDir);

        this.discord = new Discord(discordDir);

        this.discordDir = discordDir;
        this.appDirs = this.discord.searchAppDir();

        this.loaderDir = path.join(this.discordDir, 'loader');

        this.invokerDir = path.join(this.loaderDir, 'invoker');
        this.profilesDir = path.join(this.loaderDir, 'profiles');
        this.tempDir = path.join(this.loaderDir, 'temp');
        this.userDir = path.join(this.loaderDir, 'user');
    }


    /**
     * Do install or update
     * @param doModify {boolean} - whether call `modify` to each app directories ('/path/to/Discord/app-#.#.#/') or not.
     */
    installOrUpdate(doModify) {
        if (fs.existsSync(this.loaderDir)) {
            this.update(doModify);
        } else {
            this.install(doModify);
        }
    }


    /**
     * Prepare files requried to launch discord-loader.
     * This is processed only when this is first launch of discord-loader.
     * @param doModify {boolean} - whether call `modify` to each app directories ('/path/to/Discord/app-#.#.#/') or not.
     */
    install(doModify) {
        resource.extractDirSync('root', this.loaderDir);

        fs.ensureDirSync(this.profilesDir);
        fs.ensureDirSync(this.tempDir);

        if (doModify) {
            this.appDirs.forEach(appDir => this.modify(appDir));
        }
    }


    /**
     * Update core files.
     * This will be called every launch of discord-loader.
     * @param doModify {boolean} - whether call `modify` to each app directories ('/path/to/Discord/app-#.#.#/') or not.
     */
    update(doModify) {
        resource.extractDirSync('root/invoker', this.invokerDir);

        if (doModify) {
            this.appDirs.forEach(appDir => this.modify(appDir));
        }
    }


    /**
     * Extract and modify package.json of the Discord App and make Discord App boot discord-loader.
     * This will be called every launch of discord-loader (to follow updates of the Discord App).
     * @param appDir {string} - '/path/to/Discord/app-#.#.#/'
     */
    modify(appDir) {
        const resDir = path.join(appDir, 'resources');
        const resAppDir = path.join(resDir, 'app');
        const resAppAsar = path.join(resDir, 'app.asar');
        const appPackageJson = path.join(resAppDir, 'package.json');
        const appLoaderJs = path.join(resAppDir, 'loader.js');

        if (!fs.existsSync(resAppAsar)) {
            throw new DiscordLoader.Error.InvalidAppDir();
        }

        let pkg = JSON.parse(asar.extractFile(resAppAsar, 'package.json'));
        pkg.main = path.relative(path.dirname(appPackageJson), appLoaderJs).replace(/\\/g, '/');
        fs.ensureDirSync(resAppDir);
        writeJsonSync(appPackageJson, pkg);

        const pathToRootInvoker = path.relative(path.dirname(appLoaderJs), this.invokerDir).replace(/\\/g, '/') + '/';
        const pathToPackageJson = path.relative(path.dirname(appLoaderJs), appPackageJson).replace(/\\/g, '/');

        let loaderScript = resource.readFileSync('loader-template.js');
        loaderScript = loaderScript.replace(/["']?<INVOKER>["']?/g, JSON.stringify(pathToRootInvoker));
        loaderScript = loaderScript.replace(/["']?<PACKAGE_JSON>["']?/g, JSON.stringify(pathToPackageJson));
        fs.writeFileSync(appLoaderJs, loaderScript);
    }


    /**
     * Launch discord-loader (through modified Discord App).
     * @param profile {string|null} - profile id
     * @param debug {boolean} - whether run in debug mode or not
     */
    launch(profile, debug) {
        if (!DiscordLoader.isValidProfile(profile, false)) {
            throw new DiscordLoader.Error.InvalidProfile();
        }

        const loaderConfig = {
            profile,
            debug,
            appDir: this.discordDir,
            invokerDir: this.invokerDir,
            profilesDir: this.profilesDir,
            tempDir: this.tempDir,
            userDir: this.userDir,
        };

        let prog, args;
        switch (process.platform) {
            case 'win32':
                if (!debug) {
                    prog = path.join(this.discordDir, 'Update.exe');
                    args = ['-processStart', 'Discord.exe'];
                } else {
                    const rxAppSemver = /^app-(\d+)\.(\d+)\.(\d+)/;
                    const apps = fs.readdirSync(this.discordDir).filter(dir => rxAppSemver.test(dir)).sort((a, b) => {
                        const matches = [a, b].map(dir => dir.match(rxAppSemver));
                        for (let i = 1; i <= 3; i++) {
                            const diff = parseInt(matches[1][i]) - parseInt(matches[0][i]);
                            if (diff) return diff;
                        }
                        return 0;
                    });

                    if (!apps.length) {
                        throw new DiscordLoader.Error.NoAppDirFound();
                    }

                    const latestApp = apps[0];

                    prog = path.join(this.discordDir, latestApp, 'Discord.exe');
                    args = [];
                }
                break;

            default:
                throw new DiscordLoader.Error.UnsupportedPlatform();
        }

        const proc = childProcess.spawn(prog, args, {
            env: {
                __loaderConfig: JSON.stringify(loaderConfig),
            },
        });

        return proc;
    }


    /**
     * Check if profile id is valid.
     * @param profile {string} - profile id
     * @param checkExistence {boolean} - whether check the profile actually exists or not
     * @returns {boolean} - true if valid
     */
    static isValidProfile(profile, checkExistence) {
        if (typeof profile !== 'string') {
            throw new DiscordLoader.Error.InvalidProfile();
        }

        if (!profile) return false;
        if (/^\.+$|\.$|[\/\\]/.test(profile)) return false;
        if (checkExistence && !fs.existsSync(path.join(this.profilesDir, profile))) return false;

        return true;
    }
}

DiscordLoader.Error = {
    InvalidAppDir: class{},
    NoAppDirFound: class{},
    UnsupportedPlatform: class{},
};


module.exports = DiscordLoader;
