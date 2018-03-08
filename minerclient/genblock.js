var blankblock = {
    blockId: 0,
    pollHash: "",
    timestamp: 0,
    prevHash: "",
    responses: {},
    minerAddress: "",
    nonce: 0,
    hash: "",
};
var copy = Object.assign( {}, blankblock );
module.exports = copy;