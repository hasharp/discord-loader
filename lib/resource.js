'use strict';

const isRelease = require('./isrelease.js');

const fs = require('fs-extra');

const path = require('path');


const resources = isRelease && require('nexeres.js');
const resourcesDir = !isRelease && path.join(__dirname, '../resources');

module.exports = {
    /**
     * Copy resource files (./resources/*).
     * @param src  {string} - path to resource directory copy files from
     * @param dest {string} - path to directory copy files to
     */
    extractDirSync(src, dest) {
        if (isRelease) {
            const nSrc = path.normalize(src) + path.sep;
            const files = resources.keys().filter(file => file.substr(0, nSrc.length) === nSrc);
            files.forEach(file => {
                const content = resources.get(file).toString();
                fs.writeFileSync(path.join(dest, path.relative(src, file)), content);
            });
        } else {
            fs.copySync(path.join(resourcesDir, src), dest, {
                clobber: true,
            });
        }
    },

    /**
     * Read resource files (./resources/*).
     * @param src {string} - path to resource file
     * @returns {string} - content of the file (utf-8)
     */
    readFileSync(src) {
        if (isRelease) {
            return resources.get(path.normalize(src)).toString();
        } else {
            return fs.readFileSync(path.join(resourcesDir, src), 'utf-8');
        }
    },
}