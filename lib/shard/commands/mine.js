var helpers = require("../helpers");

module.exports = function (CLI, ShardLogicController) {

    CLI.AddCommand("mine", async function (args) {
        var pollHash = args[1];
        var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();

        // Make sure the shardId provided is valid
        if( !activeShards[pollHash] ) {
            helpers.log("Could not find hash in active shard list");
            return;
        }

        // Record that we are mining this shard
        await ShardLogicController.WorkedShardsModule.persistMineShard(pollHash);

        // Begin mining this shard
        // await ShardLogicController.POWController.StartMining(pollHash);
        console.log( "Shard marked to active.." );
    }, "Start mining a specified shard");
}
