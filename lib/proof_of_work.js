
var hook = require("./hook");
var helpers = require("./shard/helpers");
var ShardBlockHelper = require('@openpoll/helpers').shardBlock;
var MainBlockHelper = require('./main/main_block');
var VersionManager = require("./VersionManager");

var ShardLogicController = undefined; // gets assigned after module is loaded
var MainLogicController = undefined;
//shardBlockHelpers.shardAPI = require("./NetworkModuleAPI");

// POWController is a Singleton
if (global.POWController) {
    module.exports = global.POWController;
    return;
}

var POWControl = {};
POWControl.maxHashString = "00000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
POWControl.maxHashNumber = helpers.bigInt(POWControl.maxHashString, 256);

POWControl.CurrentShards = {};

/*
    
*/
hook.Add("updateMinerStatus", "RefreshShard", async function (shardID) {
    if (ShardLogicController.WorkedShardsModule.workingOnShard(shardID)) {
        POWControl.StartMining(shardID);
    }
});

/*
    Perform a block base difficulty check
    TODO: Change this function to say CheckBaseDiff
*/ 
POWControl.CheckDiff = function (block) {
    // IF ANYTHING BREAKS
    // CHANGE TRUE TO FALSE
    var hash = ShardBlockHelper.hash(block, ignoreNonce = true );

    // Convert the hash to a BigInt for comparison purposes
    var hashInt = helpers.bigInt(hash, 256);

    // Ensure the hash is at least the base difficulty
    if (hashInt.lesserOrEquals(POWControl.maxHashNumber)) {
        return true;
    }

    // The difficulty was not high enough...
    return false;
}

/*
    When the miner did the required wort for a provided block, this function is called
    with the corresponding shard id and nonce which creates a difficulty with the required hash
*/ 
POWControl.OnHashMined = async function (shardID, nonce) {
    // Generate the latest block
    var block = await POWControl.generateLatestBlock(shardID);
    block.nonce = nonce;

    // Hash the new block
    // CHANGE NONCE
    var hash = undefined;
    if (shardID == "mainchain") {
        hash = MainLogicController.BlockHelper.hash(block);
    } else {
        hash = ShardBlockHelper.hash(block, ignoreNonce = true);
    }
    // Convert hash to a BigInt for comparison purposes
    var hashInt = helpers.bigInt(hash, 256);

    // TODO: CONVERT THIS TO USE INCREMENTAL PROOF OF WORK
    if (hashInt.lesserOrEquals(POWControl.maxHashNumber)) {
        // The block work was performed successfully
        helpers.log("HASH IS SUCCESS: " + hash);

        // Broadcast the new block to peers
        if (shardID == "mainchain") {
            await MainLogicController.p2p.broadcastBlock(block);
        } else {
            await ShardLogicController.p2p.broadcastBlock(shardID, block);
        }
        // Start mining the new block
    } else {
        console.log("HASH FAILURE: " + hash);

    }
    POWControl.StartMining(shardID);
}

/*
    Run a command on the miner 
*/ 
POWControl.MinerCommand = function (cmd) {
    // If the miner isn't running, create the miner
    if (POWControl.miner == undefined) {
        POWControl.CreateMiner();
    }

    // Send the command via standard input
    POWControl.miner.stdin.write(`${cmd}\0`);
}

/*
    Stop the miner from mining a specific hash
    This does not close the miner totally
*/ 
POWControl.StopMining = function (pollHash) {
    // If the miner doesn't exist, create the miner
    if (POWControl.miner == undefined) {
        POWControl.CreateMiner();
        return;
    }

    // Stop mining the provided hash
    POWControl.MinerCommand("stophash");
    POWControl.MinerCommand(pollHash);
}

/*
    | WINDOWS ONLY FUNCTION |

    This function will create a miner slave client child process
*/ 
POWControl.CreateMiner = function () {
    // If the miner already exists, kill the miner
    // TODO: Create notification for the miner GUI interface
    if (POWControl.miner != undefined) {
        POWControl.miner.kill();
    }

    // Spawn the child process
    POWControl.miner = helpers.child_process.spawn(process.env.POW_SLAVE_PROC);

    // Hook standard output
    POWControl.miner.stdout.on('data', (data) => {
        
        var args = [];
        var i = 0;

        // Seperate by the '|' character and get arguments
        // (controlled environment, don't worry)
        data.toString().split("|").map(function (v) {
            args[i] = v;
            i++;
        });

        // The slave performed the required work for a new block to be authored
        if (args[0] == "done") {
            POWControl.OnHashMined(args[1], args[2]);
            return;
        }
        
        // The miner is outputting some information....
        // TODO: Hook this into the miner GUI
        console.log("[" + helpers.chalk.cyan("MINER") + "]", data.toString());

    });

    // When the miner closes...
    POWControl.miner.on('close', (code) => {
        POWControl.miner = undefined;
        helpers.log("MINER CLOSED? : "+code)
    });
}

/*
    TEMP FUNCTIONS
    SOON TO BE DEPRECATED AFTER USING @openpoll/helpers GENESIS GENERATION
*/

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

POWControl.generateBlankBlock = function () {
    var newblock = Object.assign({}, blankMeta);
    return newblock;

}

/*
    This function generates a blank genesis block
    TODO: Convert to using the genesis generator in @openpoll/helpers
    https://github.com/opoll/openpoll-helpers/blob/master/helpers/poll.js -- line 38ish
*/ 
POWControl.generateGenesis = function (pollHash) {
    var genesis = POWControl.generateBlankBlock();
    genesis.pollHash = pollHash;
    genesis.ledger = {
        entries:{},
    }
    return genesis;
}

/*
    This function creates a blank block and assigns information to it
    It does not create a *valid* block as no work is being performed. However,
    this function perfoms an unworked block for a slave to begin work on
*/
POWControl.generateLatestBlock = async function (shardID) {
    // Get the list of active sahrds
    var newBlock = undefined;

    if (!shardID || shardID == "mainchain") {
        newBlock = await MainLogicController.BlockManager.generateNextBlock();

    } else {
        newBlock = await ShardLogicController.BlockManager.generateNextBlock(shardID);
       /*
        DEPRICATED
        var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();
        // Get the current block on the longest chain
        var currentBlock = await ShardLogicController.BlockManager.getLongestChain(shardID);
   
        // Create a new block based on the latest known valid block
        newBlock = POWControl.generateBlankBlock();
        newBlock.prevHash = currentBlock.hash;
        newBlock.pollHash = shardID;
        newBlock.blockId = currentBlock.blockId + 1;*/

        
    }
   
    /* TODO: SET MINER ADDRESS */
    // TODO: Include a set of responses into the block
   
    /* get list of responses not yet in a block */
    newBlock.minerAddress = "blank address";
   // console.log(newBlock);
    //console.log("NEW BLOCK?:", newBlock);
    // Return the new block
    return newBlock;
}

/*
    When called this function will trigger the miner to start mining
    a provided shard (given by the shard hash)
*/ 
POWControl.StartMining = async function (shardID) {
    
    var helper = undefined;
    var block = undefined;

    // if the blockchain is a shard
    if (shardID && shardID != "mainchain") {
        // Get the hash of active shards
        var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();

        // If this shard is not active...
        if (!activeShards[shardID]) {
            helpers.log("attempt to mine a nonexistant / inactive shard!")
            return false;
        }

        // Wait to generate the latest block associated with this shard
        block = await POWControl.generateLatestBlock(shardID);
        helper = ShardBlockHelper;

    } else {
        helper = MainBlockHelper;
        block = await POWControl.generateLatestBlock("mainchain");

        if (VersionManager.RequireUpdate(block.blockId)) {
            console.log("Mining operation has ceased because this client is out of date.")
            return false;
        }
    }

    // Direct the miner to begin mining a shard
    POWControl.MinerCommand("mine");
    POWControl.MinerCommand( shardID || "mainchain");

    // Send the difficulty to the miner slave
    POWControl.MinerCommand(POWControl.maxHashString);

    // Send all fields to be contained in the hash to the slave
    // TODO: Change ignoreNonce to TRUE if shit breaks
    for (var v of helper.orderedHashFields(block, ignoreNonce = (!shardID ||shardID=="mainchain")&&true||false)) {
        POWControl.MinerCommand(v);
    }

    // Tell the slave to start working
    POWControl.MinerCommand("done");
}

// Singleton
global.POWController = POWControl;

// Start the proof of work proxy
POWControl.StartProxy = function() {
  var proxy = require( './proxy' )( POWControl );
}

// Export PoW module
module.exports = function (databases, controller, maincont) {
    ShardLogicController = ShardLogicController || controller;
    MainLogicController = MainLogicController || maincont;
    return POWControl;
}
