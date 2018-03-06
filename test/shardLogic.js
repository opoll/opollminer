
// Environment Setup
require('dotenv').config()
process.env.AUTOMATED_TESTING = "TRUE";

// Imports
var tLib = require('../lib/shard/logic');
var expect = require('chai').expect;

describe( 'the shard logic controller', function() {

  it( 'should retrieve the pollHash as a shard identifier', function( done ) {
    var simpleShard = { pollHash: "XXX" };
    expect( tLib.pullShardIdentifier( simpleShard ) ).to.equal( "XXX" );
    done();
  } );

  describe( 'worked shards module', function() {

    it( 'should exist', function( done ) {
      expect( tLib.WorkedShardsModule ).to.exist;
      done();
    } );

    it( 'should allow the storage of shards being mined', function( done ) {
      tLib.WorkedShardsModule.persistMineShard( 'ABC', function() {
        done();
      } );
    } );

    it( 'should retreive persisted Shards', function() {
      tLib.WorkedShardsModule.persistMineShard( 'OOP', function() {
        tLib.WorkedShardsModule.getWorkedShards( function( workedShards ) {
          expect( workedShards.includes( 'OOP' ) ).to.be.true;
        } );
      } );
    } );

  } );

  describe( 'active shards module', function() {

    it( 'should exist', function( done ) {
      expect( tLib.ActiveShardsModule ).to.exist;
      done();
    } );

    it( 'should allow a shard to be marked as active', function( done ) {
      tLib.ActiveShardsModule.recordActiveShard( 'ABC', function() {
        done();
      } );
    } );

    it( 'should retreive an array of active shards', function( done ) {
      tLib.ActiveShardsModule.recordActiveShard( 'OOP', function() {
        tLib.ActiveShardsModule.getActiveShards( function( activeShards ) {
          expect( activeShards.includes( 'OOP' ) ).to.be.true;
          done();
        } );
      } );
    } );

    it( 'should determine if a shard is active correctly', function( done ) {
      var shardObj = { pollHash: "POLL-1234", localRespondents: [] };
      var pollObj = { hash: "POLL-1234", name: "Do you support Donald Trump?", expiry: (new Date()/1000) + 50 };

      // Save this poll
      tLib.PollManager.persistValidPoll( pollObj ).then( () => {
        // Determine if the shard is active
        tLib.ActiveShardsModule.isShardActive( shardObj )
          .then( () => { done(); } )
          .catch( (err) => { console.log( err ); expect(true).to.be.false; done(); } );
      } );
    } );

    it( 'should determine a shard inactive if the poll expired', function( done ) {
      var shardObj = { pollHash: "POLL-12345", localRespondents: [] };
      var pollObj = { hash: "POLL-12345", name: "Do you support Donald Trump?", expiry: (new Date()/1000) - 50 };

      // Save this poll
      tLib.PollManager.persistValidPoll( pollObj ).then( () => {
        tLib.ActiveShardsModule.isShardActive( shardObj )
          .then( (shard) => {
            expect( true ).to.be.false;
          } )
          .catch( (err) => {
            expect( err ).to.equal( "poll is expired" );
            done();
          } );
      } );
    } );

    it( 'should determine a shard inactive if the max respondents was reached', function( done ) {
      // Basic factories in need of reafactoring (hah!)
      var shardObj = { pollHash: "POLL-12345", localRespondents: [1,2] };
      var pollObj = {
        hash: "POLL-12345",
        maxRespondents: 1,
        name: "Do you support Donald Trump?",
        expiry: (new Date()/1000) + 50
      };

      // Save this poll
      tLib.PollManager.persistValidPoll( pollObj ).then( () => {
        tLib.ActiveShardsModule.isShardActive( shardObj )
          .then( (shard) => {
            expect( true ).to.be.false;
          } )
          .catch( (err) => {
            expect( err ).to.equal( "poll hit the maximum number of respondents" );
            done();
          } );
      } );
    } );

  } );

  describe( 'poll manager module', function() {

    it( 'should persist valid polls', function( done ) {
      var poll = { hash: "hja98sdh98ashdasd" };

      // Persist the poll
      tLib.PollManager.persistValidPoll( poll ).then( () => {
        // Get all known hashes
        return tLib.PollManager.knownPollHashes();
      } ).then( hashes => {
        // Make sure it includes the poll we persisted earlier
        expect( hashes.includes( poll.hash ) ).to.be.true;
        done();
      } );

    } );

    it( 'should properly fetch polls', function( done ) {

      var poll = { hash: "0aadsf0jsadfsdaf", k: 5 };

      // Save a poll
      tLib.PollManager.persistValidPoll( poll ).then( () => {
        // Get all known hashes
        return tLib.PollManager.fetchPoll( poll.hash );
      } ).then( pollObj => {
        // Make sure it returned the poll we provided earlier
        expect( pollObj.k ).to.equal( 5 );
        done();
      } );

    } );

  } );

  describe( 'shard local storage functionality', function() {

    it( "should return false when locally getting a shard that does not exist", function( done ) {
      tLib.localGetShard( "XX", function( res ) {
        expect( res ).to.be.false;
        done();
      } );
    } );

    it( "should store and retreive a semi-valid shard", function( done ) {
      tLib.localStoreValidShard( { pollHash: "X", genesisBlock: "ABC" }, function() {
        tLib.localGetShard( "X", function( obj ) {
          expect( obj.genesisBlock ).to.equal( "ABC" );
          done();
        } );
      } );
    } );

    it( "should delete shards", function( done ) {
      var shardObj = { pollHash: "Z", genesisBlock: "ABC" };

      // store the object
      tLib.localStoreValidShard( shardObj, function() {
        // wipe the object
        tLib.wipePollShard( shardObj, function() {
          // ensure we can't get it again
          tLib.localGetShard( shardObj.pollHash, function( obj ) {
            expect( obj ).to.be.false;
            done();
          } );
        } );
      } );
    } );

  } );

} );
