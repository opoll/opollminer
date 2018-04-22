
// External Dependencies
require('dotenv').config()
const readline = require('readline');
const chalk = require('chalk');
const hook = require("./hook");
// Admin Helpers
const adminHelpers = require('./admin/helpers');

// Get our logic controllers
var NetworkModule = require('./network_module');
var ShardLogicController = require('./shard/logic');
var MainLogicController = require('./main/logic');

// Load & initialize configuration manager
var ConfigManager = require('./config');
ConfigManager.initialize();

// Called when we know the node type
function startNode( type ) {
  // Verify node type
  if( type !== "shard" && type !== "mainchain" ) {
    throw {
      name: "InvalidNodeType",
      message: "an invalid node type was specified. only shard and mainchain are permitted"
    };
  }

  // The logic controller...
  var logicController;

  // If it's a shard..
  if( type === "shard" ) {
    logicController = ShardLogicController;
  }

  if (type == "mainchain") {
      logicController = MainLogicController;
  }
  // Create the CLI
  var cli = require('./cli');

  try {
    // initialize the logic controller
    logicController.initialize( cli );

    // start the network module
    NetworkModule.listen( type, logicController );

    // Initialize the CLI
    cli.initialize();

    // init success
    return true;
  } catch( ex ) {
    console.log( chalk.bgRed( "there was an error starting your " + type + " node." ) );
    console.log( ex );
    process.exit(1);
  }

  // Error...
  console.log( chalk.bgRed( "there was an unknown error starting your " + type + " node." ) );
  process.exit(1);
}

// Get the type of miner we are going to be running
try {
  startNode( ConfigManager.get( 'miner_type' ) );
} catch( ex ) {
  // Hook STDIN until we can determine a node type
  const rl = readline.createInterface( {
    input: process.stdin,
    output: process.stdout
  } );

  // Get the node type
  rl.question( "Node type (shard/mainchain): ", (type) => {
    // Close the input listener
    rl.close();

    // Start the node
    startNode( type );

    // TODO: Token should print whether miner_type is defined (try block works) and
    // even if miner_type is not defined (catch block runs). When moved below
    // the try catch it runs immediately (presumably due to async work) printing
    // the token too early. We need to make it run in sequence.

    // Print adminAuthToken to the console. Generate if it doesn't already exist
    adminHelpers.generateAndPrintAuthToken();
  });
    // check version every so often
}
