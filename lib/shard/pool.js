
/*
  Shard Logic Controller
    * Shard Response Poll Module
  (c) 2018 OpenPoll Inc
  ==============================================================================
  This module handles the response pool for a given shard. The response pool is used
  from the time a shard becomes aware of a response to incorporating responses into
  the next block being mined. Responses are removed from the pool if a given respondent
  is included in any block on the same shard to prevent duplicate responses.
  NOTE: This module does not handle response verification and validation.
*/

// Helpers
var PollHelper = require('@openpoll/helpers').poll;
var ShardBlockHelper = require('@openpoll/helpers').shardBlock;

// Our module wrapper
var lib = {};

// The logic controller
var ShardLogicController = undefined;

// Variable to store databases (injected by logic controller)
var databases = undefined;

/*
  Given a poll hash this function returns a list of all pooled transactions
  for that specific poll.
  ** This function assumes the pollHash is valid
*/
lib.getResponsePool = function( pollHash ) {
  return new Promise( function( resolve ) {

    // Query the database
    databases.ResponsePool.get( pollHash, function( err, value ) {
      // If this key isn't set, the response pool is empty
      if( err ) {
        return resolve( [] );
      }

      // It was found
      resolve( JSON.parse( value ) );
    } );

  } );
};

/*
  Given a /poll/response object, this function will pool response.
  If the verifyPoolDuplicate param is set to true, this method will verify this
  response has not already been pooled.
  ** This function assumes the response is valid
*/
lib.poolResponse = function( responseObj, verifyPoolDuplicate = true ) {
  return new Promise( async function( resolve, reject ) {

    // Trivial validation
    if( responseObj.pollHash === undefined )
      return reject( "invalid poll response object" );

    // Get the current response pool
    var responsePool = await lib.getResponsePool( responseObj.pollHash );

    // Perform duplicate checking
    if( verifyPoolDuplicate ) {
      // Loop through all pooled responses, and check it's not already pooled
      responsePool.forEach( function( pooledResponse ) {
        if( pooledResponse.responseHash === responseObj.responseHash ) {
          return reject( "response already pooled" );
        }
      } );
    }

    // Add the response object to the pool
    responsePool.push( responseObj );

    // Store the pooled object
    databases.ResponsePool.put( responseObj.pollHash, JSON.stringify( responsePool ), function() {
      resolve();
    } );

  } );
};

// Load databases and export library
module.exports = (function( _databases, _controller ) {
  databases = _databases;
  
  ShardLogicController = _controller;
  return lib;
} );
