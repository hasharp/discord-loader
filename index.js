'use strict';

const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');

const asar = require('asar');
const minimist = require('minimist');


const argv = minimist(process.argv.slice(2), {
    default: {
        appdir: false,          // required
        profile: 'default',
    },
});
const {appdir, profile} = argv;

if (!appdir) {
    console.log('Usage: discord-loader --appdir /path/to/Discord/ [--profile profilename]');
    process.exit(1);
}


const rootLoaderDir = path.join(appdir, 'loader');
const invokerDir = path.join(rootLoaderDir, 'invoker');
const userDir = path.join(rootLoaderDir, 'user');
const profileDir = path.join(rootLoaderDir, 'profiles');
const tempDir = path.join(rootLoaderDir, 'temp');

const tempJson = path.join(tempDir, 'temp.json');
const rootLoaderJs = path.join(invokerDir, 'loader.js');


function writeJsonSync(file, data) {
    return fs.writeFileSync(file, JSON.stringify(data, null, '  '));
}

function initialize() {
    try {
        fs.accessSync(rootLoaderDir, fs.F_OK);
        return;
    } catch(e) {}

    fs.copySync(path.join(__dirname, 'root'), rootLoaderDir, {
        clobber: true,
    });

    fs.ensureDirSync(profileDir);
    fs.ensureDirSync(tempDir);
}

function update() {
    fs.copySync(path.join(__dirname, 'root/invoker'), invokerDir, {
        clobber: true,
    });
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

    let loaderScript = fs.readFileSync(path.join(__dirname, 'indiv/loader.js'), 'utf-8')
    loaderScript = loaderScript.replace(/<LOADER_JS>/g, JSON.stringify(pathToRootLoaderJs));
    loaderScript = loaderScript.replace(/<PACKAGE_JSON>/g, JSON.stringify(pathToPackageJson));
    fs.writeFileSync(appLoaderJs, loaderScript);
}


function launchDiscord(appDir, profile) {
    const config = {
        profile: profile,
        appDir: profileDir,
        tempDir: tempDir,
    };
    writeJsonSync(tempJson, config);

    let prog, args;
    switch (os.platform()) {
        case 'win32':
            //*
            prog = 'Update.exe';
            args = ['-processStart', 'Discord.exe'];
            /*/
            prog = 'app-0.0.292/Discord.exe';
            //*/
            break;

        default:
            throw 'Unsupported platform';
    }

    childProcess.execFile(path.join(appDir, prog), args, (error, stdout, stderr) => {
        if (error) {
            throw error;
        }
        console.log(stdout);
        console.error(stderr);
    });
}


initialize();
update();

const apps = fs.readdirSync(appdir).filter(dir => /^app-/.test(dir));
apps.forEach(dir => {
    modify(path.join(appdir, dir));
});

launchDiscord(appdir, profile);
