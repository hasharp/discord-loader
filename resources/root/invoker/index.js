'use strict';

// This script will be invoked by `/app-*.*.*/resources/app/loader.js` (`../../loader-template.js`) with `require`.

const electron = require('electron');
const {app} = electron;

const fs = require('fs');
const Module = require('module');
const path = require('path');


console.info('::: loaded', __filename);

// dump versions
console.info('process.versions:', process.versions);

/*
// dump arguments
console.info('process.argv:', process.argv);

// dump environment variables
console.info('process.env:', process.env);
//*/


function writeJsonSync(file, data) {
    return fs.writeFileSync(file, JSON.stringify(data, null, '  '));
}


// load session data (from environment variable or file)
const lastSessionJson = path.join(__dirname, '../temp/lastsession.json');

let loaderConfig;

if (process.env.__loaderConfig) {
    loaderConfig = JSON.parse(process.env.__loaderConfig);
} else if (fs.existsSync(lastSessionJson)) {
    loaderConfig = require(lastSessionJson);
    fs.unlinkSync(lastSessionJson);
} else {
    console.error(`Failed to load session file:\n  ${lastSessionJson}`);
    process.exit(-1);
}

require('./loaderconfig.js').initialize(loaderConfig);


const profile = loaderConfig.profile;

if (profile) {
    process.on('exit', () => {
        // for app restarting invoked by app updating or something
        writeJsonSync(lastSessionJson, loaderConfig);
    });
}


function loader(packageJson) {
    if (!profile) {
        // TODO
        throw 'No profile specified';
    }

    // get path to app.asar
    const resDir = path.join(path.dirname(packageJson), '..');
    const appAsar = path.join(resDir, 'app.asar');
    const appAsarPackageJson = path.join(appAsar, 'package.json');

    // load package.json
    const pkg = require(appAsarPackageJson);

    // modify profile dir
    if (profile) {
        const appDataDir = path.join(loaderConfig.profilesDir, profile);
        const userDataDir = path.join(appDataDir, pkg.name || 'app');
        const tempDir = path.join(loaderConfig.tempDir, profile);

        app.setPath('appData', appDataDir);
        app.setPath('userData', userDataDir);
        app.setPath('temp', tempDir);

        // to allow multiple instances, change app name
        // TODO: restore it later?
        app.setName(`${app.getName()} (${profile})`);
    }

    // hack electron.app.getAppPath()
    app.setAppPath(appAsar);

    // pre action
    require('./before.js');

    // load app
    Module._load(appAsar, module, true);

    // post action
    require('./after.js');
}

module.exports = loader;
