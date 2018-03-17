
/*
  Shard Logic Controller
    * Worked Shards Module
  (c) 2018 OpenPoll Inc
  ==============================================================================
  This module is responsible for handling shards which are being worked by this
  miner.
*/
var ShardNetworkModule = require('./net');
const axios = require("axios");
var hook = require("../hook");

// Our module wrapper
var lib = {};

// Controller Access
var ShardLogicController = undefined;

// Variable to store databases (injected by logic controller)
var databases = undefined;

/*
  This function performs a hard verification of recorded worked shards against what
  shards are active for mining, and removes all inactive shards from worked shards
  Returns a promise which provides a list of the cleansed and worked shards.
*/
lib.hardCleanseWorkedShards = function() {
  console.log( "removing all inactive shards from worker queue" );

  return new Promise( async function( resolve ) {
    // Get a list of active shards
    var activeShardsMap = await ShardLogicController.ActiveShardsModule.fetchActiveShards();
    console.log( "fetched " + Object.keys( activeShardsMap ).length + " active shard(s)" );
    console.log(activeShardsMap);
    // Get all worked shards
    var workedShards = await lib.getWorkedShards();

    // Remove all worked shards that are inactive
    var newWorkedShards = [];

    workedShards.forEach( function( workedShardPollId ) {
      if( activeShardsMap[ workedShardPollId ] !== undefined ) {
        newWorkedShards.push( workedShardPollId );
      }
    } );

    // Save the new list of updated shards
    databases.ShardMiner.put( 'worked_shards', JSON.stringify( newWorkedShards ), function() {
      resolve( {
        beforeCnt: workedShards.length,
        afterCnt: newWorkedShards.length
      } );
    } );
  } );
}

/*
  This function returns a list of shards identifiers which this miner
  has elected to mine AKA work
*/
var workedShardcache = undefined;
lib.getWorkedShards = function() {
  return new Promise( function( resolve ) {
      if (workedShardcache) {
          resolve(workedShardcache);
          return;
      }
    // Query the database
    databases.ShardMiner.get( 'worked_shards', function( err, value ) {
      // If this key isn't set, they aren't mining anything
      if( err ) {
        return resolve( [] );
      }
      var parsed = JSON.parse(value);

      workedShardcache = parsed; // allow for quick saving
      // It was found
      resolve(parsed);
    } );

  } );
};

lib.workingOnShard = async function (pollHash) {
    var workingShards = await lib.getWorkedShards();
    return (workingShards[pollHash] != undefined)
};
/*
  This function indicates the miner has elected to mine a shard, and
  persists the pollHash associated with the shard so it can be retrieved
  later
*/

lib.saveMineShards = async function () {
    return new Promise(async function (resolve) {
        databases.ShardMiner.put('worked_shards', JSON.stringify(workedShardcache), function () {
            resolve();
        });
    });
};

lib.persistMineShard = async function( pollHash ) {
  return new Promise( async function( resolve ) {
    // Get the latest set of shards being mined
    var minedShardsArr = await lib.getWorkedShards();

    // let the api know you are now mining
    hook.Call("announceMining", pollHash);

    if (minedShardsArr.indexOf(pollHash) > -1) {
        //In the array!
    } else {
        minedShardsArr.push(pollHash);
    }
    // Store
    await lib.saveMineShards();
    resolve();
  } );
};

// Load databases and export library
module.exports = (function( _databases, _controller ) {
  ShardLogicController = _controller;
  databases = _databases;
  return lib;
} );
