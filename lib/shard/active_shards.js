
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
var NetworkModule = require('../../minerclient/NetworkModuleAPI');

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
  TODO: Automated Testing for API Calls
*/
lib.fetchActiveShards = function( cb ) {
  // Query the API Server
  NetworkModule.queryAPIServer( "getshards", function( shardList ) {
    // Add the array of shards as active shards
    lib.recordActiveShards( shardList, cb );
  } );
}

/*
  This function returns a list of shards which are currently active
  * Local data sourcing only, no external fetching.
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
  This function takes an array of poll hashes and includes them
  all as active shards
*/
lib.recordActiveShards = function( pollHashArr, cb ) {
  // Get the latest set of shards being mined
  lib.getActiveShards( function( activeShardsArr ) {
    // Loop through all poll hashes being added...
    pollHashArr.forEach( function( pollHash ) {
      if( !activeShardsArr.includes( pollHash ) ) {
        // Add the poll hash mto the local array of active shards
        activeShardsArr.push( pollHash );
      }
    } );

    // Store
    databases.ShardMiner.put( 'active_shards', JSON.stringify( activeShardsArr ), cb );
  } );
};

/*
  This function is used to record an active shard. This should
  only be called if the shard was verified to be active.
*/
lib.recordActiveShard = function( pollHash, cb ) {
  return lib.recordActiveShards( [ pollHash ], cb );
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
lib.isShardActive = function( shardObj ) {
  return new Promise( (resolve, reject) => {

    // Get the /poll/poll object associated with this shard
    ShardLogicController.PollManager.fetchPoll( shardObj.pollHash ).then( pollObj => {

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

  } );
}

// Load databases and export library
module.exports = (function( _databases, _controller ) {
  databases = _databases;
  ShardLogicController = _controller;
  return lib;
} );
