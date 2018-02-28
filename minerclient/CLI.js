/* basic command wrapper? */

var helpers = require("./helpers");

exports.CommandList = []; // store available commands for easy access

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


exports.AddCommand = function(cmd, func, description) {
    exports.CommandList[cmd] = {
        func: func, description: description
    };
}

// grab NetworkModule
module.exports = function (NetworkModule) {

    exports.NetworkModule = NetworkModule; // so it can be accessed from each command

    require("./commands/help")(exports); // send the exports so they are accessable from commands
    require("./commands/getshards")(exports); 
}