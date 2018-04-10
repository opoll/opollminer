
var helper_generic = require('@openpoll/helpers').generic;

// Create the library
var lib = {};


/*
  Returns an array of ordered hash fields which are used in creating the
  hash for this specific shard block object. Set ignoreNonce to true if
  you do not want the nonce included in the set.
*/

lib.orderedHashFields = function (mainBlockObj, ignoreNonce = false) {
    var arr = [
        mainBlockObj.blockId.toString(),
        mainBlockObj.timestamp.toString(),
        mainBlockObj.prevHash,
        mainBlockObj.minerAddress,
    ];
    /*
        TODO: include has of shards & transactions
    */
    // arr.push(helper_poll_response.hashResponses(mainBlockObj.responses));

    // If we aren't ignoring the nonce, add it
    if (ignoreNonce === false) {
        arr.push(mainBlockObj.nonce.toString());
    }

    return arr;
}

/*
  Hashes the provided shard block, and returns the hash
*/
lib.hash = function (shardBlockObj, ignoreNonce = false, digestType = "hex") {
    // Get the ordered hash fields
    var hashFields = lib.orderedHashFields(shardBlockObj, ignoreNonce);

    // Update the hash on the poll object
    shardBlockObj.hash = helper_generic.hashFromOrderedFields(hashFields, digestType);

    // Return the hash
    return shardBlockObj.hash;
}

module.exports = lib;