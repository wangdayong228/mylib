const Chain3 = require('chain3');
// const fs = require('fs');
// const solc = require('solc');//only 0.4.24 version should be used, npm install solc@0.4.24
const solcLib = require('./solcLib');
const moacapi = require('moac-api');
const http = require('http');
const util = require('./util');

// need to have a valid account to use for contracts deployment
const baseaddr = '0x17ebd41cb0bb437cd24e94e2d4cf98ebedce7ad2';//"0xput your wallet accouint";
const basepsd = 'hello'//;"your password";
const sendOption = { from: baseaddr, gas: '2000000' };

const solcVersion = '0.4.25';

var vnodeUri;// = 'http://localhost:8545';
let chain3 = new Chain3();

function init(url = 'http://localhost:8545') {
    vnodeUri = url;

    chain3.setProvider(new Chain3.providers.HttpProvider(vnodeUri));

    if (!chain3.isConnected()) {
        throw new Error('unable to connect to moac vnode at ' + vnodeUri);
    } else {
        console.log('connected to moac vnode at ' + vnodeUri);
        let balance = chain3.mc.getBalance(baseaddr);
        console.log('Check src account balance:' + baseaddr + ' has ' + balance / 1e18 + ' MC');
    }

    if (chain3.personal.unlockAccount(baseaddr, basepsd, 0)) {
        console.log(`${baseaddr} is unlocked`);
    } else {
        console.log(`unlock failed, ${baseaddr}`);
        throw new Error('unlock failed ' + baseaddr);
    }
}

function deploy(contractName, ...params) {

    const compiled = solcLib.compile(contractName, solcVersion);

    var vnodeprotocolbaseContract = chain3.mc.contract(JSON.parse(compiled.abi));

    var vnodeprotocolbase = vnodeprotocolbaseContract.new(
        ...params,
        {
            from: baseaddr,
            data: '0x' + compiled.bin,
            gas: '9000000'
        }
    );
    var contractAddr = waitBlock(vnodeprotocolbase.transactionHash).contractAddress;
    console.log(contractName, 'deploy tx:', vnodeprotocolbase.transactionHash, 'deployed at:', contractAddr);
    return contractAddr;
}

// function deployDappbase(subChainBaseAddr, proxyNodeAddr, sendAmount, nonce) {
//     // const compiled = compile('DappBase');
//     // const tx = sendSubChainTx(subChainBaseAddr, sendAmount, '0x' + compiled.bin, nonce, '0x3', proxyNodeAddr);
//     // console.log('deploy dappbase done:', tx);
//     deploySubchainContract('DappBase', subChainBaseAddr, sendAmount, nonce, proxyNodeAddr);
// }

function deploySubchainContract(contractName, subChainBaseAddr, sendAmount, nonce, proxyNodeAddr) {
    const compiled = solcLib.compile(contractName, solcVersion);
    const tx = sendSubChainTx(subChainBaseAddr, sendAmount, '0x' + compiled.bin, nonce, '0x3', proxyNodeAddr);
    console.log('deploy', contractName, 'done:', tx);
}

// function sendSubChainContractMethod(subChainBaseAddr, methodInDappAddr, data, sendAmount, nonce, proxyNodeAddr) {
//     return sendSubChainTx(subChainBaseAddr, sendAmount, methodInDappAddr + data.substr(2), nonce, '0x1', proxyNodeAddr);
// }

function getContract(contractName, contractAddress) {
    const compiled = solcLib.compile(contractName, solcVersion);

    var contract = chain3.mc.contract(JSON.parse(compiled.abi));
    const instance = contract.at(contractAddress);
    return instance;
}

// function compile(contractFileName) {
//     var basepath = '.';
//     var solpath = basepath + '/' + contractFileName + '.sol';
//     const contract = fs.readFileSync(solpath, 'utf8');

//     // Need to read all contract files to compile
//     var input = {
//         '': contract,
//     };

//     var re = /import "(.*)"/g;
//     var match;

//     while (match = re.exec(contract)) {
//         // console.log(match[1]);
//         var importFileName = match[1].match(/\/(.*\.sol)/)[1];
//         // console.log('importFileName:', importFileName);
//         input[importFileName] = fs.readFileSync(match[1], 'utf8');
//     }

//     var output = solc.compile({ sources: input }, 1);
//     const abi = output.contracts[':' + contractFileName].interface;
//     const bin = output.contracts[':' + contractFileName].bytecode;
//     console.log('compile', contractFileName, 'done');
//     return {
//         abi: abi,
//         bin: bin
//     }
// }

//shardingFlag means
//monther chain: 0, subchain deploy: 0x03, subchain call: 0x01
function sendTx(to, amount, strData = '0x') {
    const tx = chain3.mc.sendTransaction(
        {
            from: baseaddr,//src,
            value: chain3.toSha(amount, 'mc'),
            to: to,
            gas: '2000000',
            gasPrice: chain3.mc.gasPrice,
            data: strData,
        });
    console.log('sending subchain tx from:' + baseaddr + ' to:' + to + ' amount:' + amount + ' with data:' + strData + ' tx:' + tx);
    return tx;
}


function sendSubChainTx(to, amount, strData, nonce, shardingFlag = '0x3', via = null) {
    const tx = chain3.mc.sendTransaction(
        {
            from: baseaddr,//src,
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
    console.log('sending from:' + baseaddr + ' to:' + to + ' nonce:' + nonce + ' shardingFlag:' + shardingFlag + ' via:' + via + ' amount:' + amount + ' with data:' + strData + ' tx:' + tx);
    return tx;
}

function getSubChainNonce(subChainAddr, callback) {
    var body = {
        'jsonrpc': '2.0',
        'id': 0,
        'method': 'ScsRPCMethod.GetNonce',
        'params': {
            'SubChainAddr': subChainAddr,
            'Sender': baseaddr
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

// Check if the input address has enough balance for the mc amount
function checkBalance(inaddr, inMcAmt) {
    if (chain3.mc.getBalance(inaddr) / 1e18 >= inMcAmt) {
        return true;
    } else {
        return false;
    }
}

function waitBalance(addr, target) {
    while (true) {
        let balance = chain3.mc.getBalance(addr) / 1000000000000000000;
        if (balance >= target) {
            console.log('account has enough balance ' + balance);
            break;
        }
        console.log('Waiting the account has enough balance ' + balance);
        util.sleep(5000);
    }
}

function waitBlock(transactionHash) {
    console.log('Waiting a mined block to include your transaction...');

    while (true) {
        let receipt = chain3.mc.getTransactionReceipt(transactionHash);
        if (receipt) {
            // if (receipt.contractAddress) {
            console.log(transactionHash, 'receipt status:', receipt.status);
            return receipt;
            // }
        }
        console.log('block ' + chain3.mc.blockNumber + '...');
        util.sleep(50000);
    }
}

// function sleep(milliseconds) {
//     var start = new Date().getTime();
//     for (var i = 0; i < 1e7; i++) {
//         if ((new Date().getTime() - start) > milliseconds) {
//             break;
//         }
//     }
// }

function isAddress0(address) {
    return address == '0x0000000000000000000000000000000000000000';
}

function overwriteSubchainTx(nonce, via) {
    sendSubChainTx('0x0000000000000000000000000000000000000000', 0, '0x', nonce, '0x3', via)
}

module.exports = {
    moacapi,
    baseaddr,
    chain3,
    // compile: solcLib.compile,
    init,
    deploy,
    // deployDappbase,
    deploySubchainContract,
    getContract,
    sendTx,
    sendSubChainTx,
    sendOption,
    // sendSubChainContractMethod,
    waitBlock,
    // sleep,
    waitBalance,
    checkBalance,
    isAddress0,
    overwriteSubchainTx,

    getSubChainNonce,
    getSubChainReceiptByHash,
    subChainRpc
}