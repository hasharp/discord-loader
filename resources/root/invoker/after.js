'use strict';

// This script will be invoked by `./loader.js` with `require` after the Discord App is loaded.

const path = require('path');

const electron = require('electron');
const {app} = electron;

const loaderConfig = require('./loaderconfig.js').acquire();


console.info('::: loaded', __filename);


app.on('browser-window-created', (event, window) => {
    const webContents = window.webContents;

    // we have to observe 'did-finish-load'
    // see https://github.com/electron/electron/blob/master/lib/browser/api/web-contents.js
    webContents.on('did-finish-load', () => {
        const url = webContents.getURL();
        if (!/^https?:\/\/[\w\.-]+\/channels(\/|$)/.test(url)) return;

        const mainpageJs = path.join(loaderConfig.invokerDir, 'mainpage.js');
        webContents.executeJavaScript(`if(!window.isMainPageScriptLoaded){window.isMainPageScriptLoaded=true;require(${JSON.stringify(mainpageJs)})}`);
    });
});


require(path.join(loaderConfig.userDir, 'after.js'));
