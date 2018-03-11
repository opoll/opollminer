
// Dependencies
const readline = require('readline');
const chalk = require('chalk');

// Create the CLI
var cli = {};

// List of hooked commands
cli.CommandList = [];

// Helper function to hook command
cli.AddCommand = function(cmd, func, description) {
    cli.CommandList[cmd] = {
        func: func, description: description
    };
}

// Initialize the CLI
cli.initialize = function( ShardLogicController ) {
  // Hook into STDIN
  const ReadInput = readline.createInterface({
      input: process.stdin,
      output: process.stdout
  });

  ReadInput.on('line', (input) => {

      // split args by space?
      var args = [];
      var i = 0;
      input.split(" ").map(function (v) {
          args[i] = v;
          i++;
      });
      if (cli.CommandList[args[0]]) {
          cli.CommandList[args[0]].func(args);
      }
  });

  // Initialization Message
  console.log(
    chalk.greenBright(
      "Command line initialized. Type help to view a list of commands."
    )
  );
}

// Export the CLI
module.exports = cli;
