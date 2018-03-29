var hook = require("../hook");
var level = require("level");
var axios = require("axios");
var helpers = require("../shard/helpers");

var ShardLogicController = undefined;

var db = {
    blockByHash: level("./db/blockbyhash"),
    blockByID: level("./db/blockbyid"),
}
var lib = {};

// reference object used to quickly cache blocks by hash
lib.BlocksByHash = {};
// reference object used to quickly determine longest chain in a shard
lib.BlocksIDShards = {};

/* this function will do all the hard work for us*/
lib.GetBlockByHash = async function (hash, peer) {
    return new Promise(async function (resolve) {
    // Check local cache and see if we have this block
        if (lib.BlocksByHash[hash]) {
            resolve( lib.BlocksByHash[hash]);
        }
        // Check the database for the block
        db.blockByHash.get(hash, async function (err, value) {
            if (!err) {
                try {
                    var block = JSON.parse(value);
                    // We found the block, all is good!
                    resolve(block);
                } catch (err) { }
            }
            // We don't have the block
            if (peer) {
                try {
                    var resp = await axios.get(`http://${peer}/block/${hash}`);
                    if (!resp.data) { resolve(false); }

                    resolve(resp.data);
                } catch (err) {
                    resolve(false);
                }
            } else {
                resolve(false);
            } 
        });
    })
}

/* add block locally once it has been verified */

// The only way for a block to be added is if the chain leads back to the genesis, this forces block validity
lib.AddBlock = async function (block) {
    var pollHash = block.pollHash;
    var blockID = block.blockId;
    var prevHash = block.prevHash;
    var blockHash = block.hash;

    // create list for specific poll if not exist;
    lib.BlocksIDShards[pollHash] = lib.BlocksIDShards[pollHash] || {};

    var BlockList = lib.BlocksIDShards[pollHash];
    // create entry for specific blockid if not exist;
    BlockList[blockID] = BlockList[blockID] || {};
    // add blockhash to blockid list
    BlockList[blockID][blockHash] = block;

    lib.BlocksByHash[blockHash] = block;
    // save the blockhash permanently since it is validated
    db.blockByHash.put(blockHash, JSON.stringify(block));
    // update and save chain locally, we can pick longest chain to mine
    db.blockByID.put(pollHash, JSON.stringify(BlockList));
   // console.log(lib.BlocksByHash);
    console.log("verified block", blockHash, blockID );

    lib.BlocksIDShards[pollHash] = BlockList;

    
}

/* this is a recursive function that will validate a block all the way to the genesis,
if it fails for any reason we know the chain is invalid.
this allows for multiple chains (forks) so we can choose the longest chain to mine on*/

lib.ValidateBlock = async function (block, peer) {
    var pollHash = block.pollHash;
    var blockID = block.blockId;
    var prevHash = block.prevHash;
    var blockHash = block.hash;


    if (pollHash == undefined || blockID == undefined || prevHash == undefined || blockHash == undefined) {
        console.log("invalid block", pollHash, blockID, prevHash, blockHash);
        // invalid block?
        return false;
    }

    if (lib.BlocksByHash[blockHash]) {
        // everything before this block has already been verified
        // the only way for a block to be inside this object is if they made a chain all the way back to the genesis
        return true;
    }

    if (blockID == 0) {
        // we are the genesis block
        return true;
    }
    // check the blocks hash asap;
    if (!ShardLogicController.POWController.CheckDiff(block)) {
        console.log("invalid hash");
        // hash does not meet difficulty requirement
        return false;
    }

    // hash does not match watch was sent originally
    if (blockHash != block.hash) {
        console.log("invalid hash2");
        return false;
    }
    var previousBlock;

    if ((blockID - 1) == 0) {
        // generate a genesis (you will not ask anyone for a genesis as EVERYONE will agree on what the genesis should be)
        previousBlock = ShardLogicController.POWController.generateGenesis(pollHash);
    } else {
        previousBlock = await lib.GetBlockByHash(prevHash, peer);
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

    // Check if the hash is invalid
    if (previousBlock.pollHash != pollHash) {
        console.log("pollhash does not match");
        return false;
    }

    var validated = await lib.ValidateBlock(previousBlock, peer);

    // block was validated so we can now store it locally permanently
    if (validated) {
        // adds current block to the list of blocks, this prevents forking by storing all possible chains and choosing the longest one
        //console.log("verified block?", block);
        await lib.AddBlock(block);
        return true;
    } else {
        console.log("failed to validate", block);
        return false;
    }
}

lib.loadBlocksForShard = async function (pollHash) {
    return new Promise((res) => {
        // load blocks from cache
        if (lib.BlocksIDShards[pollHash]) {
            return res(lib.BlocksIDShards[pollHash]);
        }

        //load from db if available
        db.blockByID.get(pollHash, function (err, value) {
            if (err) {
                res({});
            } else {
                try {
                    var data = JSON.parse(value);
                    lib.BlocksIDShards[pollHash] = data;
                    res(data);
                } catch (err) {
                    res({});
                }
            }
        });
    });
}

lib.getLongestChain = async function (pollHash) {
    var pollBlocks = await lib.loadBlocksForShard(pollHash);
    var latestBlock = Object.keys(pollBlocks).length;
    // if we dont have a chain we return the genesis
    if (latestBlock <= 0) {
        return ShardLogicController.POWController.generateGenesis(pollHash)
    }

    var blocks = pollBlocks[latestBlock];
    var lowestBlock = undefined;

    for (var hash in blocks) {
        if (lowestBlock == undefined) {
            lowestBlock = hash;
        }
        var hashInt = helpers.bigInt(hash, 256);
        if (hashInt.lesser(helpers.bigInt(lowestBlock, 256))) {
            lowestBlock = hash;
        }
    }

    // if more then one block is avail per block id, pick the lowest hash TEMP SOLUTION to forking
    return blocks[lowestBlock];
}
async function test() {
    //var block = await lib.GetBlockByHash("0000057d1e55cba24a5301f8f9b8040556877fb2ad6a14ab360c2960524940e4");
    // var test = await lib.ValidateBlock(block);
    var test = await lib.getLongestChain("8b64d8cb790cb33731bdd67e88f0c2dc46f01fbb5c0b3bf1dafe52af110224f8");
    console.log(test);
    var test = await lib.getLongestChain("8b64d8cb790cb33731bdd67e88f0c2dc46f01fbb5c0b3bf1dafe52af110224f8");
}
module.exports = function (dbs, controller) {
    ShardLogicController = controller;
    test();
    return lib;
}

