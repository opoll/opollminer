
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

  describe( 'shard response pool module', function() {

    it( 'should thow an error when attempting to pool an invalid poll', function( done ) {
      tLib.PoolManager.poolResponse( {} )
        .then( function() { expect( true ).to.be.false; done(); } )
        .catch( function( err ) {
          expect( err ).to.equal( "invalid poll response object" );
          done();
        } );
    } );

    it( 'should pool a poll response and fetch it', function( done ) {
      var simpleResponse = {
        pollHash: "156ABD7",
        responseHash: "615ACDF"
      };

      // Pool the response
      tLib.PoolManager.poolResponse( simpleResponse ).then( function() {
        // Fetch the pool
        tLib.PoolManager.getResponsePool( simpleResponse.pollHash ).then( rPool => {
          var found = false;

          // Make sure the response is in there..
          rPool.forEach( function( pooledResp ) {
            if( pooledResp.responseHash === simpleResponse.responseHash ) {
              found = true;
              return;
            }
          } );

          // It wasn't found..
          if( !found )
            expect( true ).to.be.false;

          done();
        } );
      } );
    } );

  } );

  describe( 'worked shards module', function() {

    it( 'should exist', function() {
      expect( tLib.WorkedShardsModule ).to.exist;
    } );

    it( 'should allow the storage of shards being mined', async function() {
      await tLib.WorkedShardsModule.persistMineShard( 'ABC8191' );
    } );

    it( 'should retreive persisted shards', async function() {
      await tLib.WorkedShardsModule.persistMineShard( 'OOP' );
      var workedShards = await tLib.WorkedShardsModule.getWorkedShards();
      expect( workedShards.includes( 'OOP' ) ).to.be.true;
    } );

  } );

  describe( 'active shards module', function() {

    it( 'should exist', function( done ) {
      expect( tLib.ActiveShardsModule ).to.exist;
      done();
    } );

    it( 'should allow a shard to be marked as active', async function( done ) {
      await tLib.ActiveShardsModule.recordActiveShard( { pollHash: 'ABC' } );
      done();
    } );

    it( 'should retreive an array of active shards', async function( done ) {
      // Record an active shard
      await tLib.ActiveShardsModule.recordActiveShard( { pollHash: 'OOP' } );

      // Fetch active shards
      var activeShards = await tLib.ActiveShardsModule.getActiveShards();

      // Verify the shard was marked active
      expect( activeShards[ 'OOP' ] !== undefined ).to.be.true;
      done();
    } );

    it( 'should not record duplicates', async function( done ) {
      // Get all active shards
      var activeShards = await tLib.ActiveShardsModule.getActiveShards();
      var l = Object.keys( activeShards ).length;

      // Attempt to add a duplicate active shard
      await tLib.ActiveShardsModule.recordActiveShard( { pollHash: 'KSJIAHAIHAIA' } );
      await tLib.ActiveShardsModule.recordActiveShard( { pollHash: 'KSJIAHAIHAIA' } );

      // Fetch active shards again
      var activeShards2 = await tLib.ActiveShardsModule.getActiveShards();

      // Verify duplicates were not added
      expect( Object.keys( activeShards2 ).length ).to.equal( l + 1 );
      done();
    } );

    it( 'should determine if a shard is active correctly', async function( done ) {
      var shardObj = { pollHash: "POLL-1234", localRespondents: [] };
      var pollObj = { hash: "POLL-1234", name: "Do you support Donald Trump?", expiry: (new Date()/1000) + 50 };

      // Save this poll
      var pollObj = await tLib.PollManager.persistValidPoll( pollObj );

      // Determine if the shard is active
      tLib.ActiveShardsModule.assertShardActive( shardObj )
        .then( () => { done(); } )
        .catch( (err) => { expect(true).to.be.false; done(); } );
    } );

    it( 'should determine a shard inactive if the poll expired', async function( done ) {
      var shardObj = { pollHash: "POLL-12345", localRespondents: [] };
      var pollObj = { hash: "POLL-12345", name: "Do you support Donald Trump?", expiry: (new Date()/1000) - 50 };

      // Save this poll
      var pollObj = await tLib.PollManager.persistValidPoll( pollObj );

      try {
        var shard = await tLib.ActiveShardsModule.assertShardActive( shardObj );
      } catch( err ) {
          expect( err ).to.equal( "poll is expired" );
          done();
      };
    } );

    it( 'should determine a shard inactive if the max respondents was reached', async function( done ) {
      // Basic factories in need of reafactoring (hah!)
      var shardObj = { pollHash: "POLL-12345", localRespondents: [1,2] };
      var pollObj = {
        hash: "POLL-12345",
        maxRespondents: 1,
        name: "Do you support Donald Trump?",
        expiry: (new Date()/1000) + 50
      };

      // Save this poll
      var pollObj = await tLib.PollManager.persistValidPoll( pollObj );

      // Check the shard is not active
      try {
        await tLib.ActiveShardsModule.assertShardActive( shardObj );
      } catch( err ) {
          expect( err ).to.equal( "poll hit the maximum number of respondents" );
          done();
      }
    } );

  } );

  describe( 'poll manager module', function() {

    it( 'should persist valid polls', async function( done ) {
      var poll = { hash: "hja98sdh98ashdasd" };

      // Persist the poll
      await tLib.PollManager.persistValidPoll( poll );

      // Get all known poll hashes
      var hashes = await tLib.PollManager.knownPollHashes();

      // Make sure it includes the poll we persisted earlier
      expect( hashes.includes( poll.hash ) ).to.be.true;
      done();
    } );

    it( 'should properly fetch polls', async function( done ) {
      var poll = { hash: "0aadsf0jsadfsdaf", k: 5 };

      // Save a poll
      await tLib.PollManager.persistValidPoll( poll );

      // Fetch the poll associated with this hash
      var pollObj = await tLib.PollManager.fetchPoll( poll.hash );

      // Make sure it returned the poll we provided earlier
      expect( pollObj.k ).to.equal( 5 );
      done();
    } );

  } );

  describe( 'shard local storage functionality', function() {

    it( "should return false when locally getting a shard that does not exist", async function( done ) {
      try {
        var res = await tLib.localGetShard( "XX" );
        expect( res ).to.be.false;
      } catch(exception) {
        done();
      };
    } );

    it( "should store and retreive a semi-valid shard", async function( done ) {
      await tLib.localStoreValidShard( { pollHash: "X", genesisBlock: "ABC" } );

      try {
        var obj = await tLib.localGetShard( "X" );
        expect( obj.genesisBlock ).to.equal( "ABC" );
        done();
      } catch(ex) {}
    } );

    it( "should delete shards", async function( done ) {
      var shardObj = { pollHash: "Z", genesisBlock: "ABC" };

      // store the object
      await tLib.localStoreValidShard( shardObj );
      await tLib.wipePollShard( shardObj );

      // Attempting to load shard should error
      try {
        var obj = await tLib.localGetShard( shardObj.pollHash );
        expect( true ).to.be.false;
      } catch(ex) {
        done();
      }

    } );

  } );

} );
