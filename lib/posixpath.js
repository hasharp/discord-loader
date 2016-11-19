'use strict';

const path = require('path');


if (path.sep === path.posix.sep) {
    module.exports = p => p;
} else {
    module.exports = p => {
        if (typeof p !== 'string') return p;
        return p.split(path.sep).join(path.posix.sep);
    }
}
