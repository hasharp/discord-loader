'use strict';

// This script will be invoked by `./loader.js` with `require` after the Discord App is loaded.

const path = require('path');

const electron = require('electron');
const {BrowserWindow} = electron;

const loaderConfig = require('./loaderconfig.js').acquire();


console.info('::: loaded', __filename);


function checkFunc() {
    const mainpageJs = path.join(loaderConfig.invokerDir, 'mainpage.js');

    BrowserWindow.getAllWindows().forEach(window => {
        const contents = window.webContents;
        const url = contents.getURL();

        if (/^https?:\/\/[\w\.-]+\/channels(\/|$)/.test(url)) {
            contents.executeJavaScript(`if(!window.isScriptLoaded){window.isScriptLoaded=true;require(${JSON.stringify(mainpageJs)})}`);
        }
    });
}

(function monitorWebpage() {
    checkFunc();
    setTimeout(monitorWebpage, 1000);
})();


require(path.join(loaderConfig.userDir, 'after.js'));
