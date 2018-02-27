# Mining Application

**Purpose:** This document holds the very basic necessities that the mining application will need. The mining application supports two different types of mining: (1) mining the OpenPoll main blockchain, and (2) mining multiple different shard blockchains. All miners at the time of initial launch are required to operate full nodes, until a light miner is released. Before understanding the architecture and design of the mining application, you should understand the theory behind the OpenPoll main and shard blockchains. This document describes the software implementation of the mining application, however, it does not describe the higher level theory behind the main blockchain, or individual shard chains.

---

# Mining Application Responsibilities

The mining application has many different responsibilities, but principally, it has the ability to transform a computer into a node running optionally on the main blockchain, or turn a single computer into a node for many shard blockchains.

- The goal of a node mining poll responses (as well as completed poll hashes) is so that they can be locked into an immutable chain of blocks (a blockchain) that is hash enforced and validated by network consensus rules
- Nodes must be able to speak to each other, broadcast their status/data to all nodes they are connected to, begin working on any chain of their choice (whether it be a available poll shard or the main chain), and terminate any completed shard following network consensus
- The network must be decentralized and allow miners to work on whatever they'd like. All miners will be full nodes at the outset.
  - Miners should be rewarded for blocks they mine that stay on the best blockchain and respondents should be rewarded for their responses that stay on the best blockchain.
  - Both events, the miners being rewarded as well as the respondents being rewarded (at least for the poll shards) will be assessed upon shard termination and incorporation into the main chain where the shard chain will undergo final validation and poll escrow funds will be released to the appropriate parties and transactions will be locked into the main chain
  - Miners working one the main chain will be awarded an MCIF (main chain incorporation fee) for every poll in a block they mine on the main chain that stays on the best blockchain.
  - Percentage breakdown of poll funding distribution can be found [here](https://www.notion.so/openpoll/Poll-Funding-Distribution-4964075832a748358f5b265ad6f465c6)

---

# Shard Mining Process

A miner running the OpenPoll mining application has the ability to choose which shards he or she would like to mine. Given that a user has chosen to mine a specific shard, as indicated by a `shardId`. The module responsible for performing shard mining once a `shardId` has been provided is called the `ShardMinerModule` which follows the flow below.

![](https://static.notion-static.com/d0a99139-8893-4894-9368-1a4fda446267/Blank_Diagram_-_Page_1(1).png)

The `ShardMinerModule` has the following constraints:

- **Persistent State:** A user may terminate the mining application at any time, and the mining application must have the capability to resume. This is accounted for by the overall flow of the module as when the user terminates the application, and resumes, the module automatically jumps to "Does this miner have latest block?" portion of the flow.
- **Dynamic External State Changes:** At any time a new block on the chain may be authored, independent of any action taken by the miner, and the miner may not receive a notification of such event. Therefore, the miner is responsible for ensuring he is sufficiently informed of the latest authored block. This constraint is accounted for within the application flow, including periodic updating during the halting 'Mine Block' process.

## Component Breakdown

- **Fetch General Information:** This component is responsible for getting general information related to the shard which the miner needs to adequately mine the shard. In the initial release of the application, fetching general information will occur via a call to the Facilitator Application. This fetch responds with a `PollShardInfoBlock` object.
- **Download Latest Block:** When a node is downloading blocks, it specifies the block it has and makes a call to a peer requesting the successor block to the provided block, in effect, given a `blockId`, give me the block where `prevId: blockId`. In the beta application, block downloading will occur through calls to the Facilitator Application, however in the initial release it will occur over Peer-to-Peer.
- **Mine Block:** The process of mining a block is more elaborate, see the section dedicated to the Shard Mining Algorithm.
- **Broadcast Block:** When a miner has created a new block and performed the Proof-of-Work associated with the block, and verified there has not been a more recent block already mined, the miner must broadcast his new block to peers on the network. The updated block is also broadcasted to the Facilitator Application through an API call.

---

# Peer-to-Peer Communication

In addition to direct API calls with the Facilitator application, peers must be able to communicate with each other. Peer communication occurs through a RESTful API made available by every node on the network. P2P communication contains `/main` if it relates to the main blockchain, and `/shard/:shardId` if it is communication relating to a specific shard. A versioning schema is to be determined.

# Shard P2P Endpoints

All requests to a peer associated with a shard are prefixed with `/shard/:shardId`. In the event a request is made to a peer regarding a shard which the peer is not actively mining, the node will return an HTTP 404 error code.

## **Latest Block**

`**GET /shard/:shardId/latest?full=[true/false]**`

Returns the latest block associated with the shard that the peer is aware of. For partial loading (when `full=false`) only a `blockId` is returned. However for full loading the entire block is returned.

**Example Use Case:** During the shard mining flow a node needs to know if they are currently on the latest block or not. For this simple determination, the node can do partial loading using this endpoint to peers to learn if they still are up to date.

**Example Use Case:** If a miner learns they do not have the latest block, they can retrieve the latest block on the chain (for situations when there was a low amount of time elapsed between the last successful latest check and unsuccessful check).

**`POST /shard/:shardId/latest`**

This endpoint is used during the broadcasting component of the shard mining flow. Once a shard miner creates a new block on the shard blockchain, the miner must ensure other peers on the network are aware of the new block to begin working on a block successive to theirs. Shard miners are responsible for pushing their block to peers on the network using this endpoint. This endpoint takes a `PollShardBlock` object. When this endpoint is called, it verifies the block. If the block is fully valid, the node stores the block locally and updates it's reference of the last block to the provided block.

## Response Pooling

When responses are received by respondents, they are polled by miners until they are incorporated into a block within the shard blockchain. These endpoints help to ensure responses can propagate through the network and be incorporated into shard blocks.

`**GET /shard/:shardId/pool**`

Miners are responsible for seeking pooled responses from other miners on the network in the event a respondent does not directly push a response to them. This request provides a peer with responses pooled by the local miner for incorporation in future shard blocks. This endpoint returns an array of `PollResponseSigned` objects which the node has stored locally in its pool.

`**POST /shard/:shardId/pool**`

This endpoint allows responses to propagate through the network on a push basis from respondents. When a respondent has a response they wish to be incorporated into the shard blockchain, they can push their response to nodes operating the shard through this endpoint. This endpoint takes a `PollResponseSigned` parameter. The endpoint verifies the data received and, if valid, pools the signed poll response.

## Peer Loading

In order to build a P2P network, peers must have a method to learn of other peers on the network. This occurs through peer to peer propagation where nodes can learn from other nodes who is on the network. These endpoints are not currently being developed in the beta version and initial release due to the Facilitator providing and maintaining a list of peers.

---

# Node CLI Commands

Miners must be able to interface with the application and know the state of their operations. Miners must be able to know what pollId's are available for them to work on, be able to start or drop working on any pollId (or the main chain), and they must be able to know what they have won a mining race and will be rewarded eventually. We can use `[commander](https://www.npmjs.com/package/commander)` to take terminal input and let users interface with internal application state that way.

**Basic Top-Level Commands To Support**

`shards`

- Displays a list of pollId's that the miner can work on. By calling fetch, the miner can initialize their mempool and blockchain for that shard (or the main chain if "main" is passed in as the pollId argument).

`status`

- Displays the working status of this node. What shards it is mining on (or not mining on), what shards are ready to be mined on (have latest blockchain and mempool imported), what shards aren't ready to be mined on, etc.

`fetch <pollId>`

- Fetches the genesis block or best blockchain for this pollId (or main chain), fetch the mempool of the chain, and broadcast that this node is now working on this pollId (or main chain).

`purge <pollId>`

- Clears the data associated with the pollId (or mainchain) from LevelDB, broadcasts to all nodes that this node is now not working on on this poll

`startmine <pollId>`

- Begins mining for the shard associated with the pollId (only if fetch has been called first and all the data is there and node has proper state to begin mini)

`stopmine <pollId>`

- Stops mining for the shard associated with the pollId (or mainchain if "main" passed in)

`blockchain <pollId>`

- Displays the chain associated with the given pollId that this node holds

`block <blockIndex> <pollId>`

- Displays the block at index blockindex for the given pollId

`rescan <pollId>`

- Refetch the mempool for this pollId (or main chain mempool if this is for the mainchain)u

`walletcreate <password>`

- Create a new wallet for the miner given a password. The password is hashed, hash is used to create a wallet secret, secret is used to generate a public and private key pair for the miner (and address is calculated using the keypair). Wallet structure can be found in [JSON Formats](https://www.notion.so/796f7321-fbbf-4005-80a4-0d46f840dcc4)

`walletall`

- Get all wallets that the miner holds

`walletaddresses <walletId>`

- Get all of the addresses for the specified walletId

`walletbalance <walletId>`

- Tells the user the balance for each address in their wallet. If the miner only owns one wallet then the walletId parameter is unnecessary.

`start`

- Starts the server with default settings and listens on network for connections

`stop`

- Stops the server and node stops listening for connections

`info`

- Get info about the command that is to be executed (appended to end)

**How Miners Will Run The Application**

1.) We will specify the `bin` property in package.json to map the command `om` to run `bin/opollminer.js` which holds our scripts

2.) The user must be in the same directory as the application before we create a symlink

3.) All the user will have to do on their end is run `npm link` to create a [symlink](https://kb.iu.edu/d/abbe) (and npm unlink to undo the symlink)

4.) Finally, a user can call `om [command name] [args]` globally and now the user can use the CLI more conveniently to interface with our application

---

# Mining Application Internal Implementation

This will roughly outline the *exact* classes, functions, and interfacing portions the application will support and implement.

- data

  Leveldb will persist data in the current directory by default. This will be automatically created.

- **bin (holds miscellaneous application scripts supported by [`commander`](https://www.npmjs.com/package/commander))**

  **opollminer.js**

  - Will contain all of the command scripts (like starting and stopping the node, getting working status of the node, fetching mempool info, etc.)
- **lib (internal code governing server, node, block, & mining logic)**
  - **httpServer (http server to respond to requests)**
    - **index.js**

      **Description:** Main file that defines node HTTP endpoints

      - **Instance Variables**

        server (the server object)

        app (the app object that is configured for response to http endpoints)

      - **Instance Methods**
        - constructor(node, mainBlockchain, shardBlockchains, miner)

          Takes in the node object, the mainBlockchain object (null if miner chooses not to work on it), an array of poll shards the miner is working on (null if miner is only working on oPollBlockchain and doesn’t want to work on shards), and finally the mining logic

        - listen(host, port)

          Sets the server to listen for connections on specific port

        - stop()

          Closes server off to connections

      - **Static Methods**

        none

  - **shard**
    - **pollResponse.js**

      **Description:** Object for poll response with self-validation functions

      - **Instance Variables**
        - `responseId` (SHA256 hash of all header data + data in poll response)
        - `pollId` (id of the poll this response is for)
        - `address (respondents address)`
        - `timestamp`
        - `signature`
        - `responseData` (object that contains an array of question and answer objects)
      - **Instance Methods**
        - `constructor()`
        - `validate(minCred = "bronze")`

          Validates the poll response and returns a boolean. First checks the timestamp to ensure the date is reasonable. Then decompresses the public key and validates signature. Then checks LevelDB's Respondent Credentials Cache, if user not there then check all nodes one hop out to see if they have it in their cache, if user still isn't found make request to facilitator and cache result. Check their credentials, default is bronze. If everything checks out this poll response is valid at least in integrity (blockchain level checks if this respondent has already responded).

      - **Static Methods**
        - `fromJSON()`

          Takes JSON and composes a new pollResponse object

    - **block.js**

      **Description:** Object that holds some number of pollResponse objects and it will be added to a poll's blockchain (not the main one)

      - **Instance Variables**
        - `index` (same as the height of the block, position in blockchain)
        - `pollId` (pollId this block belongs to)
        - `timestamp` (time the block was successfully mined)
        - `rewardAddress` (address of the miner that mined this block)
        - `nonce` (arbitrary number used for mining purposes)
        - `prevHash` (hash of previous block)
        - `hash` (sha256: header data + responses data)
        - `responses` (array of poll responses incorporated into this block)
      - **Instance Methods**
        - `toHash()`

          Generates hash for the block using block contents

        - `getDifficulty()`

          Gets the current difficulty to check later to ensure the hash generated during PoW met difficulty standards

      - **Static Methods**

        none

    - **blockchain.js**

      **Description:** 

      - **Instance Variables**

        `pollId` (id of poll this blockchain belongs to)

        `blocks` (blocks of pollResponses)

        `mempool` (unconfirmed pollResponses needed to be mined)

        `emitter` ([EventEmitter](https://www.npmjs.com/package/events) that broadcasts events node will be hooked to react to)

        `init()` (called and initializes the poll blockchain)

      - **Instance Methods**
        - `init()`

          If blockchain is empty data is requested from REST API, if no one is working on the chain we will get back the appropriate genesis block, if nodes are already working on this pollId then the best chain is consumed to init the blockchain. Clears pending transaction pool incase it exists and fills it with what other nodes hold as their mempool.

        - `getAllBlocks()`

          Returns all of the blocks that this chain holds

        - `getBlockByIndex(index)`

          Return a block by the index passed in

        - `getBlockByHash(hash)`

          Get block by the hash passed in

        - `getLastBlock()`

          Returns the last block in the chain

        - `getDifficulty(index)`

          Returns the difficulty of the block based on its index. Difficulty is arbitrarily deterministic.

        - `getAllUnconfirmed()`

          Returns all the unconfirmed poll responses

        - `getUnconfirmedById(responseId)`

          Returns an unconfirmed poll response by its responseId

        - `getResponseFromBlocks(responseId)`

          Return a pollResponse object extracted from the present blockchain by responseId

        - `replaceChain(newBlockchain)`

          First checks if new blockchain’s length is greater than the held blockchain. Calls checkChain() to ensure chain is valid. Gets blocks that diverge from held blockchain. Adds each new block to the held blockchain. Emits event ‘blockchainReplaced’ with the additional parameters of the new blocks added and the pollId of the chain.

        - `checkChain(blockchainToValidate)`

          Check if the genesis blocks are the same between this chain and the passed in chain. Call checkBlock on each block in the blockchain from 2nd block to last block to validate the whole chain.

        - `addBlock(newBlock, emit = true)`

          Runs if statement calling checkBlock(). If valid, add block to blockchain, write updated blockchain to db, and calls removeBlockResponsesFromMempool() to update unconfirmed pollResponses pool. If emit is true emit event ‘blockAdded' with the additional parameters of the new block added and the pollId of the chain.

        - `addUnconfirmedPollResponse(pollResponse, emit = true)`

          Adds an unconfirmed pollResponse only if it is valid. Calls checkPollResponse() and if true pushes response into unconfirmed responses pool, updates pool in db, and if emit is true emits event ‘unconfirmedPollResponseAdded’ with the additional parameters of the new pollResponse added and the pollId of the chain.

        - `removeBlockResponsesFromMempool(newBlock)`

          Removes the pollResponses in the mempool that are already in a finalized block that’s being added (or any other case where the pool needs updating), updates pollResponses pool in db.

        - `checkBlock(newBlock, previousBlock, referenceBlockchain = this.blocks)`

          Checks index increment between the two blocks. Checks hash link between the two blocks. Checks if the calculated hash of the block is the same as its hash (if block has a valid hash). Checks if the PoW difficulty used for getting the hash is correct vs. what the difficulty algorithm yields. Checks if each pollResponse in the block is valid.

        - `hasPollResponse(pollResponse, referenceBlockchain = this.blocks)`

          Calls `validate()` on the pollResponse object passed in. Check to make sure poll response isn’t already in the blockchain.

      - **Static Methods**

        none

  - **main**
    - **transaction.js**

      **Description:** Mainchain object that holds transactions that are stored in the mainchain txn dictionary.

      - **Instance Variables**
        - `txnId` (specific id associated with each transaction)
        - `type` (reward, fee,
        - `data { inputs: [], outputs: [] }`  (data for each transactions made out of arrays of transactionInput and transactionOutput objects)
        - `hash` (sha256 of all of the contents in the transaction)
      - **Instance Methods**
        - `toHash()`
          - Generates hash for the transaction object using block contents
        - `isTransactionValid()`
          - First checks if the hash of the transaction object is correct. Then checks if all of the signatures of the inputs are correct. Then checks the totalInput with the totalOutput.
      - **Static Methods**

        none

    - **transactionInput.js**

      **Description:**

      - **Instance Variables**
        - txnInputId ()
        - amount ()
        - address ()
        - signature ()
      - **Instance Methods**
    - **block.js**

      **Description:** Mainchain block that holds finished poll hashes (contained in a Merkle Tree) and an array of transactions associated with that poll (**POL** tokens to miners, respondents)

      - **Instance Variables**
        - `index` (same as height of this block in the blockchain)
        - `timestamp` (epoch time block was mined)
        - `nonce` (arbitrary number used for mining)
        - `prevHash` (hash of previous block)
        - `hash` (sha256: header data + shardHashes data + txn data)
        - `shardHashes` (array of hashes of the validated shard blockchains)
        - `txns` (array of reward transactions to respondents and network)
      - **Instance Methods**
        - `toHash()`

          Generates hash for the block using block contents

        - `getDifficulty()`

          Gets the current difficulty to check later to ensure the hash generated during PoW met difficulty standards.

      - **Static Methods**
        - `fromJSON()`

          ttConstruct a block object consisting of finalized polls from incoming JSON

    - **blocks.js**

      **Description:** Extends Array. Array representation of mainchain blocks

      - **Instance Variables**

        none

      - **Instance Methods**

        none

      - **Static Methods**
        - `fromJSON()`

          Takes JSON and composes a new blocks object (array of block objects)

    - **blockchain.js**

      **Description:** 

      - **Instance Variables**

        `blocks` (blocks containing shardHashes & txns)

        `mempool` (array containing unconfirmed shard blockchains to be mined)

        `emitter` ([EventEmitter](https://www.npmjs.com/package/events) that broadcasts events node will be hooked to react to)

        `init()` (called and initializes the main blockchain)

      - **Instance Methods**
        - `init()`

          If blockchain is empty data is requested from REST API, if no one is working on the chain we will get back the appropriate genesis block, if nodes are already working on the main chain then the best chain is consumed to init the blockchain. Clears mempool in db incase it exists and fills it with what other nodes hold as their mempool.

        - `getAllBlocks()`

          Returns all of the blocks that this chain holds

        - `getBlockByIndex(index)`

          Return a block by the index passed in

        - `getBlockByHash(hash)`

          Get block by the hash passed in

        - `getLastBlock()`

          Returns the last block in the chain

        - `getDifficulty(index)`

          Returns the difficulty of the block based on its index. Difficulty is arbitrarily deterministic.

        - `getAllUnconfirmed()`

          Returns all the unconfirmed shard blockchains that are in the mempool

        - `getUnconfirmedById(pollId)`

          Returns an unconfirmed shard blockchain by its pollId

        - `getTransactionFromBlocks(txnId)`

          Return a transaction extracted from the mainchain by txnId

        - `replaceChain(newBlockchain)`

          First checks if new blockchain’s length is greater than the held blockchain. Calls checkChain() to ensure chain is valid. Gets blocks that diverge from held blockchain. Adds each new block to the held blockchain. Emits event ‘blockchainReplaced’ with the additional parameters of the new blocks added and the 2nd parameter being "main" to indicate that it is a main chain event.

        - `checkChain(blockchainToValidate)`

          Check if the genesis blocks are the same between this chain and the passed in chain. Call checkBlock on each block in the blockchain from 2nd block to last block to validate the whole chain.

        - `addBlock(newBlock, emit = true)`

          Runs if statement calling checkBlock(). If valid, add block to blockchain, write updated blockchain to db, and calls removeBlockShardsFromMempool() to update mempool. If emit is true emit event ‘blockAdded' with the additional parameters of the new block added and the 2nd parameter being "main" to indicate that it is a main chain event.

        - `addUnconfirmedShard(shardBlockchain, emit = true)`

          Adds an unconfirmed shardBlockchain only if it is valid. Calls checkShardBlockchain() and if true pushes shard into mempool, updates pool in db, and if emit is true emits event ‘unconfirmedShardAdded’ with the additional parameters of the new shard added (we don't need to pass in the 2nd additional param as "main" since we will handle this event separately from shard events aka give it its own listener vs. with the others we had to specify main since they would pass through the same function that fires from the event listener that the node is hooked with)

        - `removeBlockShardsFromMempool(newBlock)`

          Removes the shards in the mempool that are already in a finalized block that’s being added (or any other case where the pool needs updating), updates shards pool in db.

        - `checkBlock(newBlock, previousBlock, referenceBlockchain = this.blocks)`

          Checks index increment between the two blocks. Checks hash link between the two blocks. Checks if the calculated hash of the block is the same as its hash (if block has a valid hash). Checks if the PoW difficulty used for getting the hash is correct vs. what the difficulty algorithm yields. Checks if each txn in the block is valid & adheres to percentages defined for poll funding distribution based on what kind of transaction type they are (check [JSON Formats](https://www.notion.so/796f7321-fbbf-4005-80a4-0d46f840dcc4) to see the different txn types). Checks if all inputs equal all outputs if it is a reward transaction (which it will always be). Checks to make sure that there is an equal amount of shardHashes to transactions (the txns serve as a release of funds from poll escrow to respondent and network participants).

        - `hasShardHash(shardHash)`

          Checks if the passed in shardHash is already incorporated into the held blockchain. Returns JSON object with 2 values. A `hasHash` value which is a boolean and a `shardHashIndex` which is the block index that holds this shard hash. If `hasHash` is false, then `shardHashIndex` will just be set to 0 in the returned object.

      - **Static Methods**

        none

  - **node**
    - **index.js**

      **Description:** Handles blockchain events and definesbroadcasting to other nodes

      - **Instance Variables**

        `host` (node's ip address)

        `port` (port node will be communicating on)

        `chains` (Array of shards (or main chain) pulled from LevelDB Blockchain Storage)

        `peers` (Array of peers with peer ip and what it's working on)

      - **Instance Methods**
        - `constructor(host, port, peers, blockchain)`
          - Initializes variables
          - Calls `hookBlockchain()`
          - Calls `connectToPeers(peers)` if no peers exist in the levelDB
        - `hookBlockchain()`
          - Hook blockchain to handle certain events that any blockchain may emit like:
            - shardBlockAdded

              broadcast(sendLatestBlock, pollId, newBlock)

            - mainBlockAdded

              broadcast(sendLatestBlock, newBlock)

            - unconfirmedPollResponseAdded

              broadcast(sendUnconfirmedPollResponse, pollId, pollResponse)

            - unconfirmedShardAdded

              broadcast(sendUnconfirmedShard, pollId, shardBlockchain)

            - mainChainReplaced

              broadcast(sendLatestBlock, latestBlocks)

            - shardChainReplaced

              broadcast(sendLatestBlock, pollId, latestBlocks)

        - `connectToPeer(peer)`

          Calls `connectToPeers(newPeers)` turning the peer data into an array object

        - `connectToPeers(newPeers)`

          Gets seed info from the REST API and sends personal peer info to all connected peers.

        - `sendPeer()`

          Send personal host info as well as working info to a peer packaged in a js object. Structure can be found in [LevelDB Schema](https://www.notion.so/5c96d260-8191-4312-8a02-34909de6065c) NetStat Storage.

        - `getLatestBlock(peer, pollId)`

          Gets the latest block for a pollId (or "main") from a given peer.

        - `sendLatestBlock(peer, newBlock, pollId)`

          Sends the latest block for a given pollId (or "main") to a given peer

        - `getBlocks(peer, pollId)`

          Gets the blocks for a specific pollId (or "main") from a given peer

        - `sendUnconfirmedPollResponse(peer, pollResponse, pollId)`

          Sends unconfirmed poll response (propagates it forward) and the pollId it belongs to a given peer

        - `sendUnconfirmedShard(peer, shardBlockchain)`

          Sends unconfirmed shardBlockchain (propagates it forward) to a given peer

        - `getMempool(peer, pollId)`

          Gets the pool of unconfirmed poll responses or unconfirmed shard blockchains (if it's the main chain) from the passed in peer. As always pollId could be "main" in the case that node wants the main chain's mempool. Then calls `syncMempool(pollId, unconfirmeds)` to sync this node with other nodes.

        - `getConfirmation(peer, data, pollId)`

          Get if the data has been confirmed in that peer. `pollId` can either be a pollId or "main" if the data we are checking confirmations for is a mainchain field. `data` can be either a pollResponseId, a txn id, or a shard hash that we are checking confirmations for.

        - `getConfirmations(data, pollId)`

          Gets from all peers if the data has been confirmed

        - `syncMempool(unconfirmeds, pollId)`

          Goes through the data pulled from `getMempool(peer, pollId)` and adds them to the node’s appropriate mempool. In the case of a normal pollId being passed in for `pollId` we will get back an array of unconfirmed poll responses for the `unconfirmeds` and we will sync that pollId's mempool. In the case of "main" being passed in for `pollId` we will get back an array of unconfirmed shard blockchains for the `unconfirmeds` and we will sync the main chain's mempool.

        - `checkRecievedBlock(block, isMain = "false")`

          Calls `checkReceiveBlocks(blocks)` on `block` put into an array. `isMain` is boolean if the received block is for the main chain.

        - `checkRecievedBlocks(blocks, isMain = "false")`

          Checks if the length of the received blocks is longer than the node’s current blockchain, and if it is, adds the necessary blocks or replaces the chain entirely in certain conditions. `isMain` is boolean if the received block is for the main chain.

        - `broadcast(fn ...args)`

          Applies a given function to all peers. Arbitrary number of arguments are passed in (caller will add appropriate params to be passed to the applied function since they'll know its signature)

      - **Static Methods**

        none

  - **mine**
    - **index.js**

      **Description:** Handles internal mining logic like constructing a block, determining block hashes, etc.

      - **Instance Variables**
        - `chains`

          Array of shards (or main chain) pulled from LevelDB Blockchain Storage (LevelDB structure can be found at [LevelDB Schema](https://www.notion.so/5c96d260-8191-4312-8a02-34909de6065c))

      - **Instance Methods**
        - `mineShard(pollId, minerAddress)`

          Takes the pollID and the address of the miner so that they can be rewarded later. Spawns a worker thread to execute the actions that follow. Calls `generateShard(pollId)`,  and calls `proveWorkForShard(block, difficulty)` to begin PoW hashing process for the newly constructed block. When done we add the block to our own chain and broadcast the event with the block. We clear the mempool of those transactions once we know we mined the block before getting word of another miner having finished before us.

        - `mineMain(minerAddress)`

          Takes the address of the miner so that they can be rewarded later. First calls `generateMainBlock()` and then finally calls `proveWorkForMain(block, difficulty)` to begin PoW hashing process for the newly constructed mainchain block. When done we add the block to our own chain and broadcast the event with the block. We clear the mempool of the incorporated shards once we know we mined the block before getting word of another miner having finished before us.

      - **Static Methods**
        - `generateShardBlock(pollId)`

          Generates the next block by pulling unconfirmed poll responses from the mempool, validating them, and selects responses that can be mined for the specified pollId. Ensure that they aren’t already confirmed in the blockchain and that there is no double voting. Return the finished block object (work hasn’t been proven yet)

        - `generateMainBlock()`

          Generates the next block by pulling unconfirmed shards from the mempool, validating them, hashing them and extracting the appropriate transactions from the valid shard, adjusting headers correctly. Ensure that they shardHashes aren't already in the held blockchain. Return the finished block object (work hasn’t been proven yet)

        - `proveWorkForShard(block, difficulty)`

          Leading zero proof of work hashing the proper fields that consensus rules dictate and incrementing the nonce until difficulty standards are met dictated by a deterministic algorithm. Function finishes when difficulty is met and block can be given a proper hash to be accepted by other nodes consensus rules.

        - `proveWorkForMain(block, difficulty)`

          Leading zero proof of work hashing the proper fields that consensus rules dictate and incrementing the nonce until difficulty standards are met dictated by a deterministic algorithm. Function finishes when difficulty is met and block can be given a proper hash to be accepted by other nodes consensus rules.

  - **walletUtil**
    - **index.js**
      - **Instance Variables**

        `wallets` (an array of the wallets the miner owns from LevelDB)

      - **Instance Methods**
        - `addWallet()`

          Push wallet to wallets array and persist to LevelDB

        - `createWalletFromPassword(password)`

          Create wallet from password and call `addWallet()`

        - `getWallets()`

          Return all wallet objects in wallets array

        - `getWalletById(id)`

          Return wallet by id

        - `getBalanceForAddress(address)`

          Go through all of the wallets and each address in each wallet. If the address exists return the wallet id, address, and it's respective balance (check UTXO's on [best main blockchain](https://bitcoin.org/en/glossary/block-chain) to get this address's balance)

      - **Static Methods**

        none

    - **wallets.js**
      - **Instance Variables**

        none

      - **Instance Methods**

        none

      - **Static Methods**
        - `fromJSON()`

          Takes JSON and composes a new wallets object (array of wallet objects)

    - **wallet.js**
      - **Instance Variables**

        `id` (a randomly generated 64 byte id for this wallet)

        `passwordHash` (sha256: password)

        `secret` (pbkdf2 secret taken from password hash)

        - `addresses` (js object array with key info and address)

          `privKey` (private key generated using secret)

          `pubKey` (public generated from private key)

          `address` (generated using deterministic 9 step process that can be found in [Miscellaneous](https://www.notion.so/9ffea083-a483-4a56-9737-6941dd62b92e))

      - **Instance Methods**
        - `generateSecret()`

          Generate secret for the wallet using the `passwordHash`

        - `getAddressByIndex(index)`

          Gets an address by its index in the wallet

        - `getAddressByPublicKey(pubKey)`

          Gets an address by a given public key passed in

        - `getPrivateKeyByAddress(address)`

          Gets the private key for a given address if found in the wallet

        - `getAddresses()`

          Return all the of the addresses that the wallet owns

      - **Static Methods**
        - `fromPassword(password)`

          Generates a complete wallet from a given password going through the paswordHash generation process, secret generation, key pair generation, and address derivation. Returns full wallet object with one address initialized in addresses array.

        - `fromJSON(data)`

          Generates a complete wallet object from a JSON representation of the wallet. Returns the wallet object.

  - **util**
    - **cryptoUtil.js**

      **Description:** Helpers for verifying signatures & hashing

      - **Instance Variables**

        none

      - **Instance Methods**

        none

      - **Static Methods**
        - `hash(data)`

          Hash data passed in using sha 256

        - `generateRandomId(size = 64)`

          Generate a random ID by default of size 64 bytes

        - `generateAddress()`

          Generates address using deterministic hashing process starting with the public key

        - `generateSecret(password)`

          Generate a secret using passed in password and salt

        - `generateKeyPairFromSecret(secret)`

          Generate key pair from a given secret

        - `sign(keyPair, message)`

          Sign the data using the private key

        - `isValidSignature(address, signature, plaintextMessage)`

          Verifies arbitrary signature given an user's address, the signature, and the data that was concatenated and signed from the start.

        - `toHex(data)`

          Converts data to hexidecimal format

    - **db.js**

  *miscellaneous config files or a constants file constants.js for difficulty functions, etc.*

- **test (unit and integrations tests)**
  - **data**

    Static JSON data used in tests

  **unitTests.js**

  **integrationsTests.js**

 *miscellaneous configs like package.json or a global application constants file constants.js*
