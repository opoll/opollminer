
/*
  Shard Logic Controller
    * Poll Management Module
  (c) 2018 OpenPoll Inc
  ==============================================================================
  This module is responsible for managing polls including their storage and
  retrieval.
*/

// Helpers
var PollHelper = require('@openpoll/helpers').poll;;
var ShardBlockHelper = require('@openpoll/helpers').shardBlock;;

// Our module wrapper
var lib = {};

// The logic controller
var ShardLogicController = undefined;

// Variable to store databases (injected by logic controller)
var databases = undefined;

/*
  Given a pollHash, this function returns a /poll/poll object
*/
lib.fetchPoll = function( pollHash ) {
  return new Promise( (resolve, reject) => {
    databases.Polls.get( pollHash, function( err, data ) {
      // If the poll doesn't exist..
      if( err ) {
        reject('the poll requested does not exist');
      }

      // Return the parsed poll object
      resolve( JSON.parse( data ) );
    } );
  } );
}

/*
  This function returns an array of all polls (by hash) known to
  this miner
*/
lib.knownPollHashes = function() {
  var pollIds = [];

  return new Promise( (resolve) => {
    // Create a key stream and get the data
    databases.Polls.createKeyStream()
      .on( 'data', function( K ) { pollIds.push( K ); } )
      .on( 'end', function() { resolve( pollIds ); } );
  } );
};

/*
  Given a validated /poll/poll object, this function adds the
  object to the database
*/
lib.persistValidPoll = function( pollObj ) {
  return new Promise( (resolve) => {
    databases.Polls.put( pollObj.hash, JSON.stringify( pollObj ), function() { resolve(); } );
  } );
}

// Load databases and export library
module.exports = (function( _databases, _controller ) {
  databases = _databases;
  ShardLogicController = _controller;
  return lib;
} );
