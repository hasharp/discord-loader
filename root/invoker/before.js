'use strict';

const path = require('path');

const electron = require('electron');
const {app} = electron;


const invokerDir = __dirname;
const userDir = path.join(__dirname, '../user');


console.info('::: loaded', __filename);


function registerProtocol(scheme, baseDir) {
    app.on('ready', () => {
        // move to head when electron becomes >= v1.0.2
        const {protocol} = electron;

        protocol.registerFileProtocol(scheme, (request, callback) => {
            const file = request.url.substr(scheme.length).replace(/^:[\.\/\\]*/, '');
            console.log(baseDir, file);
            console.log(path.join(baseDir, file));
            callback({
                path: path.join(baseDir, file),
            });
        }, error => {
            if (error) {
                console.error(`Failed to register protocol '${scheme}'`);
            }
        });
    });
}

//registerProtocol('l-invoker', invokerDir);
registerProtocol('l-user', userDir);


const userBeforeJs = path.join(userDir, 'before.js');
require(userBeforeJs);
