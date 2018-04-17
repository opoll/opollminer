
/*
  Block Manager
  (c) 2018 OpenPoll Inc
  ==============================================================================
  The block manager handles core blockchain functionality including fork resolution,
  updating, ledger creation, etc etc.
*/

// Include modules
var hook = require("../hook");
var level = require("level");
var axios = require("axios");
var helpers = require("../shard/helpers");

var ShardLogicController = undefined;

var db = {
    blockByHash: level("./db/blockbyhash"), // K Hash -> V Any Block Historically
    blockByID: level("./db/blockbyid") // K PollHash --> K Id # -> V [ Blocks ]
}
var lib = {};

// Reference object used to quickly cache blocks by hash
lib.BlocksByHash = {};

// Reference object used to quickly determine longest chain in a shard
lib.BlocksIDShards = {};

// Quickly get ledger for a block by hash
lib.LedgersByBlockHash = {}

/*
    Given a hash this function will return the given block. It will check
    three levels of storage:
        (1) locally cached in memory
        (2) locally stored in database
        (3) remotley stored on a peer (provided)

    ** THIS FUNCTION MAY RETURN AN INVALID BLOCK - NO VALIDATION
*/ 
lib.GetBlockByHash = async function (hash, peer) {
    return new Promise(async function (resolve) {
        // Check to see if we have this stored in memory
        if (lib.BlocksByHash[hash]) {
            resolve(lib.BlocksByHash[hash]);
            return;
        }

        // Check the database for the block
        databases.BlockByHash.get(hash, async function (err, value) {
            // If the block was recieved
            if (!err) {
                // Attempt to parse the JSON
                try {
                    var block = JSON.parse(value);

                    // Resolve with the block from the database
                    resolve(block);
                    return;
                } catch (err) {}
            }

            // If the block was not found
            if (peer) {
                // Attempt to query the remote peer
                try {
                    var resp = await axios.get(`http://${peer}/block/${hash}`);

                    // If the peer gave no response, block was not found
                    if (!resp.data) {
                        return resolve(false);
                    }

                    // Block was sent by the peer
                    return resolve(resp.data);
                } catch (err) {
                    // Could not find the block
                    resolve(false);
                    return;
                }
            } else {
                // Could not find the block (no peer specified)
                resolve(false);
                return;
            } 
        });
    })
}

/*
    Given a block, ValidateBlock will validate if the block is valid or not.
    In order to determine if a block N is valid, block N-1 must be known. Therefore,
    ValidateBlock will recurse and call ValidateBlock( N-1 ) until all predecesor
    blocks have been validated (1, 2, ...., N-1) until validating Block N.
    If any block (1, 2, ..., N) cannot be validated, the block will be invalid.
*/
lib.ValidateBlock = async function (block, peer) {
    // Get some simple fields
    var pollHash = block.pollHash;
    var blockID = block.blockId;
    var prevHash = block.prevHash;
    var blockHash = block.hash;

    // If any fields are invalid, the block is invalid
    // TODO: Call the @openpoll/helpers ShardBlock Validate function
    if (    pollHash == undefined
            || blockID == undefined
            || prevHash == undefined
            || blockHash == undefined
            || block.responses == undefined)
    {
        console.log("invalid block", pollHash, blockID, prevHash, blockHash);
        return false;
    }

    // If we already validated this block....
    if (lib.BlocksByHash[blockHash]) {
        return true;
    }

    // If this is the genesis block
    // TODO:  REFACTOR THIS LATER TO ACTUALLY COMPARE GENESIS BLOCKS
    if( blockID == 0 ) {
        // Generate a genesis block for the given poll
        //var genesis = ShardLogicController.POWController.generateGenesis(pollHash);

        // If the hashes equal...
        //return (genesis.hash == blockHash);

        return true;
    }

    // Check the block base hash difficulty (trivial check)
    if (!ShardLogicController.POWController.CheckDiff(block)) {
        console.log("incorrect difficulty");
        return false;
    }

    // hash does not match watch was sent originally
    if (blockHash != block.hash) {
        console.log("invalid hash2");
        return false;
    }

    // A reference to the N-1 block
    var previousBlock;

    // If the N-1 block is the genesis block....
    if ((blockID - 1) == 0) {
        // Generate the genesis block (deterministic)
        // TODO: Change this function to use @openpoll/helpers genesis block
        previousBlock = ShardLogicController.POWController.generateGenesis(pollHash);

        // Generate a blank ledger object (https://schemas.openpoll.io/0.1/shard/ledger.json)
        previousBlock.ledger = {
            blockId: 0,
            blockHash: previousBlock.hash,
            pollHash: pollHash,
            size: 0,
            entries: {}
        };
    } else {
        // Get the previous block
        previousBlock = await lib.GetBlockByHash(prevHash, peer);
    }

    // Check if the block has no responses
    if (Object.keys(block.responses || {}).length <= 0) {
        console.log("block has no responses");
        //return false;
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

    // Check if the previous hash is valid
    if (previousBlock.pollHash != pollHash) {
        console.log("pollhash does not match");
        return false;
    }

    // Attempt to validate the N-1 Block
    var validated = await lib.ValidateBlock(previousBlock, peer);

    // If the block was invalid
    if (!validated) {
        console.log("failed to validate", block);
        return false;
    }

    /*
        MASSIVE TODO:
        CHECK INCREMENTAL PROOF OF WORK FOR THE Nth BLOCK BASED ON THE (1...N-1) BLOCKS
        ALGO TBD
    */
    
    // Create a clone of the ledger for the N-1 Block
    var newLedger = Object.assign({}, previousBlock.ledger);

    // Update the N-1 block ledger to create the Nth ledger
    newLedger.blockId = block.blockId;
    newLedger.blockHash = block.hash;

    // Add all responses in the Nth block to the N-1th ledger
    for (var responseHash in block.responses || {}) {
        // Make sure this response was not already included
        if (newLedger.entries[responseHash]) {
            console.log("duplicate response found in a previous block");
            return false;
        }

        // MAJOR TODO
        // ENHANCED RESPONSE VALIDATIONS

        // Add the response to the ledger
        newLedger.entries[responseHash] = Object.assign({}, block.responses[responseHash]);
    }

    // References the Nth ledger in the Nth block
    block.ledger = newLedger;

    // check if we have reached max responses for shard?

    /*
    var totalResponses = Object.keys(newLedger.entries).length;
    if (totalResponses == shard.maxResponses) {
        // call completed function?
    }
    // check if responses is greater then max
    if (totalResponses > shard.maxResponses) {
        console.log("too many responses, invalid block?");
        return false;
    }
    */

    // The block validation is complete, add it
    await lib.AddBlock(block);

    // The block has been validated
    return true;
}

/*
    THis function will load all blocks for the provided shard, indexed by their
    numeric identifiers. It checks local storage and database storage, it does
    not make any remote calls.
*/ 
lib.loadBlocksForShard = async function (pollHash) {
    return new Promise((res) => {
        // If the blocks are indexed by shard for the provided poll hash
        if (lib.BlocksIDShards[pollHash]) {
            return res(lib.BlocksIDShards[pollHash]);
        }

        // Load blocks associated with the given poll hash from the DB
        db.blockByID.get(pollHash, function (err, value) {
            // If we could not load blocks associated with that poll hash
            if (err) {
                return res({});
            }

            // Attempt to parse the data
            try {
                // Parse the data
                var data = JSON.parse(value);

                // Cache the data 
                lib.BlocksIDShards[pollHash] = data;

                // Resolve with the data
                return res(data);
            } catch (err) {
                // Error parsing the JSON
                return res({});
            }
        });
    });
}

/*
    This function will return the longest blockchain for the provided poll hash
    A given shard may have multiple blocks associated with the same numeric identifier
    in the event of a fork. This function plays a key role in fork resolution.
*/ 
lib.getLongestChain = async function (pollHash) {
    // Load all blocks associated with the given shard / poll
    var pollBlocks = await lib.loadBlocksForShard(pollHash);

    // Get the latest block numeric ID
    var latestBlock = Object.keys(pollBlocks).length;

    // If we don't have the genesis block, the longest is the genesis.....
    if (latestBlock <= 0) {
        return ShardLogicController.POWController.generateGenesis(pollHash)
    }

    // Get all blocks associated with this specific numeric block id
    var blocks = pollBlocks[latestBlock];
    var lowestBlock = undefined;

    // Go through all blocks with this associated ID
    for (var hash in blocks) {
        // If there is no lowest block hash, set it..
        if (lowestBlock == undefined) {
            lowestBlock = hash;
        } else {
            // Convert the hash to a BigInt for comparison purposes
            var hashInt = helpers.bigInt(hash, 256);

            // If the given hash is lower, set the lowest block
            if (hashInt.lesser(helpers.bigInt(lowestBlock, 256))) {
                lowestBlock = hash;
            }
        }
    }

    // if more then one block is avail per block id, pick the lowest hash TEMP SOLUTION to forking
    return blocks[lowestBlock];
}

/*
    Return the entire blockchain based on a provided block hash
    This function will call recursivley until all blocks in the associated
    chain are identified and found.

    ** ONLY CALL THIS FUNCTION ON VERIFIED BLOCKS, POOR ERROR HANDLING
*/
lib.getEntireChain = async function ( blockHash ) {
    // Get the block based on the hash 
    var block = await lib.GetBlockByHash(blockHash);

    // Handle the base case (block id = 1)
    if (block.blockId == 1) {
        return [ block ];
    }

    // Get the n-1 blockchain
    var array = await lib.getEntireChain(block.prevHash)

    // Add the nth block onto the n-1 blockchain
    array.push(block);

    // Return the new blockchain
    return array;
}

/*
    This function is called automatically by ValidateBlock to store valid blocks
    locally in the database, as well as in caches.

    ** ONLY CALL THIS FUNCTION WITH A VERIFIED BLOCK
*/
lib.AddBlock = async function (block) {
    // Get some variables
    var pollHash = block.pollHash;
    var blockID = block.blockId;
    var prevHash = block.prevHash;
    var blockHash = block.hash;

    // create list for specific poll if not exist;
    lib.BlocksIDShards[pollHash] = lib.BlocksIDShards[pollHash] || {};

    // Get all blocks associated with this shard (indexed by block id)
    var BlockList = lib.BlocksIDShards[pollHash];

    // create entry for specific blockid if not exist;
    BlockList[blockID] = BlockList[blockID] || {};

    // add blockhash to blockid list
    BlockList[blockID][blockHash] = block;

    // cache in the lib
    lib.BlocksByHash[blockHash] = block;

    // save the blockhash permanently since it is validated
    db.blockByHash.put(blockHash, JSON.stringify(block));

    // update and save chain locally, we can pick longest chain to mine
    db.blockByID.put(pollHash, JSON.stringify(BlockList));

    // the block was fully verified
    console.log("verified block", blockHash, blockID);

    // store the updated block list
    lib.BlocksIDShards[pollHash] = BlockList;
}

/**
 * TESTING FUNCTION
 */
async function test() {
    //var block = await lib.GetBlockByHash("0000057d1e55cba24a5301f8f9b8040556877fb2ad6a14ab360c2960524940e4");
    // var test = await lib.ValidateBlock(block);
    var test = await lib.getLongestChain("8b64d8cb790cb33731bdd67e88f0c2dc46f01fbb5c0b3bf1dafe52af110224f8");
    lib.ValidateBlock(test);

    var chain = await lib.getEntireChain(test.hash);
    console.log(chain.length);

    var blocks = await lib.loadBlocksForShard("8b64d8cb790cb33731bdd67e88f0c2dc46f01fbb5c0b3bf1dafe52af110224f8");
    var forks = 0;
    for (var id in blocks) {
        if (Object.keys(blocks[id]).length > 1) {
            forks++;
        }
    }
    console.log("detected " + forks + " forks")
}

// Export our data
module.exports = function (dbs, controller) {
    ShardLogicController = controller;
    test();
    return lib;
}

