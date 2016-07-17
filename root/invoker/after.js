'use strict';

const fs = require('fs');
const path = require('path');

const electron = require('electron');
const {app, BrowserWindow} = electron;


const invokerDir = path.join(__dirname);
const userDir = path.join(__dirname, '../user');
const tempDir = path.join(__dirname, '../temp');

const mainpageJs = path.join(invokerDir, 'mainpage.js');
const tempJson = path.join(tempDir, 'temp.json');


console.info('::: loaded', __filename);


let isTempFileDeleted = false;

function checkFunc() {
    const windows = BrowserWindow.getAllWindows();

    windows.forEach(window => {
        const contents = window.webContents;
        const url = contents.getURL();

        if (/^https?:\/\/[\w\.-]+\/channels(\/|$)/.test(url)) {
            contents.executeJavaScript(`if(!window.isScriptLoaded){window.isScriptLoaded=true;require(${JSON.stringify(mainpageJs)})}`);
        }
        if (/^https?:/.test(url)) {
            // update process finished
            if (!isTempFileDeleted) {
                fs.unlinkSync(tempJson);
                isTempFileDeleted = true;
            }
        }
    });
}

(function monitorWebpage() {
    checkFunc();
    setTimeout(monitorWebpage, 1000);
})();


const userAfterJs = path.join(userDir, 'after.js');
require(userAfterJs);
