/* Version Manager */

var hook = require("./hook");
var axios = require("axios");

var lib = {};

// API url
lib.API_URL = (process.env.FACILITATOR_HOST);

// should we store version here or env?
lib.BlockVersion = 1.0;
lib.MinerVersion = 1.0;

// Latest version by default is the current
lib.LatestBlockVersion = lib.BlockVersion;
lib.LatestMinerVersion = lib.MinerVersion;
// return latest version; maybe use direct var?

lib.LastBlockID = -1;
lib.RequireUpdate = function (num) {
    if (lib.LatestBlockVersion != lib.BlockVersion && num >= lib.LastBlockID) {
        return true;
    }
    return false;
}

// Check the version every now and then

hook.Add("networkTick", "checkVersion", function () {
    // Ask API for the latest version
    axios.get(lib.API_URL + `/version`).then(function (resp) {
        try {
            lib.LatestBlockVersion = resp.data.LatestBlockVersion;
            lib.LatestMinerVersion = resp.data.LatestMinerVersion;
            lib.LastBlockID = resp.data.LastBlockID;

            if (lib.LatestBlockVersion != lib.BlockVersion || lib.LatestMinerVersion != lib.MinerVersion) {
                console.log("New version of the miner is available!");
            }
        } catch (err) {}
    }).catch(function (err){}); // no need to error handle it.
});

module.exports = lib;