'use strict';

const electron = require('electron');
const {app} = electron;

const fs = require('fs');
const path = require('path');


console.info('::: loaded', __filename);

// dump versions
console.info('process.versions:', process.versions);


const tempDir = path.join(__dirname, '../temp');
const tempJson = path.join(tempDir, 'temp.json');
const config = require(tempJson);
//fs.unlinkSync(tempJson);
// delete after update process

function loader(packageJson) {
    // get path to app.asar
    const resDir = path.join(path.dirname(packageJson), '..');
    const appAsar = path.join(resDir, 'app.asar');
    const appAsarPackageJson = path.join(appAsar, 'package.json');

    // load package.json
    const pkg = require(appAsarPackageJson);

    // modify profile dir
    if (config.profile) {
        const appDataDir = path.join(config.appDir, config.profile);
        const userDataDir = path.join(appDataDir, pkg.name || 'app');
        const tempDir = path.join(config.tempDir, config.profile);

        app.setPath('appData', appDataDir);
        app.setPath('userData', userDataDir);
        app.setPath('temp', tempDir);

        // to allow multiple instances
        // TODO: restore it later?
        app.setName(`${app.getName()} (${config.profile})`);
    }

    // hack electron.app.getAppPath()
    app.setAppPath(appAsar);

    // pre action
    require('./before.js');

    const indexJs = path.join(appAsar, pkg.main);
    // load index.js
    require(indexJs);
    // hack electron.remote.require()
    process.mainModule = require.main = require('module')._cache[indexJs];

    // post action
    require('./after.js');
}

module.exports = loader;
