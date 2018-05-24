var hook = require("./hook");
var axios = require("axios");
console.log("web hook");
// Send the validated block to API
hook.Add("utxoGenerated", "WebHooks", async function(data){

    try{
        if (data.block){
            axios.post(process.env.FACILITATOR_HOST_DEV + `/mainchain/blocks`, {block:data.block, utxoChangeDigest:data.utxo}, {headers:{Authorization:"Bearer " + process.env.WEBHOOK_TOKEN}});
        }else{
            axios.post(process.env.FACILITATOR_HOST_DEV + `/shards/${block.pollHash}/blocks`, data, {headers:{Authorization:"Bearer " + process.env.WEBHOOK_TOKEN}});
        }
    }catch(err){
    };
});