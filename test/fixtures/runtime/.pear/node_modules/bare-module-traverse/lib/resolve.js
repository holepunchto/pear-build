exports.module = require('bare-module-resolve').module
exports.addon = require('bare-addon-resolve').addon

exports.default = require('./resolve/default')
exports.bare = require('./resolve/bare')
exports.node = require('./resolve/node')
