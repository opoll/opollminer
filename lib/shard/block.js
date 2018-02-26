const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');
const DateUtil = require('../util/dateUtil');

/*
{
    // Shard block structure
    height: 0,
    pollId: c258f246851bea091d14d4247a,
    timestamp: 1519023494,
    pubKey: c258f2a4...6851bea091
    nonce: 0,
    prevHash: 00000000000000,
    hash: c23fc3f73...d1e1cf7b2f,
    responses: [
        { ...pollResponse... },
        { ...pollResponse... },
        { ...pollResponse... },
        { ...pollResponse... }
    ]
}
    */

class Block {

    constructor(){
        this.height = null; // same as the height of the block, position in blockchain
        this.pollId = null; // pollId this block belongs to
        this.timestamp = null; // (time the block was successfully mined)
        this.pubKey = null; // (address of the miner that mined this block)
        this.nonce = null; // (arbitrary number used for mining purposes)
        this.prevHash = null; // (hash of previous block)
        this.hash = null; // (sha256: header data + responses data)
        this.responses = []; // (array of poll responses incorporated into this block)
    }

    // Generates hash for the block using block contents
    toHash(){
        return CryptoUtil.hash(this.height + this.pollId + this.timestamp + this.pubKey + this.nonce + this.prevHash + JSON.stringify(this.responses));
    }

    getDifficulty(){
        let difficulty = 0;
        for(let i = 0; i < this.hash.length; i++) {
            difficulty++;
            if (this.hash.charAt(i) !== '0') {
                break;
            }
        }
        return difficulty;
    }

}

module.exports = Block;
