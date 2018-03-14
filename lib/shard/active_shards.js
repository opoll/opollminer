
const axios = require("axios");
var hook = require("../hook");
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

// Helpers
var PollHelper = require('../../helpers/poll');
var ShardBlockHelper = require('../../helpers/shard_block');
var ShardNetworkModule = require('./net');

// Our module wrapper
var lib = {};

// The logic controller
var ShardLogicController = undefined;

// Variable to store databases (injected by logic controller)
var databases = undefined;

/*
  This function performs a fetch of active shards from remote data source. In initial
  releases this is done via API call to known facilitator but will be transitioned to
  P2P.
*/
lib.fetchActiveShards = function() {
  return new Promise( async function( resolve ) {
    // Query the API server
    var resp = await axios.get( ShardNetworkModule.API_URL + "/shards" );

    // If there was an error..
    if( resp.status !== 200 ) {
      throw {
        name: "UnableToQueryAPI",
        message: "system was unable to fetch /shards from the API server"
      };
    }

    // Get the array of /shard/meta objects
    var activeShardsMetaArray = resp.data;

    // Add the array of shards as active shards
    await lib.recordActiveShards( activeShardsMetaArray );

    // Resolve the promise
    resolve( activeShardsMetaArray );
  } );
}

/*
  This function returns a map of active shards (pollHash -> /shard/meta)
  * Local data sourcing only, no external fetching.
*/
var activeShardcache = undefined;
lib.getActiveShards = function() {
  return new Promise( function( resolve ) {
    // Query the database
    if (activeShardcache) {
        resolve(activeShardcache);
        return;
    }

    databases.ShardMiner.get( 'active_shards', function( err, value ) {
      // If this key isn't set, there are no active sahrds
      if( err ) {
        return resolve( {} );
        }
      var parsed = JSON.parse(value);

      activeShardcache = parsed; // allow for quick saving
      // It was found
      resolve(parsed);
    } );
  } );
};

/*
  This function takes an array of poll hashes and includes them
  all as active shards
*/
lib.recordActiveShards = function( shardMetadataArr ) {
  return new Promise( async function( resolve ) {
    // Get the latest set of shards being mined
    var activeShardsMap = await lib.getActiveShards();

    // Loop through all poll hashes being added...
    for (var key in shardMetadataArr) {
        var shardMeta = shardMetadataArr[key];
        if (!activeShardsMap[shardMeta.pollHash]) {
            activeShardsMap[shardMeta.pollHash] = shardMeta;
        }
    }

    // Store
    databases.ShardMiner.put( 'active_shards', JSON.stringify( activeShardsMap ), resolve );
  } );
};

lib.saveActiveShards = function () {
    return new Promise(async function (resolve) {
        databases.ShardMiner.put('active_shards', JSON.stringify(activeShardcache), resolve);
    });
};
/*
  This function is used to record an active shard. This should
  only be called if the shard was verified to be active.
*/
lib.recordActiveShard = function( shardMetadata, cb ) {
  return lib.recordActiveShards( [ shardMetadata ], cb );
};

/*
  Given a /shard/shard object, this function will determine if the shard is active.
  This method performs the following verifications:
    (1) ensures the shard is associated with a knwon poll
    (2) ensures the poll has not expired
    (3) ensures the poll was properly built (i.e. the logcal ledger)
    (4) ensures the poll has not received its maximum respondents
    (5) validates the poll was fully funded in escrow
*/
lib.assertShardActive = function( shardObj ) {
  return new Promise( async (resolve, reject) => {

    // Get the /poll/poll object associated with this shard
    var pollObj = await ShardLogicController.PollManager.fetchPoll( shardObj.pollHash );

    // If the poll doesn't exist
    if( pollObj === false ) {
      return reject( 'poll is invalid' );
    }

    // Check if the poll is expired
    if( PollHelper.isExpired( pollObj) ) {
      return reject( 'poll is expired' );
    }

    // Make sure this shard was built properly
    if( shardObj.localRespondents === undefined ) {
      return reject( 'shard was not built properly!' );
    }

    // Check if this shard hit the maximum number of respondents
    if( shardObj.localRespondents.length >= pollObj.maxRespondents ) {
      return reject( 'poll hit the maximum number of respondents' );
    }

    // Validate Funding
    // TODO !important

    // Valid
    resolve();

  } );
}

hook.Add("shardBlockAdded", "updateShardList", async function (block) {
    var activeShards = await lib.getActiveShards();
    var shard = activeShards[block.pollHash];

    activeShards[block.pollHash].blocks[block.blockId] = block;
    await ShardLogicController.ActiveShardsModule.saveActiveShards();

    hook.Call("updateMinerStatus", block.pollHash)
});

/*lib.broadcastBlockToPeers = async function (shardID, jsonCommand) {
    var shard = lib.getActiveShards()[shardID];
    if (!shard.peers) {
        console.log("Can't broadcast because theres no list of peers for this shard");
        return;
    }

    shard.peers.forEach(function (ip) {
        axios.post(ip)
    });
}*/

/* convert this to p2p, also ensure no fork chains*/

lib.getBlock = function (pollHash, blockid) {
    return new Promise(function (resolve) {
        var res = axios.get(ShardNetworkModule.API_URL + `/shard/${pollHash}/${blockid}/block`).then(function (resp) {
            resolve(resp.data);
        }).catch(function (err) {
            resolve(false);
        });
    })
}

lib.getLatestBlock = async function (pollHash) {
   
}

// Load databases and export library
module.exports = (function( _databases, _controller ) {
  databases = _databases;
  ShardLogicController = _controller;
  return lib;
} );
