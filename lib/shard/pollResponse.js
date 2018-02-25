const CryptoUtil = require('../util/cryptoUtil');
const DateUtil = require('../util/dateUtil');
const R = require('ramda');
const http = require('http');
const credentialDb = level(process.env.RESPONDENT_CREDENTIALS_PATH, {valueEncoding: 'json'}); // Fetch credential db instance
const peerDb = level(process.env.NETSTAT_PATH, {valueEncoding: 'json'}); // Fetch peer db instance

const authLevels = ['bronze', 'silver', 'gold', 'platinum'];
/*
    Poll Response Structure
    {
        responseId: F4BF9F7FCBE...71B54475C2ADE8, (SHA256 hash of all header data + data in poll response)
        pollId: 48p159733non71262nn4s070q8974ns,
        address: 034f355af728...bb704075871aa, (respondent address)
        timestamp: 1582069993,
        signature: 5bff78578b...a63a0d8a5c4,
        responseData: [
            {
                question: "Who is your favorite OpenPoll dev?",
                choice: "Michael"
            },
            {
                question: "Who was the first president of the United States",
                choice: "Zachary Wynegar"
            }
        ]

    }
*/

class PollResponse {

    constructor(){
        this.responseId = null;
        this.pollId = null;
        this.address = null;
        this.timestamp = null;
        this.signature = null;
        this.responseData = [];
    }

    // Validates the poll response checking the signature as well as checking for the user's auth credentials
    vaidate(minAuth = "bronze", epochPollStart = null, epochPollEnd = null){
        // Check to make sure the timestap is not before the poll start or after the poll end date
        if(epochPollStart != null && epochPollEnd != null){
            if(this.timestamp < epochPollStart || this.timestamp > epochPollEnd){
                return false; // Poll response has an invalid timestamp
            }
        }

        // Check to make sure that the signature on the address is correct
        const plaintext = this.responseId + this.pollId + this.address + this.timestamp + this.signature + JSON.stringify(this.responseData);
        if(!CryptoUtil.isValidSignature(this.address, this.signature, plaintext)){
            return false; // Signature invalid
        }

        // Get the user's authentication credentials and check. Response will look like this:
        /*
            {
                address: 48c15973...bf84bfadaf,
                certification: bronze,
                dateExpire: 1519081918
            },
        */
        const userAuth = await getAuthenticationLevel(address);

        // User has credential of null so have never confirmed themselves to our system
        if(userAuth.credentials === null){
            return false;
        }

        // By this point some form of auth was found. Analyze if it is valid.
        if(DateUtil.nowAsEpoch() < userAuth.dateExpire){
            if(authLevels.indexOf(userAuth.certification) < authLevels.indexOf(minAuth)){
                return false; // User is not of the minimum authentication level
            }
        }

        return true;
    }

    // Ask facilitator api for peer's credentials
    async getAuthenticationLevel(address){
        return await http.get(`http://${process.env.FACILITATOR_HOST}:${process.env.PORT}/nodes/${address}/verify`);
    }

    static fromJson(data) {
        let pollResponse = new PollResponse();
        R.forEachObjIndexed((value, key) => { pollResponse[key] = value; }, data);
        return pollResponse;
    }

}
