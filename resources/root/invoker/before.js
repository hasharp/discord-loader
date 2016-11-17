'use strict';

// This script will be invoked by `./loader.js` with `require` before the Discord App is loaded.

const path = require('path');

const electron = require('electron');
const {app, protocol} = electron;

const loaderConfig = require('./loaderconfig.js').acquire();


console.info('::: loaded', __filename);


function registerProtocol(scheme, func) {
    // to enable `require` with relative path, register custom http protocol via custom file protocol

    protocol.registerStandardSchemes([scheme]);

    app.on('ready', () => {
        const internalScheme = `${scheme}-int`;

        protocol.registerFileProtocol(internalScheme, (request, callback) => {
            const file = func(scheme, request);
            console.log(internalScheme, request, file);
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


registerProtocol('l-data', (scheme, request) => {
    const directories = {
        user: loaderConfig.userDir,
        invoker: loaderConfig.invokerDir,
    };

    let reqPath = request.url.replace(/^[^:]+:[\.\/\\]*/, '');
    reqPath = reqPath.replace(/~PROFILE~/g, loaderConfig.profile);

    const match = reqPath.match(/^(.*?)(?:\/(.*))?$/);
    const host = match[1];
    const file = match[2];

    if (!match[1] || !match[2]) {
        return false;
    }

    return path.join(directories[host], file);
});


require(path.join(loaderConfig.userDir, 'before.js'));
