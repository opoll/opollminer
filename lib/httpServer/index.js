const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Block = require('../shard/block');
const CryptoUtil = require('../util/cryptoUtil');


class HttpServer {

    constructor(node, operator, miner) {
        require('dotenv').config();
        this.app = express();
        this.app.use(bodyParser.json());


        /************************************************************************************/

        // Network GET Routes
        this.app.get('/network/peers', (req, res) => {

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });

        // Network POST Routes
        this.app.post('/network/peers', (req, res) => {

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });




        /************************************************************************************/

        // Shard GET Routes
        this.app.get('/shard/:pollId/:responseId/confirmations', (req, res) => {
            const pollId = req.params.pollId;
            const responseId = req.params.responseId;

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });

        this.app.get('/shard/:pollId/latest', (req, res) => {
            const pollId = req.params.pollId;

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });

        this.app.get('/shard/:pollId', (req, res) => {
            const pollId = req.params.pollId;

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });

        this.app.get('/shard/:pollId/mempool', (req, res) => {
            const pollId = req.params.pollId;

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });

        this.app.get('/shard/:pollId/:responseId', (req, res) => {
            const pollId = req.params.pollId;
            const responseId = req.params.responseId;

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });

        this.app.get('/shard/:pollId/:responseId', (req, res) => {
            const pollId = req.params.pollId;
            const responseId = req.params.responseId;

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });

        this.app.get('/shard/:pollId/:blockHash', (req, res) => {
            const pollId = req.params.pollId;
            const blockHash = req.params.blockHash;

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });

        this.app.get('/shard/:pollId/:blockIndex', (req, res) => {
            const pollId = req.params.pollId;
            const blockIndex = req.params.blockIndex;

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });


        // Shard POST Routes
        this.app.post('/shard/:pollId/mempool', (req, res) => {
            const pollId = req.params.pollId;

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });


        // Shard PUT Routes
        this.app.put('/shard/:pollId/latest', (req, res) => {
            const pollId = req.params.pollId;

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });

        /************************************************************************************/

        // Main GET Routes
        this.app.get('/main/:shardHash/confirmations', (req, res) => {
            const shardHash = req.params.shardHash;

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });

        this.app.get('/main/:txnId/confirmations', (req, res) => {
            const txnId = req.params.txnId;

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });

        this.app.get('/main/latest', (req, res) => {

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });

        this.app.get('/main', (req, res) => {

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });

        this.app.get('/main/txnmempool', (req, res) => {

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });

        this.app.get('/main/shardmempool', (req, res) => {

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });

        this.app.get('/main/:txnId', (req, res) => {
            const txnId = req.params.txnId;

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });

        this.app.get('/main/:blockHash', (req, res) => {
            const blockHash = req.params.blockHash;

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });

        this.app.get('/main/:blockHeight', (req, res) => {
            const blockHeight = req.params.blockHeight;

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });


        // Main POST Routes
        this.app.post('/main/mempool', (req, res) => {

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });


        // Main PUT Routes
        this.app.put('/main/latest', (req, res) => {

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
        });



        /************************************************************************************/

    }

    listen(host = node.host, port = process.env.PORT) {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(port, host, (err) => {
                if (err) reject(err);
                console.info(`Starting server & listening on port ${port}.`);
                resolve(this);
            });
        });
    }

    stop() {
        return new Promise((resolve, reject) => {
            this.server.close((err) => {
                if (err) reject(err);
                console.info('Closing server & stopping.');
                resolve(this);
            });
        });
    }

}

module.exports = HttpServer;
