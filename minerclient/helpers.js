exports.http = require('http');
exports.url = require('url');
exports.level = require("level");
exports.bodyParser = require('body-parser');
exports.readline = require('readline');

var chalk = require("chalk");
exports.chalk = chalk;


/* echo [DEBUG] to console if .env has ISDEBUG set to 1 */
exports.log = function (msg) {
    if (process.env.ISDEBUG == 1) {
        console.log(chalk.redBright('[DEBUG]'), msg);
    }
}
