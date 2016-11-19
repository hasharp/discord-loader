'use strict';

const fs = require('fs');


module.exports = {
    /**
     * Writes data to file synchronously in JSON format.
     * @param {string} file - filename
     * @param {Object} data - data
     */
    writeJsonSync(file, data) {
        fs.writeFileSync(file, JSON.stringify(data, null, '  '));
    },
};
