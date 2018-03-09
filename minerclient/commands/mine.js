var helpers = require("../helpers");

// test shardid 8b64d8cb790cb33731bdd67e88f0c2dc46f01fbb5c0b3bf1dafe52af110224f8
module.exports = function (CLI, ShardLogicController) {

    CLI.AddCommand("mine", async function (args) {

        var pollHash = args[1];
        var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();
      //  console.log(activeShards);

        if (activeShards[pollHash] == undefined) {
            helpers.log("Could not find hash in active shard list");
            return;
        }
        await ShardLogicController.WorkedShardsModule.persistMineShard(pollHash);

        await ShardLogicController.POWController.StartMining(pollHash); // initiate cpp miner for this pollhash
        //console.log(ShardLogicController.POWController);
        
    }, "Start mining a specified shard");
}
