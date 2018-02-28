// helpers

var helpers = require("../helpers");

exports.getPeers = function (req, res) {
    var q = helpers.url.parse(req.url, true).query;


    /* check if ?chain is provided */

    if (q.chain == undefined) {
        res.json({
            errorcode: 400,
            message: "No shard hash provided",
        });
        return;
    }


    /*
    DO q.chain  HASH VERIFICATION

    just a simple check if the hash provided is a valid chain before going further?

    */


    // example output of peers for the chain specified?
    res.json({
        1: {ip: "127.0.0.1:9011", id:"0x13?"}, // should each peer have a unique id aswell?
        2: "127.0.0.2:9011",
        3: "127.0.0.3:9011",
        4: "127.0.0.4:9011",
    });
}