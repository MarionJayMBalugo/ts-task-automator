// src/main/cnf/index.js

/**
 * CONFIGURATION BARREL FILE
 * Aggregates all constants and settings into a single importable module.
 */
module.exports = {
    ...require('./app'),
    ...require('./const'),
    ...require('./net'),
    ...require('./tools'),
    ...require('./sys'),
    ...require('./msgs')
};