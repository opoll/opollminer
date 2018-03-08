var helpers = require("../helpers");

module.exports = function ( CLI, ShardLogicController ) {

    CLI.AddCommand("listshards", async function (args) {
        // Get the list of shards from the Active Shards Module
        var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();

        // Loop through all keys in the activeShards table
        Object.keys( activeShards ).forEach( function( pollHash ) {
          // Get the metadata associated with this shard
          var shardMetadata = activeShards[ pollHash ];

          // Print the info
          helpers.log( "Shard (pollHash): " + pollHash );
          console.log( "\t- Poll Name: " + shardMetadata.pollName );
          console.log( "\t- Num Miners: " + shardMetadata.numMiners );
          console.log( "\t- Difficulty: " + shardMetadata.difficulty );
        } );
    }, "list shards");

    /*
    CLI.AddCommand("listblocks", function (args) {
        helpers.log(CLI.NetworkModule.API.shardList[args[1]].blocks);
    }, "<shardID> list blocks");

    CLI.AddCommand("mine", function (args) {
        CLI.NetworkModule.API.startMining(args[1]);//getLatestBlock(args[1]);
    }, "<shardID> get latest shard block and start mining");
    */

}
