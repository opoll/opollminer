
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
