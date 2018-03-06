require('dotenv').config();
var helpers = require("./helpers");

process.env.test = 1;

console.log(process.env.MINERPORT);
// listen server
var NetworkModule = require("./NetworkModule");
NetworkModule.StartListen(); // start listen server


/* test console */
require("./CLI")(NetworkModule); // pass the NetworkModule so it can be access from the command base


//console.log(sha256.digest("hex"));
/*

NetworkModule.miner = helpers.child_process.spawn("C:/Users/Administrator/source/repos/powminer/Debug/powminer.exe");
*/

var POWControl = require("./POWControljs");
process.env.POWControl = POWControl; // global access to the pow miner so we dont have duplcate executables
POWControl.CreateMiner();










/*POWControl.MinerCommand("mine");
POWControl.MinerCommand("test");
POWControl.MinerCommand("done");*/

//var sha = helpers.crypto.createHash("sha256");

//sha.update("test");
//sha.update("2330405112");
//sha.update("1478006816");
//[MINER] HASH MINED: 0000234d54b2131694856f33ac65fceb81dc08b3a879cd0092d5967065ba7a2b NONCE: 1478006816
//console.log(sha.digest().toString("hex"));
//00000559f3dffe968efc98bd934e1b65ce1eba7a399004d2237c69333d834338 NONCE: 2330405112
/*
child.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
    //Here is where the error output goes
});
child.on('close', function (code) {
    console.log('closing code: ' + code);
    //Here you can get the exit code of the script
});*/

/*
test.stdin.setEncoding('utf-8');
test.stdin.write("test\n");
test.stdin.end();*/
//mnm.API.getShards();
