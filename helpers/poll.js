
// Imports
var crypto = require('crypto');
var NodeRSA = require('node-rsa');
var schemaValidator = require('jsonschema').validate;
var helper_generic = require('./blockchain_generic');

// Helper Imports
var ShardBlockHelper = require( './shard_block' );

// Create the library
var lib = {};

// Path to a block schema
lib.POLL_SCHEMA_PATH = "/poll/poll";
lib.POLL_SCHEMA = require( "../schemas/" + helper_generic.SCHEMA_VERSION + lib.POLL_SCHEMA_PATH + ".json" );

// Percentage dedicated to the network
lib.NETWORK_FUND_PERCENT = 0.15;

/*
  Given a main chain block, this function will return true if the input
  conforms to schema and false if the schema is invalid
*/
lib.validateSchema = function( obj ) {
  return schemaValidator( obj, lib.POLL_SCHEMA );
}

// Returns if a poll is expired
lib.isExpired = function( poll ) {
  return (poll.expiry < (new Date() / 1000));
}

/*
  Provided a valid poll object, this function will create a corresponding
  genesis /shard/block for this poll. The poll genesis block is deterministic
  based off a /poll/poll object. It does not confirm to schema as schema requires
  there me at least 1 response, however, the genesis block includes 0 responses.
*/
lib.generateGenesisBlock = function( pollObj ) {
  // Hash the poll
  lib.hash( pollObj );

  // Create the genesis block
  var POLL_GENESIS_BLOCK = {
    "blockId": 0,
    "pollHash": pollObj.hash,
    "timestamp": pollObj.timestamp,
    "prevHash": "0".repeat( 64 ),
    "responses": [],
    "minerAddress": "0".repeat( 64 ),
    "nonce": 0
  };

  // Hash the genesis block
  ShardBlockHelper.hash( POLL_GENESIS_BLOCK );

  // Return the genesis block
  return POLL_GENESIS_BLOCK;
}

/*
  Returns the funding distribution of the poll
  | respondent._total = the total POL given to respondents
  | respondent.individual = POL given to an individual respondent
  | network._total = total POL spent on network costs
  | network.shard = total POL spent on all shards
  | network.shard_resp = POL given to miners per response incorporated in a shard block
  | network.mcif = the Main Chain Information Fee
*/
lib.getFundingDistribution = function( poll ) {
  var networkPartition = poll.totalFunding * lib.NETWORK_FUND_PERCENT;
  var respondentPartition = poll.totalFunding - networkPartition;

  return {
    "respondent": {
      "_total": respondentPartition,
      "individual": (respondentPartition / poll.maxRespondents)
    },
    "network": {
      "_total": networkPartition,
      "shard": networkPartition * 0.75,
      "shard_resp": (networkPartition * 0.75) / poll.maxRespondents,
      "mcif": networkPartition * 0.25
    }
  };
}

/*
  Returns a an array of ordered hash fields which are used in composing
  a hash which represents this poll
    1) timestamp
    2) expiry
    3) totalFunding
    4) maxRespondents
    5) imageId
    6) questions
*/
lib.orderedHashFields = function( poll ) {
  var arr = [
    poll.timestamp.toString(),
    poll.expiry.toString(),
    poll.totalFunding.toString(),
    poll.maxRespondents.toString(),
    poll.imageId.toString()
  ];

  // Loop through all questions in the poll and include them
  poll.questions.forEach( function( questionText ) {
    arr.push( questionText );
  } );

  return arr;
}

/*
  Returns a hash identifier of a poll
*/
lib.hash = function( poll, digestType = 'hex' ) {
  // Update the hash on the poll object
  poll.hash = helper_generic.hashFromOrderedFields( lib.orderedHashFields( poll ), digestType );

  // Return the hash
  return poll.hash;
}

// Export the library
module.exports = lib;
