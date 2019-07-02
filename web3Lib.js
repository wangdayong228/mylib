// const solcLib = require('./solcLib');
const Web3 = require('web3');
const util = require('./util');
const CommonBlkLib = require('./commonBlkLib').CommonBlkLib;

const web3 = new Web3();
var commonBlkLib = new CommonBlkLib();

function init(_nodeUrl = 'http://localhost:8540', _solcVersion = '0.5.3', _baseAddr = '0x17ebd41cb0bb437cd24e94e2d4cf98ebedce7ad2', _basePsd = 'hello', ) {
    commonBlkLib.init(web3, web3.eth, _nodeUrl, _solcVersion, _baseAddr, _basePsd);
    // sendOption = { from: baseAddr, gas: '2000000' };
}

module.exports = {
    web3,
    blk: web3,
    eth: web3.eth,
    core: web3.eth,
    init,
}

util.getAllPropNames(commonBlkLib)
    .filter(p => p !== 'init' && p !== 'initParams')
    .forEach(p => {
        if (typeof commonBlkLib[p] == 'function')
            module.exports[p] = commonBlkLib[p].bind(commonBlkLib);
    });