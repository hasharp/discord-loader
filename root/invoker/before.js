'use strict';

// This script will be invoked by `./loader.js` with `require` before the Discord App is loaded.

const path = require('path');

const electron = require('electron');
const {app, protocol} = electron;

const info = require('./info.js').acquire();


const invokerDir = __dirname;
const userDir = path.join(__dirname, '../user');


console.info('::: loaded', __filename);


function registerProtocol(scheme, func) {
    // to enable `require` with relative path, register custom http protocol via custom file protocol

    protocol.registerStandardSchemes([scheme]);

    app.on('ready', () => {
        const internalScheme = `${scheme}-int`;

        protocol.registerFileProtocol(internalScheme, (request, callback) => {
            console.log(internalScheme, request);
            const file = func(scheme, request);
            callback({
                path: file,
            });
        }, error => {
            if (error) {
                console.error(`Failed to register protocol '${scheme}'`);
            }
        });

        protocol.registerHttpProtocol(scheme, (request, callback) => {
            const reqPath = request.url.replace(/^[^:]+:[\.\/\\]*/, '');
            console.log(scheme, request, reqPath);
            callback({
                url: `${internalScheme}://${reqPath}`,
                method: 'GET',
            });
        });
    });
}


const directories = {
    'user': userDir,
    'invoker': invokerDir,
};

registerProtocol('l-data', (scheme, request) => {
    let reqPath = request.url.replace(/^[^:]+:[\.\/\\]*/, '');
    reqPath = reqPath.replace(/~PROFILE~/g, info.profile);

    const match = reqPath.match(/^(.*?)(?:\/(.*))?$/);
    const host = match[1];
    const file = match[2];

    if (!match[1] || !match[2]) {
        return false;
    }

    const baseDir = directories[host];
    return path.join(baseDir, file);
});


const userBeforeJs = path.join(userDir, 'before.js');
require(userBeforeJs);
