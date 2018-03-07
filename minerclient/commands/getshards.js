var helpers = require("../helpers");

module.exports = function (CLI) {
    CLI.AddCommand("getshards", function (args) {
        CLI.NetworkModule.API.getShards(function (json) {});
    }, "Query for a new list of available shards");

    CLI.AddCommand("listshards", function (args) {
        helpers.log(CLI.NetworkModule.API.shardList);
    }, "list shards");

    CLI.AddCommand("listblocks", function (args) {
        helpers.log(CLI.NetworkModule.API.shardList[args[1]].blocks);
    }, "<shardID> list blocks");

    CLI.AddCommand("mine", function (args) {
        CLI.NetworkModule.API.getLatestBlock(args[1]);



    }, "<shardID> get latest shard block and start mining");
}