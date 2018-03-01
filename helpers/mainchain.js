
// Imports
var crypto = require('crypto');
var schemaValidator = require('jsonschema').validate;

// Create the library
var mainchainHelpers = {};

// Path to a block schema
mainchainHelpers.BLOCK_SCHEMA_PATH = "/mainchain/block";
mainchainHelpers.BLOCK_SCHEMA = require( "../schemas/0.1" + mainchainHelpers.BLOCK_SCHEMA_PATH + ".json" );

/*
  Given a main chain block, this function will return true if the input
  conforms to schema and false if the schema is invalid
*/
mainchainHelpers.validateBlockSchema = function( mainChainBlock ) {
  return schemaValidator( mainChainBlock, mainchainHelpers.BLOCK_SCHEMA );
}

/*
  Produces a hash for a block on the mainchain
  DO NOT USE THIS FOR MINING, VERY SLOW
*/
mainchainHelpers.computeBlockHash = function( mainChainBlock, digestType = "hex" ) {
  // Create HMAC with basic block information
  var hmac = crypto.createHmac( 'sha256', '' )
            .update( mainChainBlock.blockId.toString() )
            .update( mainChainBlock.timestamp.toString() )
            .update( mainChainBlock.prevHash )
            .update( mainChainBlock.minerAddress )
            .update( mainChainBlock.difficulty.toString() );

  // Update the HMAC with transaction data
  // TODO

  // Update the HMAC with shard data
  // TODO

  // Add the nonce (if it exists)
  if( mainChainBlock.nonce && (mainChainBlock.nonce.toString() != "0") )
    hmac = hmac.update( mainChainBlock.nonce.toString() );

  // Grab a hex digest and return
  return hmac.digest( digestType );
}

// Export the library
module.exports = mainchainHelpers;
