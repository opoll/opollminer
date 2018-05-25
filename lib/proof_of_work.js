
var hook = require("./hook");
var helpers = require("./shard/helpers");
var ShardBlockHelper = require('@openpoll/helpers').shardBlock;
var PollHelper = require('@openpoll/helpers').poll;
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
    var hash = ShardBlockHelper.hash(block);

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
    var block = POWControl.CurrentShards[shardID];//await POWControl.generateLatestBlock(shardID);
    block.nonce = nonce;

    // Hash the new block
    // CHANGE NONCE
    var hash = undefined;
    if (shardID == "mainchain") {
        hash = MainLogicController.BlockHelper.hash(block);
    } else {
        hash = ShardBlockHelper.hash(block);
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
        helpers.log(`ERROR: Proof of work miner closed! Error Code: ${code}`);
    });
}

/*
    This function generates a blank genesis block
    TODO: Use real poll timestamp?
*/ 
POWControl.generateGenesis = function( pollHash ) {
    // Get the poll object
    var POLL_GENESIS_BLOCK = {
        "blockId": 0,
        "pollHash": pollHash,
        "timestamp": 0,
        "prevHash": "0".repeat( 64 ),
        "responses": [],
        "minerAddress": "0".repeat( 64 ),
        "nonce": 0,

        // NOT SURE WHY WE NEED THIS??
        "ledger": {
            entries: {}
        }
    };

    // Hash the genesis block
    ShardBlockHelper.hash( POLL_GENESIS_BLOCK );

    // Use the poll helpers to generate the genesis block
    return POLL_GENESIS_BLOCK;
}

/*
    This function creates a blank block and assigns information to it
    It does not create a *valid* block as no work is being performed. However,
    this function perfoms an unworked block for a slave to begin work on
*/
POWControl.generateLatestBlock = async function (shardID) {
    // Get the list of active sahrds
    var newBlock = undefined;

    // If we are mining the mainchain...
    if ( !shardID || shardID == "mainchain" ) {
        newBlock = await MainLogicController.BlockManager.generateNextBlock();

    // If we are mining a shard...
    } else {
        newBlock = await ShardLogicController.BlockManager.generateNextBlock( shardID );       
    }

    // Make sure the block was generated..
    if( !newBlock ) {
        console.log( `ERROR: Could not generate new block for ${shardID}` );
        return false;
    }
   
    /* TODO: SET MINER ADDRESS */
    // TODO: Include a set of responses into the block
   
    /* get list of responses not yet in a block */

    // Set the address for this miner
    newBlock.minerAddress = "blank address";

    // Test print statement...
    console.log( `GENERATED NEW BLOCK FOR SHARD: ${shardID}` );
    console.log( newBlock );

    // Return the new block
    return newBlock;
}

/*
    When called this function will trigger the miner to start mining
    a provided shard (given by the shard hash)
*/ 

POWControl.isMining = function(id){
    if (POWControl.CurrentShards[id] != undefined){
        return true;
    }
    return false;
}

/*
    Called when this miner should begin mining a provided shard.
    This function may be called when this node is not up to date
    with the provided shard, which may require P2P downloading of the
    associated shard / main blockchain.
*/
POWControl.StartMining = async function( shardID ) {
    // The helper we will be using when processing blocks
    var helper = undefined;

    // The newly minted block for incorporation into the blockchain
    var newlyMintedBlock = undefined;

    // We're not mining atm
    delete POWControl.CurrentShards[shardID || "mainchain"];

    // If a shard is being mined...
    if( shardID && shardID != "mainchain" ) {
        // Get the hash of active shards
        var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();

        // If this shard is not active...
        if( !activeShards[shardID] ) {
            helpers.log("CRITICAL ERROR: attempt to mine a nonexistant / inactive shard!")
            return false;
        }

        // Wait to generate the latest block associated with this shard
        console.log( `Generating new block for shard: ${shardID}` );
        newlyMintedBlock = await POWControl.generateLatestBlock(shardID);
        helper = ShardBlockHelper;
    } else {
        helper = MainBlockHelper;

        // Get up to date
        console.log( `Generating new mainchain block` );
        newlyMintedBlock = await POWControl.generateLatestBlock("mainchain");
    }

    /*
        The shard block could not be mined, perhaps there were no responses
        TODO: Make sure this function gets called again...
    */
    if( !newlyMintedBlock ) {
        return false;
    }

    // Make sure we aren't already mining this shard...
    if( POWControl.CurrentShards[shardID || "mainchain"] ) {
        console.log( `A race condition occured, shard already being mined (${shardID})` );
        return false;
    }

    // Log the block currently being mined
    POWControl.CurrentShards[shardID || "mainchain"] = newlyMintedBlock;

    /*
        All the code after this point takes the generated block
        and sends it to the PoW controller to perform the required
        work according to the provided difficulty.
    */

    // Direct the miner to begin mining a shard
    POWControl.MinerCommand( "mine" );
    POWControl.MinerCommand( shardID || "mainchain");

    // Send the difficulty to the miner slave
    POWControl.MinerCommand( POWControl.maxHashString );

    // Send all fields to be contained in the hash to the slave
    for (var v of helper.orderedHashFields(newlyMintedBlock, ignoreNonce = true)) {
        POWControl.MinerCommand(v);
    }

    // Tell the slave to start working
    POWControl.MinerCommand( "done" );
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
