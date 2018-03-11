/* basic command wrapper? */

var helpers = require("./helpers");

exports.CommandList = []; // store available commands for easy access

exports.AddCommand = function(cmd, func, description) {
    exports.CommandList[cmd] = {
        func: func, description: description
    };
}

// grab NetworkModule
module.exports = {};
module.exports.initialize = function( ShardLogicController ) {
  // Hook into STDIN
  const ReadInput = helpers.readline.createInterface({
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
      if (exports.CommandList[args[0]]) {
          exports.CommandList[args[0]].func(args);
      }
  });

  // Initialization Message
  console.log(
    helpers.chalk.greenBright(
      "Command line initialized. Type help to view a list of commands."
    )
  );

  // Load Commands
  require("./commands/help")( exports, ShardLogicController );
  require("./commands/getshards")(exports, ShardLogicController);
  require("./commands/mine")(exports, ShardLogicController);
  require("./commands/proxy")(exports, ShardLogicController);
}
