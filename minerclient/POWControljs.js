
var helpers = require("./helpers");
var shardBlockHelpers = require('../helpers/shard_block');

shardBlockHelpers.shardAPI = require("./NetworkModuleAPI");

// POWController is a Singleton
if (global.POWController) {
    module.exports = global.POWController;
    return;
}

var POWControl = {};
POWControl.maxHashString = "0000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
POWControl.maxHashNumber = helpers.bigInt(POWControl.maxHashString, 256);


/* this is called when the cpp miner completes a shard, it passes shardid completed and the nonce */
POWControl.OnHashMined = function (shardID, nonce) {
    
    var block = shardBlockHelpers.shardAPI.generateLatestBlock(shardID);
    //global.POWController.currentBlock; // incorrect use now that it supports multiple shards
    var hash = shardBlockHelpers.hashWithNonce(block, nonce);

    var hashInt = helpers.bigInt(hash, 256);
    if (hashInt.lesserOrEquals(POWControl.maxHashNumber)) {
        helpers.log("HASH IS SUCCESS");
    }
    console.log("SHARD = ", shardID, hash, nonce);
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
    });
   // POWControl.miner.stdin.write("dfkslgjdsfkolgjsdfglkdsfjglk\n");



}
global.POWController = POWControl;
module.exports = POWControl;