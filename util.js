
function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}

function isAddress0(address) {
    return address == '0x0000000000000000000000000000000000000000';
}

function getAllFuncNames(obj) {
    var tmp = obj;
    var props = [];
    do {
        props = props.concat(Object.getOwnPropertyNames(tmp));
    } while ((tmp = Object.getPrototypeOf(tmp)) && tmp != Object.prototype);
    // console.log(props);

    return props.sort().filter(function (e, i, arr) {
        // console.log(e);
        if (typeof obj[e] == 'function') return true;
    });
}

function getAllPropNames(obj) {
    var tmp = obj;
    var props = [];
    do {
        props = props.concat(Object.getOwnPropertyNames(tmp));
    } while ((tmp = Object.getPrototypeOf(tmp)) && tmp != Object.prototype);
    // console.log(props);
    return props;
}

module.exports = { sleep, isAddress0, getAllFuncNames, getAllPropNames }