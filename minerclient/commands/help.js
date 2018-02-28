var helpers = require("../helpers");

module.exports = function (CLI) {
   
    CLI.AddCommand("help", function (args) {

        for (var cmd in CLI.CommandList) {
            var cmdData = CLI.CommandList[cmd];
            if (cmdData.description) {
                console.log(helpers.chalk.greenBright(cmd), "( " + helpers.chalk.whiteBright(cmdData.description) + " )");
            } else {
                console.log(helpers.chalk.greenBright(cmd));
            }
            
        }
    }, "List available commands");
}