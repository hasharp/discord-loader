'use strict';

// Loader Configuration Registry Service
// This is a module that user scripts can `require`.

let loaderConfig;

module.exports = {
    initialize: newLoaderConfig => loaderConfig ? false : (loaderConfig = newLoaderConfig, true),
    acquire: () => loaderConfig ? Object.assign({}, loaderConfig) : null,
};
