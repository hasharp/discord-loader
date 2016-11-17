/* eslint-env browser */
'use strict';

// ! Renderer Process Side Script
// This script will be invoked by `./after.js` with `require` through `contents.executeJavaScript`.

(function() {

    const path = require('path');
    const mod = require('module');

    const electron = require('electron');
    const {remote} = electron;
    const {webFrame} = electron;


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


    const userDir = path.join(__dirname, '../user');
    process.env.NODE_PATH += path.delimiter + userDir;
    mod.Module._initPaths();


    window.discordLoader = {
        info: remote.require(path.join(__dirname, 'info.js')).acquire(),
    };


    // custom protocols are registered in `./before.js`
    [
        'l-data',
    ].forEach(scheme => {
        webFrame.registerURLSchemeAsSecure(scheme);
        //webFrame.registerURLSchemeAsBypassingCSP(scheme);
    });

    loadStylesheet('l-data://user/mainpage.css');
    loadScript('l-data://user/mainpage.js');

})();