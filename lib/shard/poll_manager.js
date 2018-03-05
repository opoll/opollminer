
/*
  Shard Logic Controller
    * Poll Management Module
  (c) 2018 OpenPoll Inc
  ==============================================================================
  This module is responsible for managing polls including their storage and
  retrieval.
*/

// Helpers
var PollHelper = require('../../helpers/poll');
var ShardBlockHelper = require('../../helpers/shard_block');

// Our module wrapper
var lib = {};

// The logic controller
var ShardLogicController = undefined;

// Variable to store databases (injected by logic controller)
var databases = undefined;

/*
  This function returns an array of all polls (by hash) known to
  this miner
*/
lib.knownPollHashes = function( cb ) {
  var pollIds = [];

  // Create a key stream and get the data
  databases.Polls.createKeyStream()
    .on( 'data', function( K ) { pollIds.push( K ); } )
    .on( 'end', function() { cb( pollIds ); } );
};

/*
  Given a validated /poll/poll object, this function adds the
  object to the database
*/
lib.persistValidPoll = function( pollObj, cb ) {
  databases.Polls.put( pollObj.hash, JSON.stringify( pollObj ), cb );
}

// Load databases and export library
module.exports = (function( _databases, _controller ) {
  databases = _databases;
  ShardLogicController = _controller;
  return lib;
} );
