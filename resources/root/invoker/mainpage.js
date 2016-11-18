/* eslint-env browser */
'use strict';

// ! Renderer Process Side Script
// This script will be invoked by `./after.js` with `require` through `contents.executeJavaScript`.

const path = require('path');

const electron = require('electron');
const {remote, webFrame} = electron;

const loaderConfig = remote.require(path.join(__dirname, 'loaderconfig.js')).acquire();


console.info('::: loaded', __filename);


// set window.discordLoader
window.discordLoader = {
    loaderConfig,
};


// assume custom protocol as secure
// note: custom protocols are registered in `./before.js`
[
    'l-data',
].forEach(scheme => {
    webFrame.registerURLSchemeAsSecure(scheme);
    //webFrame.registerURLSchemeAsBypassingCSP(scheme);
});


// inject user stylesheet
function injectUserFiles() {
    function injectStylesheet(file) {
        const head = document.getElementsByTagName('head')[0];
        let link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = file;
        head.appendChild(link);
    }

    injectStylesheet('l-data://user/mainpage.css');
}

if (document.readyState === 'complete') {
    injectUserFiles();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        injectUserFiles();
    });
}


// load user script (call asynchronously)
setImmediate(() => {
    require(path.join(loaderConfig.userDir, 'mainpage.js'));
});
