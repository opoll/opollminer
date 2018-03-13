
var hook = require("./hook");
var helpers = require("./shard/helpers");
var ShardBlockHelper = require('../helpers/shard_block');

var ShardLogicController = undefined; // gets assigned after module is loaded

//shardBlockHelpers.shardAPI = require("./NetworkModuleAPI");

// POWController is a Singleton
if (global.POWController) {
    module.exports = global.POWController;
    return;
}

var POWControl = {};
POWControl.maxHashString = "00000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
POWControl.maxHashNumber = helpers.bigInt(POWControl.maxHashString, 256);

POWControl.CurrentShards = {};



hook.Add("updateMinerStatus", "RefreshShard", async function (shardID) {
    if (ShardLogicController.WorkedShardsModule.workingOnShard(shardID)) {
        POWControl.StartMining(shardID); // update and continue;
    }
});

/* this is called when the cpp miner completes a shard, it passes shardid completed and the nonce */
POWControl.OnHashMined = async function (shardID, nonce) {

    var block = await POWControl.generateLatestBlock(shardID);
    //global.POWController.currentBlock; // incorrect use now that it supports multiple shards
   // console.log(block);

   block.nonce = nonce;
  // console.log( block );

    var hash = ShardBlockHelper.hash(block);

    var hashInt = helpers.bigInt(hash, 256);
    if (hashInt.lesserOrEquals(POWControl.maxHashNumber)) {

        helpers.log("HASH IS SUCCESS "+hash);
        block.nonce = nonce;

        var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();
        activeShards[shardID].blocks[block.blockId] = block;
        await ShardLogicController.ActiveShardsModule.saveActiveShards();

        // update and continue;
        POWControl.StartMining(shardID); 

        // broadcast new block to peers
        ShardLogicController.p2p.broadcastBlock(shardID, block);

        
       // await ;
    } else {
      helpers.log( "HASH FAILURE: " + hash );
    }
    //console.log("SHARD = ", shardID, hash, nonce);
}

POWControl.MinerCommand = function (cmd) {

    if (POWControl.miner == undefined) {
        POWControl.CreateMiner();
    }
    POWControl.miner.stdin.write(`${cmd}\0`);
}

POWControl.StopMiner = function (){
    if (POWControl.miner == undefined) {
        POWControl.CreateMiner();
    }
    POWControl.MinerCommand("stop");
}

POWControl.CreateMiner = function () {
    if (POWControl.miner != undefined) {
        POWControl.miner.kill();
    }

    POWControl.miner = helpers.child_process.spawn("C:/Users/jyugo/source/repos/powminer/Debug/powminer.exe");
    POWControl.miner.stdout.on('data', (data) => {

        var args = [];
        var i = 0;
        data.toString().split("|").map(function (v) {
            args[i] = v;
            i++;
        });
        if (args[0] == "done") {
            POWControl.OnHashMined(args[1], args[2]);
        } else {
            console.log("[" + helpers.chalk.cyan("MINER") + "]", data.toString());
        }

    });
    POWControl.miner.on('close', (code) => {
        POWControl.miner = undefined;
        helpers.log("MINER CLOSED? : "+code)
    });
   // POWControl.miner.stdin.write("dfkslgjdsfkolgjsdfglkdsfjglk\n");

}

/* TEMP FUNCTIONs*/

var blankMeta = {
    blockId: 0,
    pollHash: "",
    timestamp: 0,
    prevHash: "",
    responses: [],
    minerAddress: "",
    nonce: 0,
    hash: "",
};

POWControl.generateBlankBlock = function () {
    var newblock = Object.assign({}, blankMeta);
    return newblock;

}

POWControl.generateLatestBlock = async function (shardID) {

    var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();
   // console.log(activeShards);
    var dat = activeShards[shardID];
    if (!dat.blocks) {
        dat.blocks = {};
        var genesis = POWControl.generateBlankBlock();
        genesis.pollHash = shardID;
        dat.blocks[0] = genesis;

        await ShardLogicController.ActiveShardsModule.saveActiveShards(activeShards);
    }
    var latestBlockNumber = Object.keys(dat.blocks).length - 1; // subtract one because array starts at 0;
    var previousBlock = dat.blocks[latestBlockNumber];


    var newBlock = POWControl.generateBlankBlock();
    newBlock.prevHash = ShardBlockHelper.hash( previousBlock );
    newBlock.pollHash = shardID;
    newBlock.blockId = latestBlockNumber + 1;
    /* SET MINER ADDRESS */
    newBlock.minerAddress = "bullshit address";
    //console.log("SHARD BLOCK:", newBlock);
    return newBlock;
}


POWControl.StartMining = async function (shardID) {

    var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();

    if (!activeShards[shardID]) {
        helpers.log("something went wrong, shard not found")
        return false;
    }
    var dat = activeShards[shardID];
    //  var previousBlock = dat.blocks[dat.localChainLength];
    var block = await POWControl.generateLatestBlock(shardID);
   // console.log(block);

    // powC.currentBlock = block;

    POWControl.MinerCommand("mine");  //tell cpp miner we are mining a shard
    POWControl.MinerCommand(shardID); //tell cpp miner the unique shardid
    POWControl.MinerCommand(POWControl.maxHashString); //tell cpp miner the dificulty of this shard block
    for (var v of ShardBlockHelper.orderedHashFields(block, ignoreNonce = true)) {
        POWControl.MinerCommand(v);
    }
    POWControl.MinerCommand("done");
}

global.POWController = POWControl;

POWControl.StartProxy = function() {
  var proxy = require( './proxy' )( POWControl );
}

module.exports = function (databases, controller) {
    ShardLogicController = controller;
    return POWControl;
}

/*
var newBlock = POWControl.generateBlankBlock();
newBlock.pollHash = "8b64d8cb790cb33731bdd67e88f0c2dc46f01fbb5c0b3bf1dafe52af110224f8";


var shardexample = {};
shardexample.pollHash = "8b64d8cb790cb33731bdd67e88f0c2dc46f01fbb5c0b3bf1dafe52af110224f8";
shardexample.numMiners = 2;
shardexample.difficulty = POWControl.maxHashString;
shardexample.pollName = "Do you like the color blue?"
shardexample.genesisBlockHash = ShardBlockHelper.hash(newBlock);

var fs = require("fs");

fs.writeFileSync("example_shard_1.json", JSON.stringify(shardexample))
fs.writeFileSync("example_shard_1_genesis.json", JSON.stringify(newBlock))
*/