/*
  Main Chain Logic controller
  (c) 2018 OpenPoll Inc
  ==============================================================================
  The shard logic controller is responsible for handling all miner level node
  logic for the miner. It does not directly perform networking outside of calls
  to other libraries, and relies heavily on shard helper libraries. This logic
  controller is also responsible for handling all local data storage interactions
  including mem, HD, and remote data pulls.
*/


// External Libraries
var http = require('http');
var hook = require("../hook");
var level = require("level");

// Helpers
var PollHelper = require('@openpoll/helpers').poll;
var ShardBlockHelper = require('@openpoll/helpers').shardBlock;


var databases = require('../util/databases');

// The controller
var controller = {};

module.exports = controller;

// Block manager 
controller.BlockManager = require("./BlockManager")(databases, controller);
controller.POWController = require("../proof_of_work")(databases, undefined, controller);
controller.BlockHelper = require("./main_block");
controller.p2p = require("./p2p")(databases, controller);
controller.WalletManager = require("../WalletManager")(controller);
controller.TransactionManager = require("../TransactionManager")(controller);
controller.LedgerManager = require("../LedgerManager");

/*
  This function generates the mainchain genesis block and returns it
*/
controller._cachedGenesis;

controller.createGenesis = function() {
  // Do we have a cached genesis block?
  if( controller._cachedGenesis ) {
    return controller._cachedGenesis;
  }

  // Standard Fields
  let genesis = {
    blockId: 0,
    timestamp: 1527207101,
    prevHash: "",
    transactions: [],
    shards: [],
    minerAddress: "",
    nonce: 0,
    hash: ""
  };

  // Hash the genesis block
  controller.BlockHelper.hash( genesis );

  // Cache
  controller._cachedGenesis = genesis;

  // Return it
  return genesis;
}

controller.initialize = async function (cli) {
  console.log("Initializing mainchain logic controller");

  /*
    When the mainchain controller is initialized, we must first determine
    if the local environment has initialized the base case for the mainchain.

    This includes...
    1) Generating the genesis block
    2) Creating the relevant genesis block DB files
    3) Initializing other mainchain database files
  */

  // Step #1: Generate the genesis block
  let genesis = controller.createGenesis();

  // If the genesis has not been initialized...
  if( true /* TODO */ ) {
    // Initialize the genesis shards ledger
    let genesisShardsLedger = level(`./db/ledgers/${genesis.hash}_shards`);
    await genesisShardsLedger.close();

    // Initialize the genesis transactions ledger
    let genesisTxnsLedger = level(`./db/ledgers/${genesis.hash}_transactions`);
    await genesisTxnsLedger.close();

    // Initialize the genesis accounts ledger
    let genesisAcctLedger = level(`./db/ledgers/${genesis.hash}`);
    await genesisAcctLedger.close();

    // Update Mainchain Block Id -> Hash Array Ledger
    controller.BlockManager.db.blocksByID.put( "0", JSON.stringify([
      genesis.hash
    ]) );

    // Update Block Hash -> Block Ledger
    controller.BlockManager.BlockManagerBase.db.blockByHash.put( genesis.hash, JSON.stringify(
      genesis
    ) );

    // Log..
    console.log( "Ledgers for the genesis block have been initialized" );
  }

  // Run some hooks??
  hook.Call("Initialize", controller);
  hook.Call("refreshActiveShards");
}
