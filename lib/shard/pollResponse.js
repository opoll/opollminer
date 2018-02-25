const CryptoUtil = require('../util/cryptoUtil');
const DateUtil = require('../util/dateUtil');

const authLevels = ['bronze', 'silver', 'gold', 'platinum'];
const POSIX_EPOCH_DAY = 86400;
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

        // Get the user's authentication credentials and check. Response will look like this
        /*
            {
                address: 48c15973...bf84bfadaf,
                certification: bronze,
                dateExpire: 1519081918
            },
        */
        const userAuth = await getAuthenticationLevel(address);
        if(DateUtil.nowAsEpoch() < userAuth.dateExpire){
            if(authLevels.indexOf(userAuth.certification) < authLevels.indexOf(minAuth)){
                return false; // User is not of the minimum authentication level
            }
        }

        return true;
    }

    async getAuthenticationLevel(address){
        // First check locally if the user's credentials are known


        // Second ask peers one hop out if they have the user's credentials


        // Finally if no result ask the REST API if it has credentials for the user
        // If it doesn't then return null, user has no auth in our systems


    }

    static fromJson(data) {
        let pollResponse = new PollResponse();
        R.forEachObjIndexed((value, key) => { pollResponse[key] = value; }, data);
        return pollResponse;
    }

}
