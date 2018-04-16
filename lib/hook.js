if (global.hook) {
    return global.hook;
}

var hook = {};

hook.HookList = {};

/*

    easy to use hooking system for quick information passing between modules

    example:

    hook.Add("HOOKNAME", "hook identifier", function(data){
        console.log(data); // will log "test"
    });

    hook.Call("HOOKNAME", "test"); // call the hook and pass the argument "test"

*/

hook.Add = function (type, id, func) {
    if (!hook.HookList[type]) { hook.HookList[type] = {}; }
    hook.HookList[type][id] = func;
}

hook.Call = function (type, ...args) {
    for (var id in hook.HookList[type] || {}) {
        var returned = hook.HookList[type][id](...args);
        // Allow a hook to cease
        if (returned != undefined) {
            return returned;
        }
    }
}

module.exports = hook;