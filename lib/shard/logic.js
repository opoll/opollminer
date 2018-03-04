
/*
  Shard Logic controller
  (c) 2018 OpenPoll Inc
  ==============================================================================
  The shard logic controller is responsible for handling all miner level node
  logic for the miner. It does not directly perform networking outside of calls
  to other libraries, and relies heavily on shard helper libraries. This logic
  controller is also responsible for handling all local data storage interactions
  including mem, HD, and remote data pulls.
*/

// External Libraries
var http = require('http');
var level = require('level');

// Helpers
var PollHelper = require('../../helpers/poll');
var ShardBlockHelper = require('../../helpers/shard_block');

/*
  Databases
  -------------
  The shard logic controller keeps an active and open connection to
  all relevant database references due to the high and sporratic volume.
  No other libraries should conflict with these references.
  NOTE: these references are local to prevent direct access
*/
var DB_ShardMiner, DB_Shards, DB_ShardBlocks;

if( process.env.AUTOMATED_TESTING ) {
  console.log( "** USING AUTOMATED TESTING DATABASES" );
  DB_ShardMiner = level( './db/automated_testing/shard_miner' ); // General miner K-V Store
  DB_Shards = level( './db/automated_testing/shards' ); // Maps: pollHash -> /shard/shard
  DB_ShardBlocks = level( './db/automated_testing/shard_blocks' ); // Maps: blockHash -> /shard/block
} else {
  DB_ShardMiner = level( './db/shard_miner' ); // General miner K-V Store
  DB_Shards = level( './db/shards' ); // Maps: pollHash -> /shard/shard
  DB_ShardBlocks = level( './db/shard_blocks' ); // Maps: blockHash -> /shard/block
}

// The controller
var controller = {};

/*
  This function returns the /shard/shard object associated
  with a provided poll. If this miner client has not preloaded the provided
  poll then the function terminates with false.
*/
controller.localGetShard = function( pollHash, cb ) {
  // Query the database
  DB_Shards.get( pollHash, function( err, value ) {
    // If it wasn't found..
    if( err ) {
      return cb( false );
    }

    // It was found
    cb( JSON.parse( value ) );
  } );
};

/*
  Given a shard object, this function soft validates that the shard has a valid
  identifier and throws an error if there is no identifier.
*/
controller.pullShardIdentifier = function( shardObject ) {
  // Ensure the poll hash field exists (soft validation)
  if( shardObject.pollHash === undefined ) {
    throw {
      name: "InvalidShard",
      message: "the provided shard did not have a poll hash identifier and could not be stored"
    };
  }

  // Return the identifier
  return shardObject.pollHash;
}

/*
  Given a validated shard, this function saves the shard locally
*/
controller.localStoreValidShard = function( shardObject, cb ) {
  DB_Shards.put( controller.pullShardIdentifier( shardObject ), JSON.stringify( shardObject ), cb );
};

/*
  Given an associated pollHash this function terminates any and all
  data associated with the pollHash
*/
controller.wipePollShard = function( shardObject, cb ) {
  // TODO: Delete all other associated data

  // Delete the reference in DB:/shards
  DB_Shards.del( controller.pullShardIdentifier( shardObject ), cb );
};

module.exports = controller;
