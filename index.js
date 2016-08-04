#!/usr/bin/env node
'use strict';

const childProcess = require('child_process');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const asar = require('asar-lite');
const minimist = require('minimist');

const isRelease = !process.mainModule;
const resources = isRelease && require('nexeres.js');


const argv = minimist(process.argv.slice(2), {
    default: {
        appdir: false,          // required
        profile: 'default',
        debug: false,
    },
});
const {appdir, profile, debug} = argv;

if (debug) {
    console.info('debug mode enabled.');
    console.info('\nargv:');
    console.dir(argv);
    console.info('\nresources:');
    console.dir(resources && resources.keys());
    console.info('\nprocess:');
    console.dir(process);
    console.info(`\n__dirname: ${__dirname}\n__filename: ${__filename}`);
    console.log('\n');
}

if (!appdir) {
    console.log('Usage: discord-loader --appdir /path/to/Discord/ [--profile profilename] [--debug]');
    process.exit(1);
}


const rootLoaderDir = path.join(appdir, 'loader');
const invokerDir = path.join(rootLoaderDir, 'invoker');
const userDir = path.join(rootLoaderDir, 'user');
const profileDir = path.join(rootLoaderDir, 'profiles');
const tempDir = path.join(rootLoaderDir, 'temp');

const sessionJson = path.join(tempDir, 'session.json');
const rootLoaderJs = path.join(invokerDir, 'loader.js');


function writeJsonSync(file, data) {
    return fs.writeFileSync(file, JSON.stringify(data, null, '  '));
}

function extractResourceDirSync(src, dest) {
    if (isRelease) {
        const nSrc = path.normalize(src);
        const files = resources.keys().filter(file => file.substr(0, nSrc.length) === nSrc);
        files.forEach(file => {
            const content = resources.get(file).toString();
            fs.writeFileSync(path.join(dest, path.relative(src, file)), content);
        });
    } else {
        fs.copySync(path.join(__dirname, src), dest, {
            clobber: true,
        });
    }
}

function readResourceSync(src) {
    if (isRelease) {
        return resources.get(path.normalize(src)).toString();
    } else {
        return fs.readFileSync(path.join(__dirname, src), 'utf-8');
    }
}


function initialize() {
    try {
        fs.accessSync(rootLoaderDir, fs.F_OK);
        return;
    } catch(e) {}

    extractResourceDirSync('root', rootLoaderDir);

    fs.ensureDirSync(profileDir);
    fs.ensureDirSync(tempDir);
}

function update() {
    extractResourceDirSync('root/invoker', invokerDir);
}

function modify(progDir) {
    const resDir = path.join(progDir, 'resources');
    const resAppDir = path.join(resDir, 'app');
    const resAppAsar = path.join(resDir, 'app.asar');
    const appPackageJson = path.join(resAppDir, 'package.json');
    const appLoaderJs = path.join(resAppDir, 'loader.js');

    try {
        fs.accessSync(resAppAsar, fs.F_OK);
    } catch (e) {
        return;
    }

    let pkg = JSON.parse(asar.extractFile(resAppAsar, 'package.json'));
    pkg.main = path.relative(path.dirname(appPackageJson), appLoaderJs).replace(/\\/g, '/');
    fs.ensureDirSync(resAppDir);
    writeJsonSync(appPackageJson, pkg);

    const pathToRootLoaderJs = path.relative(path.dirname(appLoaderJs), rootLoaderJs).replace(/\\/g, '/');
    const pathToPackageJson = path.relative(path.dirname(appLoaderJs), appPackageJson).replace(/\\/g, '/');

    let loaderScript = readResourceSync('indiv/loader.js');
    loaderScript = loaderScript.replace(/<LOADER_JS>/g, JSON.stringify(pathToRootLoaderJs));
    loaderScript = loaderScript.replace(/<PACKAGE_JSON>/g, JSON.stringify(pathToPackageJson));
    fs.writeFileSync(appLoaderJs, loaderScript);
}


function launchDiscord(appDir, profile) {
    try {
        fs.accessSync(sessionJson, fs.F_OK);
        console.error('Another discord-loader is in-progress, please try again later.');
        console.error(`If the problem persists, please delete file "${sessionJson}".`);
        return;
    } catch (e) {}

    const config = {
        profile: profile,
        appDir: profileDir,
        tempDir: tempDir,
        debug: debug,
    };
    writeJsonSync(sessionJson, config);

    let prog, args;
    switch (os.platform()) {
        case 'win32':
            if (!debug) {
                prog = 'Update.exe';
                args = ['-processStart', 'Discord.exe'];
            } else {
                const rxSemver = /^app-(\d+)\.(\d+)\.(\d+)$/;
                const apps = fs.readdirSync(appDir).filter(v => rxSemver.test(v)).sort((a, b) => {
                    const matches = [a, b].map(v => v.match(rxSemver));
                    for (let i = 1; i <= 3; i++) {
                        const diff = parseInt(matches[1][i]) - parseInt(matches[0][i]);
                        if (diff) return diff;
                    }
                    return 0;
                });

                if (!apps.length) {
                    throw 'No apps found.';
                }

                const latestApp = apps[0];
                console.log(`latest app: ${latestApp}`);

                prog = path.join(latestApp, 'Discord.exe');
            }
            break;

        default:
            throw 'Unsupported platform';
    }

    prog = path.join(appDir, prog);
    const proc = childProcess.spawn(prog, args);
    ['stdout', 'stderr'].forEach(intf => {
        proc[intf].pipe(process[intf]);
    });
    proc.on('exit', code => {
        console.log(`Child exited with code ${code}`);
        setTimeout(() => {
            process.exit(code);
        }, debug ? 3000 : 100);
    });
}


initialize();
update();

const apps = fs.readdirSync(appdir).filter(dir => /^app-/.test(dir));
apps.forEach(dir => {
    modify(path.join(appdir, dir));
});

launchDiscord(appdir, profile);
