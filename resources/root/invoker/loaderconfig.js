'use strict';

// Loader Configuration Registry Service
// This is a module that user scripts can `require`.

let loaderConfig;

module.exports = {
    /**
     * Set loaderConfig.
     * @param {loaderConfig} newLoaderConfig - loaderConfig
     * @returns {boolean} - true if successful
     */
    initialize(newLoaderConfig) {
        if (loaderConfig) return false;
        loaderConfig = newLoaderConfig;
        return true;
    },

    /**
     * Returns stored loaderConfig.
     * @returns {loaderConfig|undefined} - loaderConfig if there is, undefined if not.
     */
    acquire() {
        if (!loaderConfig) return undefined;
        return Object.assign({}, loaderConfig);
    },
};
