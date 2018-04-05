
var axios = require("axios");

// Define p2p structure
var p2p = {}


// Refresh peers who are mining the main chain
p2p.refreshPeers = function () {
    // Query API for list of main chain peers
    var peers = await axios.get(process.env.FACILITATOR_HOST_DEV + `/main/peers`);

    // No peers or API fail?
    if (!peers || !peers[0]) {
        return;
    }
    

}

p2p.getLatestBlock = function () {
   
}