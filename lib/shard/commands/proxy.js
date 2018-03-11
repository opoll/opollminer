
var helpers = require("../helpers");

module.exports = function (CLI, ShardLogicController) {

    CLI.AddCommand("proxy", async function (args) {
      try {
        ShardLogicController.POWController.StartProxy();
        console.log( "proof of work proxying enabled" );
      } catch( ex ) {
        console.log( helpers.chalk.redBright( "unable to proxy proof of work service!" ) );
        console.log( ex );
      }
    }, "enable proof of work miner proxying");

}
