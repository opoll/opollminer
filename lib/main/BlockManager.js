
var level = require("level");
var axios = require("axios");

/*
    Mainchain Block Manager
    (c) 2018 OpenPoll Inc
    ==============================================================================
    This block manager is responsible for maintaining the state of the blockchain for
    the OpenPoll main blockchain. The OpenPoll main blockchain handles transactions
    and a permanant digest of completed polls for latent validation.
*/

var lib = {}

/*
    A baked genesis block for the OpenPoll Main Blockchain
*/
var GenesisBlock = {
    blockId: 0,
    timestamp: 0,
    prevHash: "",
    transactions: [],
    shards: [],
    ledger: {
        wallets: {
            "OPEN126dbcLy5hvyYPXfie1DuC5myHdXLZun2UVM3BauPOLL": 10000,
        },
        transactions:{

        },
    },
    minerAddress: "",
    difficulty: "000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    nonce: 0,
    hash: ""
}

// Inject the main logic controller
var MainLogicController = undefined;

// Get the base block manager
var BlockManagerBase = require("../BlockManager")();

// Local DB Files
var db = {
    blocksByID: level("./db/mainblocksbyid"),
}

// Provide list of shards not yet placed in the mainchain
lib.GetShardPool = async function(){
    var pool = await MainLogicController.LedgerManager.getEntireShardPool();
    var latestBlock = await lib.getLongestChain();

    var shardLedger = await ledger.blockhashToShardLedger(latestBlock.hash);
}

/*
    Generate the next block for the mainchain. This method takes the latest
    block (using getLongestChain) and gathers all 'new' data which should be included
    in this block from helper functions.

    -> Returns the next block, does not begin mining
*/

lib.generateNextBlock = async function () {
    // Create a blank block
    var blankBlock = Object.assign({}, GenesisBlock);

    // Determine the latest block
    var latestBlock = await lib.getLongestChain();

    // Recompute the hash of the latest block
    var hash = await MainLogicController.BlockHelper.hash(latestBlock);

    // Set default fieldss
    blankBlock.prevHash = hash;
    blankBlock.blockId = latestBlock.blockId + 1;
    blankBlock.ledger = Object.assign({}, latestBlock.ledger);
    // TODO: Add timestamp, add shards, add miner addres

    // Set the transactions based on the pool
    blankBlock.transactions = await MainLogicController.TransactionManager.GetPool();
    blankBlock.shards = await MainLogicController.BlockManager.GetShardPool();
    console.log("block", hash, blankBlock);
    // return the new next block
    return blankBlock;
}

// Return an array of all blocks associated with the given block id
lib.getBlocksByID = function (id) {
    return new Promise(function (resolve) {
        // Query the Level DB block id -> blocks mapping
        db.blocksByID.get(id, function (err, value) {
            // could not find blocks
            if (err) {
                return resolve(false);
            }

            // try to parse json of blocks
            try {
                return resolve(JSON.parse(value));
            } catch (err) {
                return resolve(false);
            }
        });
    });
}

// Determine the latest blockid based on keys in the db storage
// TODO: Create a DB-based cache for this which stores the highest known & verified block id
lib.getLatestID = function () {
    return new Promise(function (resolve) {
        var high = 0;
        db.blocksByID.createReadStream({ keys: true, values: false })
            .on('data', function (data) {
            if (parseInt(data) >= parseInt(high)) {
                high = data;
            }
        }).on("close", function () {
            resolve(high);
        })
    })
}

// Get the latest known block on the mainchain
lib.getLongestChain = async function () {
    // Get the length of the longest chain(s)
    var latest = await lib.getLatestID();
   
    // If there are no blocks outside the genesis on the longest chain
    if (latest <= 0) {
        return GenesisBlock;
    }

    // Get a list of blocks that are all 'longest chains'
    var blocks = await lib.getBlocksByID(latest);
    
    // Use BaseBlockManager to determine the latest block  (aka, determine the best fork)
    var block = await BlockManagerBase.getLongestChain(undefined, blocks, latest);
    
    // Return the best known and latest block associated with the mainchain
    return block;
}

/*
    This function validates a block on the main chain. It does the following checks:

    1) Checks that all required fields are present, and the block conforms to schema
    2) Recompute the block hash, validate it is correct
    3) Looks in cache to see if the block was already validated
    4) Check the N-1 block and make sure that one is valid
    5) TODO: Timestamp Validation - don't alllow a block that is too old
    6) TODO: Validate all shards included
    7) TODO: Validate all transactions

    When all checks are done, a ledger corresponding to this block must be created:

    1) Make a copy of the previous ledger
    2) TODO: Add all shard hashes processed in this block to the ledger
    3) Add all txn hashes processed in this block to the ledger
    4) TODO: Update all UTXO's (account balances) based off completed shards
    5) TODO: Update all UTXO's based off spent transactions
*/
lib.ValidateBlock = async function (block, peer) {
    var previousBlock;
    var blockID = block.blockId;
    var prevHash = block.prevHash;
    var blockHash = block.hash;

    // If any fields are invalid, the block is invalid
    // TODO: Call the @openpoll/helpers Mainchain Block Validate function
    if (   blockID == undefined
        || prevHash == undefined
        || blockHash == undefined) {

        console.log("invalid main block", blockID, prevHash, blockHash);
        return false;
    }

    // Is this block the genesis?
    if (blockID == 0) {
        // TODO: calc genesis verification here
        return true;
    }

    // Recompute the hash
    var hash = await MainLogicController.BlockHelper.hash(block);

    if (hash !== blockHash) {
        console.log("invalid mainchain block; bad hash provided");
        return false;
    }

    // If we already validated this block....
    // so are you now no longer supporting evolve?
    if (BlockManagerBase.BlocksByHash[blockHash]) {
        return true;
    }

    // If the N-1 block is the genesis block....
    if ((blockID - 1) == 0) {
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

    // Make sure the block id actually corresponds to the previous block
    if (previousBlock.blockId != (blockID - 1)) {
        console.log("invalid blockid?", blockID, prevHash, previousBlock);
        return false;
    }

    // Attempt to validate the N-1 Block
    var validated = await lib.ValidateBlock(previousBlock, peer);

    // If the block was invalid
    if (!validated) {
        console.log("failed to validate previous block", block);
        return false;
    }

    // TODO: Validate shards contained in this block
    // If the block being validated is more than N away from the longest chain,
    // it does not validate the shards. This N should be a config variable.

    /*
        TODO: Validate transactions contained in this block
        A) Check the transaction was not already included in a previous block, this is done
            by checking the ledger of the previous block.

        DO NOT CHECK IF THEY HAVE ENOUGH FUNDS FOR THE TRANASCTION HERE.
        The way you should prevent 'double spending' should be to just validate
        all transactions are valid (signed, schema, etc). Then create the ledger for
        the new block (below). Once the ledger for the new block is created, loop through
        all addresses that were modified and make sure they have a balance >= 0. If any account
        that was modified has a negative balance, then the block is not valid. Do not loop through
        every address in the ledger as there can be millions of addresses. You should also remove any
        addresses from the ledger when the balance is less than 0.000000000000001 POL. Do not check for
        exactly zero as in many cases it will be super small but not zero.
        -> If you have questions ask Zack as this is important
    */ 

    /*
     * The block has been validated by this point in time. Now a ledger
     * must be created for the new block.
     */

    // block.ledger is automatically a copy of the previous block ledger
    // TODO: Convert this to a LevelDB Copying... https://github.com/opoll/opollminer/issues/58
   
   /* 
     DEPRICATED
   var ledger = Object.assign({}, block.ledger);

    // Add transactions to the new ledger
    for( var transHash in block.transactions ) {
        var trans = block.transactions[transHash];
        ledger.transactions[transHash] = true;

        ledger.wallets[trans.senderAddress] = parseFloat(ledger.wallets[trans.senderAddress]) - parseFloat(trans.amount);
        ledger.wallets[trans.receiverAddress] = parseFloat(ledger.wallets[trans.receiverAddress] || 0) + parseFloat(trans.amount);
    }

    // Reference the ledger on this block
    // TODO: https://github.com/opoll/opollminer/issues/58
    block.ledger = ledger;*/

    /*
     * Long term block storage, caching, etc etc.
     * TODO: Create a cached variable representing the longest chain, and update here
     */

    // Get all blocks which have the same id as this block
    var blocks = await lib.getBlocksByID(blockID);
    blocks = blocks || {};
    blocks[blockHash] = block;

    // Add this block to the array of blocks with id X
    db.blocksByID.put(blockID, JSON.stringify(blocks));
    
    // Add this block to local storage
    await BlockManagerBase.AddBlock(block);

    return true;
}

/*
    Given an entire shard blockchain, validate if the shard is
    valid or invalid.
*/
lib.ValidateShard = async function (shardID, shardChain) {

    // maybe check total length to prevent abuse?

    /*
    if (Object.keys(shardChain).length > 99999){
        // no chain should be longer then 99999
        return false;
    }
    */

    /*
        Loop through all blocks in the shard blockchain and validate
        each block.
    */
    for (var blockID in shardChain) {
        // This is checking the block chain in reverse. 1+N instead of N-1
        var block = shardChain[blockID];

        // these might get transfered with the shard itself, we will determine them.
        delete block.ledger;    
        delete block.isLastBlock;

        // use shard validation
        var validated = await BlockManagerBase.ValidateBlock(block);

        // Failed to validate a block, entire chain is now invalid;
        if (!validated) {
            return false;
        }
    }

    // Get the latest block number
    var latestBlockNumber = Object.keys(shardChain).length;
    // get the latest block itself
    var latestBlock = shardChain[latestBlockNumber];

    await MainLogicController.LedgerManager.UpdateShardPool(shardID, block.hash);

    return true;
}

async function test() {
    var latestBlock = await lib.getLatestID();
  //  console.log("latest:",latestBlock)

    var amount = await MainLogicController.WalletManager.getAmount("OPEN1qwWH8qWFk9RReqERVQr3jqUJWf4QZH34iQw8BYPOLL");
    console.log("wallet amount", amount)
    
}

module.exports = function (dbs, controller) {
    MainLogicController = MainLogicController || controller;
    test();
    //var amount = await WalletManager.getAmount("0x001");
    //console.log("wallet amount", amount)
    return lib;
}


