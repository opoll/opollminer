
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
  Returns an array of ordered hash fields which are used in creating the
  hash for this specific shard block object. Set ignoreNonce to true if
  you do not want the nonce included in the set.
    * blockId
    * pollHash
    * timestamp
    * prevHash
    * responses
    * minerAddress
    * nonce
*/
lib.orderedHashFields = function( shardBlockObj, ignoreNonce = false ) {
  var arr = [
    shardBlockObj.blockId.toString(),
    shardBlockObj.pollHash,
    shardBlockObj.timestamp.toString(),
    shardBlockObj.prevHash,
    shardBlockObj.minerAddress
  ];

  // Hash the responses and add those
  arr.push( helper_poll_response.hashResponses( shardBlockObj.responses ) );

  // If we aren't ignoring the nonce, add it
  if( ignoreNonce !== false ) {
    arr.push( shardBlockObj.nonce.toString() );
  }

  return arr;
}

/*
  Hashes the provided shard block, and returns the hash
*/
lib.hash = function( shardBlockObj, ignoreNonce = false, digestType = "hex" ) {
  // Get the ordered hash fields
  var hashFields = lib.orderedHashFields( shardBlockObj, ignoreNonce );

  // Update the hash on the poll object
  shardBlockObj.hash = helper_generic.hashFromOrderedFields( hashFields, digestType );

  // Return the hash
  return shardBlockObj.hash;
}

/*
  Returns true if a given shard block is the genesis block
*/
lib.isGenesis = function( shardBlockObj ) {
  return ( shardBlockObj.prevHash === "0".repeat(64) );
}

/*
  Returns the number of responses in a given block
*/
lib.responseCount = function( shardBlockObj ) {
  return shardBlockObj.responses.length;
}

// Export the library
module.exports = lib;
