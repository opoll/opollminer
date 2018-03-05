
/*
  Shard Logic Controller
    * Active Shards Module
  (c) 2018 OpenPoll Inc
  ==============================================================================
  This module is responsible for handling shards which are considered 'active'.
  A shard is active if both of the following conditions are true:
    (1) The shard has not hit the maximum number of responses
    (2) The shard has not ran out of time (i.e. expired)
*/

// Our module wrapper
var lib = {};

// Variable to store databases (injected by logic controller)
var databases = undefined;

/*
  This function returns a list of shards which are currently active
*/
lib.getActiveShards = function( cb ) {
  // Query the database
  databases.ShardMiner.get( 'active_shards', function( err, value ) {
    // If this key isn't set, there are no active sahrds
    if( err ) {
      return cb( [] );
    }

    // It was found
    cb( JSON.parse( value ) );
  } );
};

/*
  This function is used to record an active shard. This should
  only be called if the shard was verified to be active.
*/
lib.recordActiveShard = function( pollHash, cb ) {
  // Get the latest set of shards being mined
  lib.getActiveShards( function( activeShardsArr ) {
    // Add the value they indicated
    activeShardsArr.push( pollHash );

    // Store
    databases.ShardMiner.put( 'active_shards', JSON.stringify( activeShardsArr ), cb );
  } );
};

// Load databases and export library
module.exports = (function( _databases ) {
  databases = _databases;
  return lib;
} );
