var hook = require("./hook");

// Send the validated block to API
hook.Add("blockValidated", "WebHooks", async function(block){
    try{
        if (block.pollHash == undefined){
            axios.post(process.env.FACILITATOR_HOST_DEV + `/mainchain/blocks`, block, {headers:{Authorization:"Bearer " + process.env.WEBHOOK_TOKEN}});
        }else{
            axios.post(process.env.FACILITATOR_HOST_DEV + `/shards/${block.pollHash}/blocks`, block, {headers:{Authorization:"Bearer " + process.env.WEBHOOK_TOKEN}});
        }
    }catch(err){};
});