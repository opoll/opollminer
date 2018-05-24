var hook = require("./hook");

// Send the validated block to API
hook.Add("blockValidated", "WebHooks", async function(block){
    if(process.env.WEBHOOK_URL){
        try{
            if (block.pollHash == undefined){
                axios.post(process.env.WEBHOOK_URL + `/mainchain/blocks`, block, {headers:{Authorization:"Bearer " + process.env.WEBHOOK_TOKEN}});
            }else{
                axios.post(process.env.WEBHOOK_URL + `/shards/${block.pollHash}/blocks`, block, {headers:{Authorization:"Bearer " + process.env.WEBHOOK_TOKEN}});
            }
        }catch(err){};
    }
});