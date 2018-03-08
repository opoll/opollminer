
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
lib.getWorkedShards = function() {
  return new Promise( function( resolve ) {

    // Query the database
    databases.ShardMiner.get( 'worked_shards', function( err, value ) {
      // If this key isn't set, they aren't mining anything
      if( err ) {
        return resolve( [] );
      }

      // It was found
      resolve( JSON.parse( value ) );
    } );

  } );
};

/*
  This function indicates the miner has elected to mine a shard, and
  persists the pollHash associated with the shard so it can be retrieved
  later
*/
lib.persistMineShard = function( pollHash ) {
  return new Promise( async function( resolve ) {
    // Get the latest set of shards being mined
    var minedShardsArr = await lib.getWorkedShards();

    // Add the value they indicated
    minedShardsArr.push( pollHash );

    // Store
    databases.ShardMiner.put( 'worked_shards', JSON.stringify( minedShardsArr ), function() {
      resolve();
    } );
  } );
};

// Load databases and export library
module.exports = (function( _databases ) {
  databases = _databases;
  return lib;
} );
