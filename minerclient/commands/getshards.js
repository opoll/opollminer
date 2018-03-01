var helpers = require("../helpers");

module.exports = function (CLI) {

  /*
    Create a getshards CLI command
  */
  CLI.AddCommand("getshards", function (args) {
      CLI.NetworkModule.API.getShards(function (json) {});
  }, "Query for a new list of available shards");

  /*
    Create a listshards CLI command
  */
  CLI.AddCommand("listshards", function (args) {
    var shardList = CLI.NetworkModule.API.shardList;

    // If empty perhaps they failed to fetch
    if( shardList.length == 0 ) {
      helpers.log( "No shards found, did you fetch shards with getshards ?" );
      return;
    }

    // Display
    helpers.log( shardList );
  }, "list shards");

  /*
    Create a listblocks CLI command
  */
  CLI.AddCommand("listblocks", function (args) {
    // Get the shardId from arguments
    var shardId = args[1];

    // Error handling for no input..
    if( shardId == undefined ) {
      helpers.log( "ERROR! You must provide a shard id! Usage: listblocks <shardId>" );
      return;
    }

    // Error handling for invalid shard specified...
    if( CLI.NetworkModule.API.shardList[ shardId ] == undefined ) {
      helpers.log( "ERROR! Invalid shard specified " + shardId );
      return;
    }

    // Fetch blocks for this shard from the API
    var blocks = CLI.NetworkModule.API.shardList[ shardId ].blocks;

    // Output the blocks
    helpers.log( blocks );
  }, "<shardID> list blocks");

  /*
    Create a mine CLI command
    This command will begin to fetch the inputted block then begin mining that shard
  */
  CLI.AddCommand( "mine", function (args) {
      CLI.NetworkModule.API.getLatestBlock(args[1]);
  }, "<shardID> get latest shard block and start mining" );
};
