'use strict';

let info;

module.exports = {
    initialize: newInfo => info ? false : (info = newInfo, true),
    acquire: () => info ? Object.assign({}, info) : null,
};
