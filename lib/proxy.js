
var helpers = require("./shard/helpers");

var lib = {};

module.exports = function (POWControl) {
    POWControl.MinerCommand = lib.MinerCommand;
    POWControl.CreateMiner = lib.CreateMiner;
}

var queue = [];
var inuse = false;

lib.queryProxy = async function (command) {
    if (inuse) {
        queue.push(command);
        return;
    }
    inuse = true;
   // helpers.log("sending command: "+command)
    helpers.http.get({
        host: "jyugo",
        path: "/" + encodeURI(command),
        port: 9092,
    }, function (res) {
        var data = "";
        res.on("data", function (d) { data += d; }); // capture all data
        res.on("end", function () {
            inuse = false;
            if(queue.length > 0){
                queue.reverse();
                var top = queue.pop();
                queue.reverse();
                lib.queryProxy(top);
            }
        });
    });

}

lib.MinerCommand = async function (cmd) {
    lib.queryProxy(cmd, function () { });
}

lib.CreateMiner = function () {}

lib.StartListen = function () {
    // copy pasta express startup code from ico-api
    var express = require('express'),
        app = express(),
        port = 9091,
        cors = require('cors');

    // bad?
    app.use(cors());

    // Parse input as json..
    app.use(helpers.bodyParser.urlencoded({ extended: true }));
    app.use(helpers.bodyParser.json());

    // Start Listening
    app.listen(port, function () {
        console.log("[proxy] Listening on port %d in %s mode", this.address().port, app.settings.env);
    });

    app.route('/*').get(function (req, res) {
        CURRENTRES = res;
        req.url = decodeURI(req.url);
        var data = req.url.substr(1);
       // OnInput(wat, res);
        //echo("");
        // echo (req.url);
        res.end();
        var args = [];
        var i = 0;
        data.toString().split("|").map(function (v) {
            args[i] = v;
            i++;
        });
        if (args[0] == "done") {
            global.POWController.OnHashMined(args[1], args[2]);
        } else {
            console.log("[" + helpers.chalk.cyan("MINER") + "]", data.toString());
        }
        // res.json({test:wat});
    });
}

lib.StartListen();
