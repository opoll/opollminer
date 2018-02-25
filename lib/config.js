module.exports = {
    MAIN_CHAIN_INCORPORATION_REWARD = .05, // INFO: Main chain incorporation pool percentage
    SHARD_MINER_REWARD = .25, // INFO: Shard miner pool reward percentage
    RESPONDENT_REWARD = .70, // INFO: Respondent pool reward percentage
    /*
      Get the difficulty for the shard block. Will be less aggressive
       proof of work versus the main chain PoW. Therefore we only pass
       in the block height and the max responses for that shard chain
       to make a simple calculation for a consistent block difficulty
       for the shardchain.
    */
    getShardBlockDifficulty: (height, maxResponses) => {

    },
    /*
      Get the difficulty for the mainchain block the miner is mining.
      We will want to scale difficulty as hashing power comes onto the
      network a decent amount therefore we want to get the most recent
      timestamps of blocks found to adjust the difficulty of the current
      block. The function will require 10 recent block timestamps passed in.
      This is choosen arbitrarily.
    */
    getMainBlockDifficulty: (height, recentTimestamps) => {

    }
}
