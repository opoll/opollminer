
// Imports
var crypto = require('crypto');
var NodeRSA = require('node-rsa');
var schemaValidator = require('jsonschema').validate;
var helper_generic = require('./blockchain_generic');

// Create the library
var lib = {};

// Path to a block schema
lib.BLOCK_SCHEMA_PATH = "/poll/poll";
lib.BLOCK_SCHEMA = require( "../schemas/" + helper_generic.SCHEMA_VERSION + lib.BLOCK_SCHEMA_PATH + ".json" );

// Export the library
module.exports = lib;
