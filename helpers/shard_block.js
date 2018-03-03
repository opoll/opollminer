
// Imports
var crypto = require('crypto');
var NodeRSA = require('node-rsa');
var schemaValidator = require('jsonschema').validate;
var helper_generic = require('./blockchain_generic');
var helper_poll_response = require('./poll_response');

// Create the library
var lib = {};

// Path to a block schema
lib.BLOCK_SCHEMA_PATH = "/shard/block";
lib.BLOCK_SCHEMA = require( "../schemas/" + helper_generic.SCHEMA_VERSION + lib.BLOCK_SCHEMA_PATH + ".json" );

/*
  Given a main chain block, this function will return true if the input
  conforms to schema and false if the schema is invalid
*/
lib.validateSchema = function( obj ) {
  return schemaValidator( obj, lib.BLOCK_SCHEMA );
}

/*
  This function produces a hash representing this shard block
  A shard block hash includes the following fields:
    * blockId
    * pollHash
    * timestamp
    * prevHash
    * responses
    * minerAddress
    * nonce
*/
lib.hash = function( shardBlockObj, digestType = "hex" ) {
  // Create HMAC with basic block information
  var hmac = crypto.createHmac( 'sha256', '' )
            .update( shardBlockObj.blockId )
            .update( shardBlockObj.pollHash )
            .update( shardBlockObj.timestamp )
            .update( shardBlockObj.prevHash )
            .update( helper_poll_response.hashResponses( shardBlockObj.responses ) )
            .update( shardBlockObj.minerAddress )
            .update( shardBlockObj.nonce );

  // Grab a hex digest and return
  return hmac.digest( digestType );
}

/*
  Returns true if a given shard block is the genesis block
*/
lib.isGenesis = function( shardBlockObj ) {
  return ( shardBlockObj.prevHash == "0".repeat(64) );
}

/*
  Returns the number of responses in a given block
*/
lib.responseCount = function( shardBlockObj ) {
  return shardBlockObj.responses.length;
}

// Export the library
module.exports = lib;
