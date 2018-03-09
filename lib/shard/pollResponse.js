const CryptoUtil = require('../util/cryptoUtil');
const DateUtil = require('../util/dateUtil');
const R = require('ramda');
const http = require('http');

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
                choice: "George Washingotn"
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
    isValidResponse(minAuth = "bronze", epochPollStart = null, epochPollEnd = null){
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
                certification: bronze
            }
        */
        const userAuth = await getAuthenticationLevel(address);

        // User has credential of null so have never confirmed themselves to our system
        if(userAuth.certification === null){
            return false;
        }

        // By this point some form of auth was found. Check if it sufficient authentication level.
        if(authLevels.indexOf(userAuth.certification) < authLevels.indexOf(minAuth)){
            return false; // User is past minimum authentication
        }

        return true; // Nothing went wrong, poll response is valid internally
    }

    // Get user's authentication credentials
    async getAuthenticationLevel(address){
        return await http.get(`http://${process.env.FACILITATOR_HOST}:${process.env.PORT}/nodes/${address}/verify`);
    }

}

module.exports = PollResponse;
