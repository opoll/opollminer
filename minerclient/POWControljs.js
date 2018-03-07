
var helpers = require("./helpers");
var shardBlockHelpers = require('../helpers/shard_block');

// POWController is a Singleton
if (global.POWController) {
    module.exports = global.POWController;
    return;
}

var POWControl = {};
POWControl.maxHashString = "000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
POWControl.maxHashNumber = helpers.bigInt(POWControl.maxHashString, 256);

POWControl.OnHashMined = function(nonce){
    var block = global.POWController.currentBlock;
    var hash = shardBlockHelpers.hashWithNonce(block, nonce);

    var hashInt = helpers.bigInt(hash, 256);
    if (hashInt.lesserOrEquals(POWControl.maxHashNumber)) {
        helpers.log("HASH IS SUCCESS");
    }
    console.log(hash, nonce);
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
        if (data.toString().substr(0, 4) == "done") {
            POWControl.OnHashMined(data.toString().substr(4));
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