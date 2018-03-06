
/*
  Shard Logic Controller
    * Worked Shards Module
  (c) 2018 OpenPoll Inc
  ==============================================================================
  This module is responsible for handling shards which are being worked by this
  miner.
*/

// Our module wrapper
var lib = {};

// Variable to store databases (injected by logic controller)
var databases = undefined;

/*
  This function returns a list of shards identifiers which this miner
  has elected to mine AKA work
*/
lib.getWorkedShards = function( cb ) {
  // Query the database
  databases.ShardMiner.get( 'worked_shards', function( err, value ) {
    // If this key isn't set, they aren't mining anything
    if( err ) {
      return cb( [] );
    }

    // It was found
    cb( JSON.parse( value ) );
  } );
};

/*
  This function indicates the miner has elected to mine a shard, and
  persists the pollHash associated with the shard so it can be retrieved
  later
*/
lib.persistMineShard = function( pollHash, cb ) {
  // Get the latest set of shards being mined
  lib.getWorkedShards( function( minedShardsArr ) {
    // Add the value they indicated
    minedShardsArr.push( pollHash );

    // Store
    databases.ShardMiner.put( 'worked_shards', JSON.stringify( minedShardsArr ), cb );
  } );
};

// Load databases and export library
module.exports = (function( _databases ) {
  databases = _databases;
  return lib;
} );
