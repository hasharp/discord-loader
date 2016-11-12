'use strict';

const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const asar = require('asar-lite');
const globAll = require('glob-all');
const licenseChecker = require('license-checker');
const nexe = require('nexe');


const pkg = require('./package.json');
const cpuNum = os.cpus().length;
const nodeVer = process.version.replace(/[^\d\.]/g, '');

const buildDir = path.join(__dirname, 'build');
const resDir = path.join(buildDir, 'resources');
const resFile = path.join(resDir, 'res.asar');
const outFile = path.join(buildDir, pkg.name);
const licenseFile = path.join(buildDir, 'LICENSE.md');


function addExtension(exeFile) {
    return process.platform === 'win32' ? exeFile + '.exe' : exeFile;
}

function getLicenseUrl(name, info) {
    if (!info.repository || !info.licenseFile) return false;

    const filePath = info.licenseFile.replace(/\\/g, '/').replace(/^.+\/node_modules\/.+?\//, '');

    if (/^https?:\/\/github\.com\//.test(info.repository)) {
        // assume `master` branch as default
        return info.repository.replace(/https?:\/\/github.com\//, 'https://raw.githubusercontent.com/') + '/master/' + filePath;
    }

    throw `Unknown hosting: ${info.repository} (${name})`;
}

function generateLicenseFile() {
    return new Promise((resolve, reject) => {
        let content = '';
        content += '## Third-party libraries\n';
        content += 'This app uses following libraries:\n\n';

        licenseChecker.init({
            start: __dirname,
            production: true,
            development: false,
        }, (err, obj) => {
            if (err) return reject(err);

            let libraries = {
                'Node.js': {
                    versions: [nodeVer],
                    website: 'https://nodejs.org/en/',
                    licenseName: 'MIT License',
                    licenseUrl: 'https://raw.githubusercontent.com/nodejs/node/master/LICENSE',
                },
            };

            for (const library in obj) {
                const matches = library.match(/^(.*)@(.*)$/);

                const name = matches[1];
                const version = matches[2];
                if (library.replace(/@.*$/, '') === pkg.name) continue;

                const info = obj[library];
                const licenseName = `${info.licenses} License`;
                const licenseUrl = getLicenseUrl(name, info);

                if (!libraries[name]) {
                    libraries[name] = {
                        versions: version ? [version] : [],
                        website: info.repository,
                        licenseName: licenseName,
                        licenseUrl: licenseUrl,
                    };
                } else {
                    const libObj = libraries[name];
                    if (libObj.licenseName !== licenseName) throw `License type changed (${name})`;
                    if (libObj.licenseUrl !== licenseUrl) throw `License file changed (${name})`;

                    libraries[name].versions.push(version);
                }
            }

            for (const library in libraries) {
                const libObj = libraries[library];
                const versions = libObj.versions.length ? ' ' + libObj.versions.map(v => `v${v}`).join(', ') : '';

                content += `- ${libObj.website?`[${library}](${libObj.website})`:`${library}`}${versions}  \n`;
                content += `  Released under the ${libObj.licenseUrl?`[${libObj.licenseName}](${libObj.licenseUrl})`:`${libObj.licenseName}`}.  \n\n`;
            }
            content = content.replace(/\n+$/, '\n');

            fs.writeFileSync(licenseFile, content);

            resolve();
        });
    });
}

function generateExecutables() {
    function getResourceFiles() {
        function globFiles(baseDir, masks) {
            const files = globAll.sync(masks.map(v => path.join(baseDir, v)), {
                nodir: true,
            }).map(path.normalize);
            return files;
        }

        const baseDir = __dirname;
        const files = globFiles(baseDir, [
            'indiv/**'+'/*',
            'root/**'+'/*',
        ]);

        return {
            root: baseDir,
            files: files,
        };
    }

    return new Promise((resolve, reject) => {
        const resourceFiles = getResourceFiles();

        const nexeOptions = {
            input: pkg.main,
            output: addExtension(outFile),
            python: process.env.PYTHON2 || undefined,
            framework: process.release.name,
            nodeVersion: nodeVer,
            nodeTempDir: buildDir,
            nodeConfigureArgs: [
                '--fully-static',
                '--without-npm',
                '--without-ssl',
            ],
            nodeMakeArgs: [
                '-j', cpuNum * 2,
                '--loglevel', 'info',
            ],
            nodeVCBuildArgs: [
                process.env.platform || 'x86',
                'release',
                'nosign',
            ],
            flags: true,
            resourceRoot: resourceFiles.root,
            resourceFiles: resourceFiles.files,
        };

        console.log('nexeOptions:');
        console.dir(nexeOptions);

        nexe.compile(nexeOptions, err => {
            err ? reject(err) : resolve();
        });
    });
}


function generate() {
    fs.ensureDirSync(buildDir);

    generateLicenseFile()
    .then(generateExecutables)
    .catch(err => {
        console.error(err);
    });
}

generate();
