
// Import Helpers
var helpers = require("./helpers");
var shardBlockHelpers = require('../../helpers/shard_block');
var ShardLogicController = require('./logic');

// Shard Network Module
var lib = {};

/* quick access shard list */
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

lib.generateBlankBlock = function () {
    var newblock = Object.assign({}, blankMeta);
    return newblock;

}
var gen = lib.generateBlankBlock();
//gen.pollHash = "0x01";
//gen.minerAddress = "0x99999999999";

var gen2 = lib.generateBlankBlock();
//gen2.pollHash = "0x02";
//gen2.minerAddress = "0x99999999998";
lib.shardList = {
    ["0x01"]: {
        blocks: { 0: gen },
        pollHash: "0x01",
        localChainLength: 0,
        // genesisBlockHash:
    },
    ["0x02"]: {
    blocks: { 0: gen2 },
    pollHash: "0x02",
        localChainLength: 0,
        // genesisBlockHash:
    }
}

/* save list via level db*/
lib.saveShards = function (data) {
    var db = helpers.level("./db/shards");
    for (var shardID in data) {
        var shardData = data[shardID];
        db.put(shardID, shardData);     // store each shardid as a key / val
    }
    db.close();

    helpers.log("Saved updated shard list");
}

// The API URL
lib.API_URL = (process.env.FACILITATOR_HOST_DEV || process.env.FACILITATOR_HOST);

// Temp Shard List
lib.shardList = {};

/*
  This function makes a call to the API server given a command and
  a callback.
*/
lib.queryAPIServer = function (command, callbackFunction) {
    helpers.http.get({
        host: process.env.FACILITATOR_HOST_DEV || process.env.FACILITATOR_HOST,
        path: "/" + command,
    }, function (res) {
        var data = "";
        res.on("data", function (d) { data += d; }); // capture all data
        res.on("end", function () {
            var jdata;
            try {
                jdata = JSON.parse(data);
            } catch (e) {

                /* if the json fails */
                helpers.log("Failed to parse JSON", data);
                return;
            }

            if (callbackFunction) {
                callbackFunction(jdata);
            }
        });
    });
}

/* grab list of shards from OpenPoll API server */
lib.getShards = function (callbackFunction) {
    lib.queryAPIServer("getshards", function (jdata) {
        lib.saveShards(jdata); // save the new list
        lib.shardList = jdata; // quick access

        /* pass the new list back to callback function if provided */
        if (callbackFunction) {
            callbackFunction(jdata);
        }
    });
}

/* request details about shard (peers/miners/blocks?)*/
lib.queryShardData = function (shardID, ) {
    if (!lib.shardList[shardID]) {
        /* ERROR POINT INVALID SHARD */

        return false;
    }
    lib.queryAPIServer(`shard/${shardID}/latest`, function (jdata) {
        console.log(jdata);
    });
}

lib.generateLatestBlock = function (shardID) {
    var dat = lib.shardList[shardID];
    var previousBlock = dat.blocks[dat.localChainLength];
    var newBlock = lib.generateBlankBlock();
    newBlock.prevHash = shardBlockHelpers.hashWithNonce(previousBlock, "0");
    newBlock.pollHash = shardID;

    /* SET MINER ADDRESS */
    newBlock.minerAddress = "bullshit address";
    console.log("SHARD BLOCK:", newBlock);
    return newBlock;
}

lib.startMining = function (shardID) {
    if (!lib.shardList[shardID]) {
        return false;
    }
    var dat = lib.shardList[shardID];
  //  var previousBlock = dat.blocks[dat.localChainLength];
    var block = lib.generateLatestBlock(shardID);

    var powC = global.POWController;
   // powC.currentBlock = block;

    powC.MinerCommand("mine");  //tell cpp miner we are mining a shard
    powC.MinerCommand(shardID); //tell cpp miner the unique shardid
    powC.MinerCommand(powC.maxHashString); //tell cpp miner the dificulty of this shard block
    for (var v of shardBlockHelpers.orderedHashFields(block)) {
        powC.MinerCommand(v);
    }
    powC.MinerCommand("done");
}

/*
  This updates a provided shard chain with current information by fetching
  blocks it does not have
*/
lib.getLatestBlock = function (shardID, block = undefined) {
    // If the local client is not mining that shard
    // TODO: Don't read directly from memory, use shard data library call
    if (!lib.shardList[shardID]) {
        return false;
    }

    // If the block provided does not exist..
    if (block === undefined) {
        // Start with the genesis block
        block = "0".repeat(64);
    }

    // Query the API server
    // TODO: Convert this API call to P2P communication
    lib.queryAPIServer(`shard/${shardID}/nextblock/${block}`, function (shardBlockObj) {

        // If we haven't yet stored that block
        // TODO: Don't read directly from memory, use shard data library call
        if (!lib.shardList[shardID].blocks[block]) {
            lib.shardList[shardID].blocks[block] = {};
        }

        // Validate the schema of this block
        var objValidation = shardBlockHelpers.validateSchema(shardBlockObj);

        if (objValidation.errors) {
            throw {
                name: "InvalidShardBlockRetrieved",
                message: "when retrieving the latest block associated with a shard, a block was retrieved that did not conform to schema"
            };
        }

        // Confirm the block received actually precedes the block we inputted
        if (shardBlockObj.prevHash !== block) {
            throw {
                name: "IncorrectBlockRetrieved",
                message: "when retrieving successive block, a non successive block was returned"
            }
        }

    });
};

// Expot the library
module.exports = lib;
