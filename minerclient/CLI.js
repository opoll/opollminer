
/*
  This file creates a simple command line interface with basic hooking functionality
*/

// Import modules
var helpers = require("./helpers");

// CLI Commands
exports.CommandList = [];

// Input Listener
const ReadInput = helpers.readline.createInterface( {
    input: process.stdin,
    output: process.stdout
} );

// Wait for STDIN lines..
ReadInput.on('line', (input) => {
    var args = [];
    var i = 0;

    // Split arguments by space
    input.split(" ").map(function (v) {
        args[i] = v;
        i++;
    });

    // If the inputted command has a callback..
    if( exports.CommandList[args[0]] )
        exports.CommandList[args[0]].func(args);
});

/*
  This function is used to add a command to the CLI
  -> cmd is the command the user enters
  -> func is the callback for when the user enters the command
  -> description is a description of the command
*/
exports.AddCommand = function(cmd, func, description) {
    exports.CommandList[cmd] = {
        func: func, description: description
    };
}

// grab NetworkModule
module.exports = function( NetworkModule ) {
  // Local reference
  exports.NetworkModule = NetworkModule;

  // Load commands
  require("./commands/help")(exports);
  require("./commands/getshards")(exports);
}
