const R = require('ramda');
const level = require('level');
const http = require('http';)
const Block = require('./block');
const PollResponse = require('./pollResponse');

const chainDb = level('./db/blockchains', { valueEncoding: 'json' });
const mempoolDb = level('./db/mempools', { valueEncoding: 'json' });

class Blockchain{

    constructor(pollId){
        this.pollId = pollId; // id of poll this blockchain belongs to
        this.blocks = []; // array of poll response block objects
        this.mempool = []; // unconfirmed pollResponses needed to be mined
        this.emitter = new EventEmitter(); // EventEmitter that broadcast events node will be hooked to react to
        this.init();
    }

    /*
        If blockchain is empty data is requested from REST API, if
        no one is working on the chain we will get back the appropriate
        genesis block, if nodes are already working on this pollId then
        the best chain is consumed to init the blockchain. Clears pending
        transaction pool incase it exists and fills it with what other
        nodes hold as their mempool.
    */
    init(){
        // Pull the blocks from the db
        this.blocks = await chainDb.get(this.pollId);
        if(this.blocks.length === 0){
            // This peer doesn't have any blocks. Fetch genesis block for the pollId.
            const genesisBlock = await http.get(`http://${process.env.FACILITATOR_HOST}:${process.env.PORT}/network/${pollId}/serve`;
            this.blocks.push(genesisBlock); // Push the block to the blocks array
            db.put(this.pollId, genesisBlock); // Persist the block to the db creating an entry for the pollId
        }

        // Pull the mempool from the db
        this.mempool = await mempoolDb.get(this.pollId);
    }

    getAllBlocks(){
        return this.blocks;
    }

    // Return a block by the index passed in
    getBlockByIndex(height){
        return R.find(R.propEq('height', height), this.blocks);
    }

    // Get block by the hash passed in
    getBlockByHash(hash){
        return R.find(R.propEq('hash', hash), this.blocks);
    }

    // Returns the last block in the chain
    getLastBlock(){
        return R.last(this.blocks);
    }

    // Returns the difficulty of the block based on its index. Difficulty is arbitrarily deterministic.
    getDifficulty(height, maxNumResponses){
        return Block.getDifficulty(height, maxNumResponses);
    }

    // Returns all the unconfirmed poll responses
    getAllUnconfirmed(){
        return this.mempool;
    }

    // Returns an unconfirmed poll response by its responseId
    getUnconfirmedById(responseId){
        return R.find(R.propEq('responseId', responseId), this.mempool);
    }

    // Return a pollResponse object extracted from the present blockchain by responseId
    getResponseFromBlocks(responseId){
        return R.find(R.compose(R.find(R.propEq('responseId', responseId)), R.prop('responses')), this.blocks);
    }

    /*
        First checks if new blockchain’s length is greater than the held blockchain.
        Calls checkChain() to ensure chain is valid. Gets blocks that diverge from
        held blockchain. Adds each new block to the held blockchain. Emits event
        ‘blockchainReplaced’ with the additional parameters of the new blocks added
        and the pollId of the chain.
    */
    replaceChain(newBlockchain){
        
    }

    /*
        Check if the genesis blocks are the same between this chain and the passed
        in chain. Call checkBlock on each block in the blockchain from 2nd block
        to last block to validate the whole chain.
    */
    checkChain(blockchainToValidate){

    }

    /*
        Runs if statement calling checkBlock(). If valid, add block to blockchain,
        write updated blockchain to db, and calls removeBlockResponsesFromMempool()
        to update unconfirmed pollResponses pool. If emit is true emit event
        ‘blockAdded' with the additional parameters of the new block added and
        the pollId of the chain.
    */
    addBlock(newBlock, emit = true){

    }

    /*
        Adds an unconfirmed pollResponse only if it is valid. Calls checkPollResponse()
        and if true pushes response into unconfirmed responses pool, updates pool in
        db, and if emit is true emits event ‘unconfirmedPollResponseAdded’ with the
        additional parameters of the new pollResponse added and the pollId of the chain.
    */
    addUnconfirmedPollResponse(pollResponse, emit = true){

    }

    /*
        Removes the pollResponses in the mempool that are already in a finalized
        block that’s being added (or any other case where the pool needs updating),
        updates pollResponses pool in db.
    */
    removeBlockResponsesFromMempool(newBlock){

    }

    /*
        Checks index increment between the two blocks. Checks hash link between
        the two blocks. Checks if the calculated hash of the block is the same
        as its hash (if block has a valid hash). Checks if the PoW difficulty
        used for getting the hash is correct vs. what the difficulty algorithm
        yields. Checks if each pollResponse in the block is valid.
    */
    checkBlock(newBlock, previousBlock, referenceBlockchain = this.blocks){

    }

    /*
        Calls `validate()` on the pollResponse object passed in. Check to make
        sure poll response isn’t already in the blockchain.
    */
    hasPollResponse(pollResponse, referenceBlockchain = this.blocks){

    }

}

module.exports = Blockchain;
