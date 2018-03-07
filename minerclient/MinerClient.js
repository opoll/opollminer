require('dotenv').config();
var helpers = require("./helpers");

process.env.test = 1;

console.log(process.env.MINERPORT);
// listen server
var NetworkModule = require("./NetworkModule");
NetworkModule.StartListen(); // start listen server



require("./CLI")(NetworkModule); // pass the NetworkModule so it can be access from the command base


//console.log(sha256.digest("hex"));


var POWControl = require("./POWControljs");
process.env.POWControl = POWControl; // global access to the pow miner so we dont have duplcate executables
POWControl.CreateMiner();


/*
var test = 0x00ffff;
var maxd = helpers.bigInt("0000000FFFF00000000000000000000000000000000000000000000000000000",256);
var maxdd = helpers.bigInt("0000000FFFF00000000000000000000000000000000000000000000000000001", 256);
var targetd = 0x00000000000404CB000000000000000000000000000000000000000000000000;


if (maxdd.greater(maxd)) {
    console.log("bigger");
}

test = test * 2 ** (8 * (0x1d - 3));
console.log(maxd / targetd, test, maxd);

var dif = 0x00000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

var shardBlockHelpers = require('../helpers/shard_block');
var gen = require("./genblock");
gen.minerAddress = "0x99999999999";

var som = shardBlockHelpers.hashWithNonce(gen, "1358037190");
console.log(som);
som = parseInt(som, 16);

console.log("INT TEST", som, som * 2);

if (som <= dif ) {
    console.log("smaller GOOD", dif, som);
} else {
    console.log("bigger BAD");
}


*/







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
