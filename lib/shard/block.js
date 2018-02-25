const CryptoUtil = require('../util/cryptoUtil');
const DateUtil = require('../util/dateUtil');

/*
{
    // Shard block structure
    height: 0,
    pollId: c258f246851bea091d14d4247a,
    timestamp: 1519023494,
    rewardAddress: c258f2a4...6851bea091
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
        this.pubKey = null; // (public key of the miner that mined this block)
        this.nonce = null; // (arbitrary number used for mining purposes)
        this.prevHash = null; // (hash of previous block)
        this.hash = null; // (sha256: header data + responses data)
        this.responses = []; // (array of poll responses incorporated into this block)
    }

    // Generates hash for the block using block contents
    toHash(){
        return CryptoUtil.hash(this.height + this.pollId + this.timestamp + this.pubKey +
            this.nonce + this.prevHash + JSON.stringify(this.responses));
    }

    /*
        Get the difficulty for the shard block. Will be less aggressive
        proof of work versus the main chain PoW. Therefore we only pass
        in the block height and the max responses for that shard chain
        to make a simple calculation for a consistent block difficulty
        for the shardchain.
    */
    getDifficulty(height, maxNumResponses){

    }

    /*
        Gets the arbitrarily generated genesis block, static since all
        blocks have the same genesis...it stays consistent per chain
    */
    static getGenesis(){

    }

    // Takes JSON and composes a new block object
    static fromJSON(){

    }

}
