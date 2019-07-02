var moacLib = require('./moacLib');
var solcLib = require('./solcLib');
var web3Lib = require('./web3Lib');
var util = require('./util');

function getFuncHead(fun) {
    return fun.toString().match(/function(.*){/)[1];
}

function openModuleToRoot(m) {
    Object.keys(m).forEach(k => {
        if (!this[k])
            this[k] = m[k];
        else
            console.log(k, 'has existed in this');
    });
}

//为class增加方法
//使用：如有class person, 则addMethod.bind(person)('hello', fn})
function addMethod(name, fn) {
    var old = this.prototype[name]; //把前一次添加的方法存在一个临时变量old里面
    this.prototype[name] = function () { // 重写了object[name]的方法
        // 如果调用object[name]方法时，传入的参数个数跟预期的一致，则直接调用
        if (fn.length === arguments.length) {
            return fn.apply(this, arguments);
            // 否则，判断old是否是函数，如果是，就调用old
        } else if (typeof old === 'function') {
            return old.apply(this, arguments);
        }
    }
}

//为instance或module增加方法
function addInstMethod(instance, name, fn) {
    var old = instance[name]; //把前一次添加的方法存在一个临时变量old里面
    instance[name] = function () { // 重写了object[name]的方法
        // 如果调用object[name]方法时，传入的参数个数跟预期的一致，则直接调用
        if (fn.length === arguments.length) {
            return fn.apply(this, arguments);
            // 否则，判断old是否是函数，如果是，就调用old
        } else if (typeof old === 'function') {
            return old.apply(this, arguments);
        }
    }
}

module.exports = { moacLib, web3Lib, solcLib, util, getFuncHead, openModuleToRoot, addMethod, addInstMethod };