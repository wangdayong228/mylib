const Chain3 = require('chain3');
// const fs = require('fs');
// const solc = require('solc');//only 0.4.24 version should be used, npm install solc@0.4.24
const solcLib = require('./solcLib');
const moacapi = require('moac-api');
const http = require('http');
const CommonBlkLib = require('./commonBlkLib').CommonBlkLib;
const util = require('./util');

// need to have a valid account to use for contracts deployment
// var baseAddr = '0x17ebd41cb0bb437cd24e94e2d4cf98ebedce7ad2';//"put your wallet account";
// var basePsd = 'hello'//;"your password";
// var solcVersion = '0.5.3';
// var vnodeUri = 'http://localhost:8545';

// var sendOption;
let chain3 = new Chain3();

var commonBlkLib = new CommonBlkLib();

function init(_nodeUrl = 'http://localhost:8545', _solcVersion = '0.5.3', _baseAddr = '0x17ebd41cb0bb437cd24e94e2d4cf98ebedce7ad2', _basePsd = 'hello') {
    commonBlkLib.init(chain3, chain3.mc, _nodeUrl, _solcVersion, _baseAddr, _basePsd);
    // sendOption = { from: _baseAddr, gas: '2000000' };
}

// function deployDappbase(subChainBaseAddr, proxyNodeAddr, sendAmount, nonce) {
//     // const compiled = compile('DappBase');
//     // const tx = sendSubChainTx(subChainBaseAddr, sendAmount, '0x' + compiled.bin, nonce, '0x3', proxyNodeAddr);
//     // console.log('deploy dappbase done:', tx);
//     deploySubchainContract('DappBase', subChainBaseAddr, sendAmount, nonce, proxyNodeAddr);
// }

function deploySubchainContract(contractName, subChainBaseAddr, sendAmount, nonce, proxyNodeAddr) {
    const compiled = solcLib.compile(contractName, commonBlkLib.solcVersion);
    const tx = sendSubChainTx(subChainBaseAddr, sendAmount, '0x' + compiled.bin, nonce, '0x3', proxyNodeAddr);
    console.log('deploy', contractName, 'done:', tx);
}

// function sendSubChainContractMethod(subChainBaseAddr, methodInDappAddr, data, sendAmount, nonce, proxyNodeAddr) {
//     return sendSubChainTx(subChainBaseAddr, sendAmount, methodInDappAddr + data.substr(2), nonce, '0x1', proxyNodeAddr);
// }

//shardingFlag means
//monther chain: 0, subchain deploy: 0x03, subchain call: 0x01
function sendTx(to, amount, strData = '0x') {
    const tx = chain3.mc.sendTransaction(
        {
            from: commonBlkLib.baseAddr,//src,
            value: chain3.toSha(amount, 'mc'),
            to: to,
            gas: '2000000',
            gasPrice: chain3.mc.gasPrice,
            data: strData,
        });
    console.log('sending subchain tx from:' + commonBlkLib.baseAddr + ' to:' + to + ' amount:' + amount + ' with data:' + strData + ' tx:' + tx);
    return tx;
}


function sendSubChainTx(to, amount, strData, nonce, shardingFlag = '0x3', via = null) {
    const tx = chain3.mc.sendTransaction(
        {
            from: commonBlkLib.baseAddr,//src,
            value: chain3.toSha(amount, 'mc'),
            to: to,
            gas: 0,
            gasPrice: chain3.mc.gasPrice,
            data: strData,
            shardingFlag: shardingFlag,
            via: via,
            nonce: nonce,
            chainId: chain3.toHex(101)
        });
    console.log('sending from:' + commonBlkLib.baseAddr + ' to:' + to + ' nonce:' + nonce + ' shardingFlag:' + shardingFlag + ' via:' + via + ' amount:' + amount + ' with data:' + strData + ' tx:' + tx);
    return tx;
}

function getSubChainNonce(subChainAddr, callback) {
    var body = {
        'jsonrpc': '2.0',
        'id': 0,
        'method': 'ScsRPCMethod.GetNonce',
        'params': {
            'SubChainAddr': subChainAddr,
            'Sender': commonBlkLib.baseAddr
        }
    };
    subChainRpc(body, callback);
}

function getSubChainReceiptByHash(subChainAddr, hash, callback) {
    var body = {
        'jsonrpc': '2.0',
        'id': 0,
        'method': 'ScsRPCMethod.GetReceiptByHash',
        'params': {
            'Hash': hash,
            'SubChainAddr': subChainAddr
        }
    };
    subChainRpc(body, callback);
}

function subChainRpc(body, callback) {

    var options = {
        hostname: '127.0.0.1',
        port: 8000,
        path: '/rpc',
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
    }

    var req = http.request(options, (res) => {
        let data = '';
        // A chunk of data has been recieved.
        res.on('data', (chunk) => {
            data += chunk;
        });
        // The whole response has been received. Print out the result.
        res.on('end', () => {
            console.log('received data:', data);
            callback(null, JSON.parse(data).result);
        });
    }).on('error', (err) => {
        console.log('req Error: ' + err.message);
        callback(err);
    });
    req.write(JSON.stringify(body));
    req.end();
}

function overwriteSubchainTx(nonce, via) {
    sendSubChainTx('0x0000000000000000000000000000000000000000', 0, '0x', nonce, '0x3', via)
}

module.exports = {
    moacapi,
    chain3,
    blk: chain3,
    mc: chain3.mc,
    core: chain3.mc,
    init,
    // deployDappbase,
    deploySubchainContract,
    sendTx,
    sendSubChainTx,
    // sendOption,
    // sendSubChainContractMethod,
    overwriteSubchainTx,

    getSubChainNonce,
    getSubChainReceiptByHash,
    subChainRpc
}

util.getAllPropNames(commonBlkLib)
    .filter(p => p !== 'init' && p !== 'initParams')
    .forEach(p => {
        if (typeof commonBlkLib[p] == 'function')
            module.exports[p] = commonBlkLib[p].bind(commonBlkLib);
        // else
        //     module.exports[p] = commonBlkLib[p];
    });