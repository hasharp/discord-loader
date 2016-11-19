'use strict';

// This script will be invoked by `./loader.js` with `require` before the Discord App is loaded.

const path = require('path');

const electron = require('electron');
const {app, protocol} = electron;

const loaderConfig = require('./loaderconfig.js').acquire();


console.info('::: loaded', __filename);


function registerProtocol(scheme, resolveHttp, resolveFile) {
    // to enable `require` with relative path, register custom http protocol via custom file protocol

    protocol.registerStandardSchemes([scheme]);

    app.on('ready', () => {
        const internalScheme = `${scheme}-int`;

        protocol.registerFileProtocol(internalScheme, (request, callback) => {
            const file = resolveFile(scheme, request);
            callback({
                path: file,
            });
        }, error => {
            if (error) {
                throw new Error(`Failed to register custom file protocol '${scheme}'.`);
            }
        });

        protocol.registerHttpProtocol(scheme, (request, callback) => {
            const reqPath = request.url.replace(/^.+?:[./\\]*/, '');
            const resolvedReqPath = resolveHttp(reqPath);
            callback(resolvedReqPath !== reqPath ? {
                // redirect
                url: `${scheme}://${resolvedReqPath}`,
                method: 'GET',
            } : {
                // pass to internal protocol
                url: `${internalScheme}://${resolvedReqPath}`,
                method: 'GET',
            });
        }, error => {
            if (error) {
                throw new Error(`Failed to register custom http protocol '${scheme}'.`);
            }
        });
    });
}


registerProtocol('l-data', path => {
    path = path.replace(/~PROFILE~/g, loaderConfig.profile);
    return path;
}, (scheme, request) => {
    const directories = {
        user: loaderConfig.userDir,
        invoker: loaderConfig.invokerDir,
    };

    const match = request.url.match(/^.+?:[./\\]*(.*?)(?:\/(.*))?$/);
    const host = match[1];
    const file = match[2];

    if (!match[1] || !match[2]) {
        return false;
    }

    return path.join(directories[host], file);
});


require(path.join(loaderConfig.userDir, 'before.js'));
