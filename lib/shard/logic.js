
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

// Helpers
var PollHelper = require('@openpoll/helpers').poll;
var ShardBlockHelper = require('@openpoll/helpers').shardBlock;


var databases = require('../util/databases');

// The controller
var controller = {};

// cpp POW controller
controller.POWController = require("../proof_of_work")(databases, controller);

// Modules
controller.WorkedShardsModule = require('./worked_shards')( databases, controller );
controller.ActiveShardsModule = require('./active_shards')( databases, controller );
controller.PollManager = require('./poll_manager')( databases, controller );
controller.PoolManager = require('./pool')(databases, controller);
controller.LedgerManager = require('../LedgerManager');
controller.BlockManager = require('../BlockManager')(databases, controller);
controller.p2p = require('./p2p')(databases, controller);

// An array of Shard Mine Status objects
// Each object represents a shard currently being mined locally
// Undefined -> Not yet initialized
controller.currentlyWorkedShards = undefined;

/*
  This function will initialize the shard logic controller
*/
controller.initialize = async function (cli) {
    console.log("initializing shard logic controller");

    // Start the Proof-of-Work Proxy
    if (process.env.POW_PROXY === "1") {
        controller.POWController.StartProxy();
    }

    // Ensure we didn't initialize already
    if (controller.currentlyWorkedShards !== undefined) {
        throw {
            name: "AlreadyInitialized",
            message: "the miner has already been initialized and cannot be initialized again"
        };
    }

    // Remove all shards that went inactive from our worker shards queue
    var cleanseRes = await controller.WorkedShardsModule.hardCleanseWorkedShards();
    console.log((cleanseRes.beforeCnt - cleanseRes.afterCnt) + " shards removed from worker queue as they are no longer active");

    // Fetch the list of shards we are going to work
    var shardsToWork = await controller.WorkedShardsModule.getWorkedShards();
    console.log(`Miner resuming working ${shardsToWork.length} shards`);

    // Initialize CLI Commands
    require("./commands/help")(cli, controller);
    require("./commands/getshards")(cli, controller);
    require("./commands/mine")(cli, controller);
    require("./commands/proxy")(cli, controller);
};

/*
  This function returns the /shard/shard object associated
  with a provided poll. If this miner client has not preloaded the provided
  poll then the function terminates with false.
*/
controller.localGetShard = function( pollHash ) {
  return new Promise( function( resolve, reject ) {

    // Query the database
    databases.Shards.get( pollHash, function( err, value ) {
      // If it wasn't found..
      if( err ) {
        return reject( "shard not found" );
      }

      // It was found
      resolve( JSON.parse( value ) );
    } );
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
controller.localStoreValidShard = function( shardObject ) {
  return new Promise( function( resolve ) {
    databases.Shards.put( controller.pullShardIdentifier( shardObject ), JSON.stringify( shardObject ), resolve );
  } );
};

/*
  Given an associated pollHash this function terminates any and all
  data associated with the pollHash
  TODO: Delete all other associated data
*/
controller.wipePollShard = function( shardObject, cb ) {
  return new Promise( function( resolve ) {
    // Delete the reference in DB:/shards
    databases.Shards.del( controller.pullShardIdentifier( shardObject ), resolve );
  } );
};

module.exports = controller;
