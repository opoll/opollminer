
var child_process = require("child_process");
var chalk = require("chalk");

/*
  This component is responsible for interacting with the proof-of-work
  module of the miner application
*/

// Singleton
if( global.PoW ) {
    module.exports = global.PoW;
    return;
}

// Initialize the Module
var PoW = {};

// Constants
const PoW.maxHashString = "0000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
const PoW.maxHashNumber = helpers.bigInt(POWControl.maxHashString, 256);

// Internal Imports
var OpenPollHelpers = require( '../openpoll_helpers')

/*
  When the PoW  miner finds a nonce with the requested difficulty, it
  passes the nonce as well as the shardId back to the miner daemon.
*/
PoW.OnWorkComplete = async function( shardId, nonce ) {
  // TODO
}

/*
  Run a command on the miner application
*/
PoW.ExecCommand = function( cmd ) {
  // Make sure the PoW appication is running
  if( PoW._slave == undefined ) {
    PoW.CreateSlave();
  }

  // Run a command on the slave
  PoW._slave.stdin.write( cmd );
  PoW._slave.stdin.write( '\0' );
}

/*
  Stop the slave if it is running
*/
PoW.StopWorking = function() {
  // If the slave is running kill it
  if( PoW._slave !== undefined ) {
    PoW.ExecCommand( "stop" );
  }
}

/*
  Create a slave
*/
PoW.CreateSlave = function( forceCreate = false ) {
  // If the slave already exists, then only proceed if forceCreate
  if( PoW._slave ) {
    // If forceCreate, then kill
    if( forceCreate ) {
      PoW.StopWorking();
    } else {
      return;
    }
  }

  // Create an instance of the miner
  var powProc = child_process.spawn( "C:/Users/jyugo/source/repos/powminer/Debug/powminer.exe" );

  // Hook slave output
  powProc.stdout.on( 'data', (data) => {

    var args = [];
    var i = 0;
    data.toString().split("|").map(function (v) {
        args[i] = v;
        i++;
    });

    if( args[0] == "done" ) {
        PoW.OnWorkComplete( args[1], args[2] );
    } else {
        console.log("[" + chalk.cyan("MINER") + "]", data.toString());
    }

  } );

  // Cleanup on application close
  powProc.on( 'close', (ifx) => {
    PoW._slave = undefined;
  } );

  // Create process reference
  PoW._slave = powProc;
}
// Export & Singleton
global.PoW = PoW;
module.exports = PoW;
