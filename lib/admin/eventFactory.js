
/*
  Event Factory
  (c) 2018 OpenPoll Inc
  ==============================================================================
  This module is responsible for leveraging the websocket (service) module to
  emit events to the miner's GUI. Its purpose is to abstract away the boilerplate
  code necessary to emit events so any consuming module can simply call the appropriate
  function with the correct data and have the event emitted to the GUI.
*/

// Fetch instance of io object to emit events with
let io = require('./websocket').io();

// Library to export
let lib = {};

/****************************************************/
/************* Event Emission Functions *************/
/****************************************************/

    /****************************************/
    /******* Shard Emission Functions *******/
    /****************************************/

    // Event Type: Shard
    // Event: shardBlockAdded
    // Description: A block has been added to the respective shard (whether this miner added it or not)
    // Data Emitted: shardId
    lib.shardBlockAdded = function(shardId){
        emit('shardBlockAdded', {shardId});
    };

    // Event Type: shard
    // Event: shardResponseAdded
    // Description: A single shard response has been added
    // Data Emitted: shardId
    lib.shardResponseAdded = function(shardId){
        emit('shardResponseAdded', {shardId});
    };

    // Event Type: shard
    // Event: shardResponseAdded
    // Description: A single pending shard response has been removed
    // Data Emitted: shardId
    lib.shardResponseRemoved = function(shardId){
        emit('shardResponseRemoved', {shardId});
    };

    // Event Type: shard
    // Event: shardResponseChange
    // Description: Either a >= 2 responses have been removed or added. Update with new count.
    // Data Emitted: shardId, the new pending response count
    lib.shardResponseChange = function(shardId, pendingRespCount){
        emit('shardResponseChange', {shardId, pendingRespCount});
    };

    /****************************************/
    /***** End Shard Emission Functions *****/
    /****************************************/

    /********************************************/
    /******* Mainchain Emission Functions *******/
    /********************************************/

    // Event Type: Mainchain
    // Event: mainchainBlockAdded
    // Description: A block has been added to the main blockchain (the mainchain).
    // Data Emitted: -
    lib.mainchainBlockAdded = function(){
        emit("mainchainBlockAdded", {});
    };

    // Event Type: Mainchain
    // Event: pendingShardAdded
    // Description: A pending shard chain has been added to the shard chain pool to be confirmed.
    // Data Emitted: -
    lib.pendingShardAdded = function(){
        emit("pendingShardAdded", {});
    };

    // Event Type: Mainchain
    // Event: pendingShardRemoved
    // Description: A pending shard chain has been removed from the pending shard chain pool.
    // Data Emitted: -
    lib.pendingShardRemoved = function(){
        emit("pendingShardRemoved", {});
    };

    // Event Type: Mainchain
    // Event: pendingShardCountChange
    // Description: Either >= 2 pending shard chains have been removed or added. Update with new count.
    // Data Emitted: the new pending shard count
    lib.pendingShardCountChange = function(pendingShardCount){
        emit("pendingShardCountChange", {pendingShardCount});
    };

    // Event Type: Mainchain
    // Event: pendingTxnAdded
    // Description: A pending transaction has been added to the transaction pool to be confirmed.
    // Data Emitted:
    lib.pendingTxnAdded = function(){
        emit("pendingTxnAdded", {});
    };

    // Event Type: Mainchain
    // Event: pendingTxnRemoved
    // Description: A pending transaction has been removed from the transaction pool.
    // Data Emitted:
    lib.pendingTxnRemoved = function(){
        emit("pendingTxnRemoved", {});
    };

    // Event Type: Mainchain
    // Event: pendingTxnCountChange
    // Description: Either >= 2 txns have been removed or added. Update with new count.
    // Data Emitted: the new pending transaction count
    lib.pendingTxnCountChange = function(pendingTxnCount){
        emit("pendingTxnCountChange", {pendingTxnCount});
    };

    /********************************************/
    /***** End Mainchain Emission Functions *****/
    /********************************************/

    /********************************************/
    /******** General Emission Functions ********/
    /********************************************/

    // Event Type: General
    // Event: hashrateChange
    // Description: The hash rate of the miner has changed from its previous value. Update the dashboard.
    // Data Emitted: newHashrate
    lib.hashrateChange = function(newHashrate){
        emit("hashrateChange", {newHashrate});
    };

    /********************************************/
    /****** End General Emission Functions ******/
    /********************************************/

/****************************************************/
/*********** End Event Emission Functions ***********/
/****************************************************/



/***************************************************/
/********************* Helpers *********************/
/***************************************************/

function emit(event, payload){
    // Set the event name on the payload to be sent to client
    payload['event'] = event;

    // Emit the payload
    io.emit("message", payload);
}

/***************************************************/
/******************* End Helpers *******************/
/***************************************************/

module.exports = lib;