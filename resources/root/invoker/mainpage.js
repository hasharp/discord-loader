/* eslint-env browser */
'use strict';

// ! Renderer Process Side Script
// This script will be invoked by `./after.js` with `require` through `contents.executeJavaScript`.

const path = require('path');
const mod = require('module');

const electron = require('electron');
const {remote, webFrame} = electron;

const loaderConfig = remote.require(path.join(__dirname, 'loaderconfig.js')).acquire();


console.info('::: loaded', __filename);


// set require path
const userDir = path.join(__dirname, '../user');
process.env.NODE_PATH += path.delimiter + userDir;
mod.Module._initPaths();


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


// inject stylesheet and script
function loadUserFiles() {
    function loadStylesheet(file) {
        const head = document.getElementsByTagName('head')[0];
        let link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = file;
        head.appendChild(link);
    }

    function loadScript(file) {
        let script = document.createElement('script');
        script.src = file;
        document.body.appendChild(script);
    }

    loadStylesheet('l-data://user/mainpage.css');
    loadScript('l-data://user/mainpage.js');
}

if (document.readyState === 'complete') {
    loadUserFiles();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        loadUserFiles();
    });
}
