'use strict';

// Loader Configuration Registry Service
// This is a module that user scripts can `require`.

let loaderConfig;

module.exports = {
    initialize(newLoaderConfig) {
        if (loaderConfig) return false;
        loaderConfig = newLoaderConfig;
        return true;
    },

    acquire() {
        if (!loaderConfig) return null;
        return Object.assign({}, loaderConfig);
    },
};
