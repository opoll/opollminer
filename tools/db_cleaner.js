const FileSystem = require('fs');
const Path = require('path');
function readDirR(dir) {
    return FileSystem.statSync(dir).isDirectory()
        ? Array.prototype.concat(...FileSystem.readdirSync(dir).map(f => readDirR(Path.join(dir, f))))
        : dir;
}
var files = readDirR("./db/");
files.forEach(function (val) {

    if (Path.basename(val) == ".gitignore") { return; }
    FileSystem.unlink("./" + val, (err) => { });

});
