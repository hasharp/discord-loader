'use strict';

// Information Registry Service
// This is a module that user scripts can `require`.

let info;

module.exports = {
    initialize: newInfo => info ? false : (info = newInfo, true),
    acquire: () => info ? Object.assign({}, info) : null,
};
