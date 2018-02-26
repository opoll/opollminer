const R = require('ramda');
const level = require('level');
const superagent = require('superagent');
const ip = require('ip');

const peerDb = level('./db/netstat', { valueEncoding: 'json' });
const chainDb = level('./db/blockchains', { valueEncoding: 'json' });

class Node{
    constructor(blockchains, mainchainMiner = false) {
        this.host = ip.address();
        this.port = process.env.PORT;
        this.mainchainMiner = mainchainMiner;
        this.peers = [];
        this.chains = [];
        this.init();
    }

    init(){

    }


    hookShards(){
        // R.forEach(function(blockchain){
        //     // Hook blockchains so they can broadcast events and they can be handled with these listeners
        //     blockchain.emitter.on('shardBlockAdded', (pollId, newBlock) => {
        //         this.broadcast(this.sendLatestShardBlock, pollId, newBlock);
        //     });
        //
        //     blockchain.emitter.on('mainBlockAdded', (newBlock) => {
        //         this.broadcast(this.sendLatestMainBlock, newBlock);
        //     });
        //
        //     blockchain.emitter.on('unconfirmedPollResponseAdded', (pollId, pollResponse) => {
        //         this.broadcast(this.sendUnconfirmedPollResponse, pollId, pollResponse);
        //     });
        //
        //     blockchain.emitter.on('unconfirmedShardAdded', (pollId, shardBlockchain) => {
        //         this.broadcast(this.sendUnconfirmedShard, pollId, shardBlockchain);
        //     });
        //
        //     blockchain.emitter.on('mainChainReplaced', (latestBlocks) => {
        //         this.broadcast(this.sendLatestMainBlock, latestBlocks);
        //     });
        //
        //     blockchain.emitter.on('shardChainReplaced', (pollId, latestBlocks) => {
        //         this.broadcast(this.sendLatestShardBlock, pollId, latestBlocks);
        //     });
        // }, this.chains);
    }

    connectToPeer(newPeer){
        // this.connectToPeers([newPeer]);
        // return newPeer;
    }

    connectToPeers(newPeers){
        // R.forEach(function(peer){
        //     // Ignore if peer is already held
        //     const isPeerAlreadyHeld = this.peers.find((element) => {
        //         return element == peer;
        //     });
        //     if (!isPeerAlreadyHeld && peer != this.host) {
        //         // Peer is not held and the peer is not the same as this ip
        //         this.sendPeer(peer, { ip: this.host }); // Send this yourself to this peer
        //
        //         this.peers.push(peer); // Add peer to peers array
        //         peerDb.put('peers', this.peers); // Update peer db
        //
        //         this.initConnection(peer); // Pull info from the peer and update node
        //
        //         this.broadcast(this.sendPeer, peer); // Broadcast this peer to all known peers
        //     } else {
        //         console.info(`Peer ${peer.url} not added to connections, because I already have.`);
        //     }
        // }, newPeers);
    }

    initConnection(peer) {

    }

    sendPeer(){

    }




    getLatestShardBlock(peer, pollId){

    }

    getShardBlocks(peer, pollId){

    }

    sendLatestShardBlock(peer, newBlock, pollId){

    }



    getLatestMainBlock(peer){

    }

    getMainBlocks(peer){

    }

    sendLatestMainBlock(peer, newBlock){

    }




    sendUnconfirmedPollResponse(peer, pollResponse, pollId){

    }

    sendUnconfirmedShard(peer, shardBlockchain){

    }




    getShardMempool(peer, pollId){

    }

    getMainMempool(peer, pollId){

    }




    getPollResponseConfirmation(peer, responseId, pollId){

    }

    getPollResponseConfirmations(responseId, pollId){

    }

    getShardHashConfirmation(peer, shardHash){

    }

    getShardHashConfirmations(shardHash){

    }

    getTxnConfirmation(peer, txnId){

    }

    getTxnConfirmations(txnId){

    }




    syncShardMempool(pollResponses, pollId){

    }

    syncMainMempools(shardBlockchains, pendingTxns, pollId){

    }



    checkReceivedShardBlock(block) {
        return this.checkReceivedShardBlocks([block]);
    }

    checkReceivedShardBlocks(blocks){

    }

    checkReceivedMainBlock(block) {
        return this.checkReceivedMainBlocks([block]);
    }

    checkReceivedMainBlocks(blocks){

    }

    broadcast(fn, ...args) {
        // Call the function for every peer connected. Pass in peer and any additional args.
        this.peers.map((peer) => {
            fn.apply(this, [peer, ...args]);
        }, this);
    }

}

module.exports = Node;
