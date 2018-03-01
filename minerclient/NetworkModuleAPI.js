var helpers = require("./helpers");

/* quick access shard list */
exports.shardList = [];

/* save list via level db*/

exports.saveShards = function (data) {
    var db = helpers.level("./db/shards");
    for (var shardID in data) {
        var shardData = data[shardID];
        db.put(shardID, shardData);     // store each shardid as a key / val
    }
    db.close();

    helpers.log("Saved updated shard list");
}


exports.queryAPIServer = function (command, callbackFunction) {
    helpers.http.get({
        host: process.env.FACILITATOR_HOST_DEV || process.env.FACILITATOR_HOST,
        path: "/"+command,
    }, function (res) {
        var data = "";
        res.on("data", function (d) { data += d; }); // capture all data
        res.on("end", function () {
            var jdata;
            try {
                jdata = JSON.parse(data);
            } catch (e) {

                /* if the json fails */
                helpers.log("Failed to parse JSON", data);
                return;
            }

            if (callbackFunction) {
                callbackFunction(jdata);
            }
        });
    });
}

/* grab list of shards from OpenPoll API server */
exports.getShards = function (callbackFunction) {
    exports.queryAPIServer("getshards", function (jdata) {
        exports.saveShards(jdata); // save the new list
        exports.shardList = jdata; // quick access

        /* pass the new list back to callback function if provided */
        if (callbackFunction) {
            callbackFunction(jdata);
        }
    });
}


/* get shardID specific json data internal */

exports.getShard = function (shardID) {
    if (!exports.shardList[shardID]) {
       /* ERROR POINT INVALID SHARD */

        return false;
    }
    return exports.shardList[shardID];
}


/* request details about shard (peers/miners/blocks?)*/
exports.queryShardData = function (shardID, ) {
    if (!exports.shardList[shardID]) {
         /* ERROR POINT INVALID SHARD */

        return false;
    }
    exports.queryAPIServer(`shard/${shardID}/latest`, function (jdata) {
        console.log(jdata);
    });
}


/* get the latest block on a shard chain */
exports.getLatestBlock = function (shardID, block) {
    if (!exports.shardList[shardID]) {

        /* ERROR POINT INVALID SHARD */

        return false;
    }
    if (!block) {
        block = "0x0000"; // start at genesis block (will be converted to numeric ordering instead of hash)
    }
    exports.queryAPIServer(`shard/${shardID}/nextblock/${block}`, function (jdata) {

        if (!exports.shardList[shardID].blocks[block]) {
            exports.shardList[shardID].blocks[block] = {};
        }

        if (jdata.nextBlock) {
            if (jdata.previousBlock) {
                exports.shardList[shardID].blocks[block].previousBlock = jdata.previousBlock;
            }
            exports.shardList[shardID].blocks[block].nextBlock = jdata.nextBlock;

            helpers.log("BLOCK LINKED " + block + " -> " + jdata.nextBlock)
            exports.getLatestBlock(shardID, jdata.nextBlock); // this is not the latest block grab next
        } else {

            exports.shardList[shardID].blocks[block].previousBlock = jdata.previousBlock;

            helpers.log("LATEST BLOCK IS " + block + "; READY TO MINE");


            exports.saveShards(exports.shardList); // save the updated shard list to include this block chain

           
        }
    });
}

