
var helpers = require("./helpers");

// POWController is a Singleton
if (global.POWController) {
    module.exports = global.POWController;
    return;
}

var POWControl = {};

POWControl.MinerCommand = function (cmd) {
    if (POWControl.miner == undefined) {
        throw { name: "No Miner" };
    }
    POWControl.miner.stdin.write(`${cmd}\0`);
}

POWControl.StopMiner = function (){
    if (POWControl.miner == undefined) {
        throw { name: "No Miner" };
    }
    POWControl.MinerCommand("stop");
}

POWControl.CreateMiner = function () {
    if (POWControl.miner != undefined) {
        POWControl.miner.kill();
    }

    POWControl.miner = helpers.child_process.spawn("C:/Users/jyugo/source/repos/powminer/Debug/powminer.exe");
    POWControl.miner.stdout.on('data', (data) => {
        console.log("[" + helpers.chalk.cyan("MINER") + "]", data.toString());
    });

   // POWControl.miner.stdin.write("dfkslgjdsfkolgjsdfglkdsfjglk\n");



}

module.exports = POWControl;