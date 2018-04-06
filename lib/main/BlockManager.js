/*
  Block Manager for main chain
  (c) 2018 OpenPoll Inc
*/

// define a temporary genesis block for the main chain
var GenesisBlock = {
    blockId: 0,
    timestamp: 0,
    prevHash: "",
    transactions: [],
    shards: [],
    minerAddress: "",
    // basic difficulty
    difficulty: "000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    nonce: 0,
    hash: "",
}

var MainLogicController = undefined;
var BlockManagerBase = require("../BlockManager");
var level = require("level");
var axios = require("axios");

var db = {
    blocksByID: level("./db/mainblocksbyid"),
}

var lib = {}


lib.TotalBlocks = 0;

lib.generateNextBlock = async function () {
    // create a blank block
    var blankBlock = Object.assign({}, GenesisBlock);

    // get the latest block on the chain
    var latestBlock = await lib.getLongestChain();
    // get the hash of the latest block
    var hash = await MainLogicController.BlockHelper.hash(latestBlock);

    // assign the previous hash to the new block we just generated
    blankBlock.prevHash = hash;
    blankBlock.blockId = latestBlock.blockId + 1;

    // return the new next block
    return blankBlock;
}
// get list of blocks by specified blockID (possible forks)
lib.getBlocksByID = function (id) {
    return new Promise(function (resolve) {
        db.blocksByID.get(id, function (err, value) {
            // could not find blocks
            if (err) {
                return resolve(false);
            }
            // try to parse json of blocks
            try {
                return resolve(JSON.parse(value));
            }
            // failed
            catch (err) {
                return resolve(false);
            }
            
        });
    });
}

// determine the latest blockid based on keys in the db storage

lib.getLatestID = function () {
    return new Promise(function (resolve) {
        // start off with 0
        var high = 0;
        db.blocksByID.createKeyStream()
            .on('data', function (data) {
            // increase based on key value
            if (data > high){
                high = data;
            }
        }).on("close", function () {
            resolve(high);
        })
    })
}

// obtain latest block for the main chain

lib.getLongestChain = async function () {
    // get the latest block ids
    var latest = await lib.getLatestID();
    // latest is the genesis itself
    if (latest <= 0) {
        return GenesisBlock;
    }
    // list of blocks
    var blocks = await lib.getBlocksByID(latest);
    // use blockbasemanager to determine the latest block 
    var block = await BlockManagerBase.getLongestChain(undefined, blocks, latest);

    // return the block
    return block;
}

// Validate main chain block

lib.ValidateBlock = async function (block, peer) {
    var blockID = block.blockId;
    var prevHash = block.prevHash;
    var blockHash = block.hash;

    // If any fields are invalid, the block is invalid
    // TODO: Call the @openpoll/helpers Mainchain Block Validate function
    if (   blockID == undefined
        || prevHash == undefined
        || blockHash == undefined) {

        console.log("invalid block", blockID, prevHash, blockHash);
        return false;
    }

    if (blockID == 0) {
        // TODO: calc genesis verification here
        return true;
    }

    // If we already validated this block....
    if (BlockManagerBase.BlocksByHash[blockHash]) {
        return true;
    }

    var previousBlock;

    // If the N-1 block is the genesis block....
    if ((blockID - 1) == 0) {
        // Generate the genesis block (deterministic)
        // TODO: Change this function to use @openpoll/helpers genesis block
        previousBlock = GenesisBlock;
    } else {
        // Get the previous block
        previousBlock = await BlockManagerBase.GetBlockByHash(prevHash, peer);
    }

    // Make sure we have the previous block
    if (!previousBlock) {
        console.log("no previous block?");
        return false;
    }

    // Make sure the block id is >= 0
    if (previousBlock.blockId != (blockID - 1)) {
        console.log("invalid blockid?", blockID, prevHash, previousBlock);
        return false;
    }


    // Attempt to validate the N-1 Block
    var validated = await lib.ValidateBlock(previousBlock, peer);

    // If the block was invalid
    if (!validated) {
        console.log("failed to validate", block);
        return false;
    }
    // get previous blocks saved by this ID
    var blocks = await lib.getBlocksByID(blockID);
    blocks = blocks || {};
    blocks[blockHash] = block;

    // perm store blocks
    db.blocksByID.put(blockID, JSON.stringify(blocks)); 
    // add block to local storage
    await BlockManagerBase.AddBlock(block);

    return true;
}

async function test() {
    var latestBlock = await lib.getLongestChain();
    console.log("latest:",latestBlock)
}

module.exports = function (dbs, controller) {
    MainLogicController = controller;
    test();
    return lib;
}