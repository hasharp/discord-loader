'use strict';

const fs = require('fs');


module.exports = {
    /**
     * Writes data to file synchronously in JSON format.
     * @param file {string} - filename
     * @param data {Object} - data
     */
    writeJsonSync(file, data) {
        fs.writeFileSync(file, JSON.stringify(data, null, '  '));
    },
};
