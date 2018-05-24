var hook = require("./hook");
var axios = require("axios");
console.log("web hook");

// Send the validated block to API
hook.Add("blockValidated", "WebHooks", async function(block) {
    if(process.env.WEBHOOK_URL){
        try{
            if (block.pollHash == undefined){
                axios.post(process.env.WEBHOOK_URL + `/mainchain/blocks`, block, {headers:{Authorization:"Bearer " + process.env.WEBHOOK_TOKEN}});
            }else{
                axios.post(process.env.WEBHOOK_URL + `/shards/${block.pollHash}/blocks`, block, {headers:{Authorization:"Bearer " + process.env.WEBHOOK_TOKEN}});
            }
        }catch(err){}
    }
});

hook.Add("utxoGenerated", "WebHooks", async function(data){
    if(process.env.WEBHOOK_URL){
        try{
            if (data.block){
                axios.post(process.env.WEBHOOK_URL + `/mainchain/blocks`, {block:data.block, utxoChangeDigest:data.utxo}, {headers:{Authorization:"Bearer " + process.env.WEBHOOK_TOKEN}});
            }else{
                axios.post(process.env.WEBHOOK_URL + `/shards/${block.pollHash}/blocks`, data, {headers:{Authorization:"Bearer " + process.env.WEBHOOK_TOKEN}});
            }
        }catch(err){
        };
    }

});