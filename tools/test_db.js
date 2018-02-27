const Db = require('../lib/util/db');

Db.getMainMempools().then((result) => {
    console.log(result)
})
