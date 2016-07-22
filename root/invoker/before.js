'use strict';

const path = require('path');

const electron = require('electron');
const {app} = electron;

const info = require('./info.js').acquire();


const invokerDir = __dirname;
const userDir = path.join(__dirname, '../user');


console.info('::: loaded', __filename);


function registerProtocol(scheme, func) {
    app.on('ready', () => {
        // move to head when electron becomes >= v1.0.2
        const {protocol} = electron;

        protocol.registerFileProtocol(scheme, (request, callback) => {
            const file = func(scheme, request);
            callback({
                path: file,
            });
        }, error => {
            if (error) {
                console.error(`Failed to register protocol '${scheme}'`);
            }
        });

        protocol.registerStandardSchemes([scheme]);
    });
}

function createManipulater(baseDir) {
    return (scheme, request) => {
        let file = request.url.replace(/^[^:]+:[\.\/\\]*/, '');
        file = file.replace(/~PROFILE~/g, info.profile);
        return path.join(baseDir, file);
    };
}

//registerProtocol('l-invoker', createManipulater(invokerDir));
registerProtocol('l-user', createManipulater(userDir));


const userBeforeJs = path.join(userDir, 'before.js');
require(userBeforeJs);
