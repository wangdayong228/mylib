const solcLib = require('./solcLib');
const Web3 = require('web3');
const util = require('./util');

const baseaddr = '0x17ebd41cb0bb437cd24e94e2d4cf98ebedce7ad2';//"0xput your wallet accouint";
const basepsd = 'hello'//;"your password";

var solcVersion = '0.5.3';

const web3 = new Web3();
function init(url = 'http://localhost:8540', _solcVersion = '0.5.3') {
    solcVersion = _solcVersion;
    web3.setProvider(new Web3.providers.HttpProvider(url));
    if (!web3.isConnected()) {
        throw new Error('unable to connect to moac vnode at ' + url);
    } else {
        console.log('connected to moac vnode at ' + url);
        let balance = web3.eth.getBalance(baseaddr);
        console.log('Check src account balance:' + baseaddr + ' has ' + balance / 1e18 + ' MC');
    }

    if (web3.personal.unlockAccount(baseaddr, basepsd, 0)) {
        console.log(`${baseaddr} is unlocked`);
    } else {
        console.log(`unlock failed, ${baseaddr}`);
        throw new Error('unlock failed ' + baseaddr);
    }
}

function deploy(contractName, ...params) {

    const compiled = solcLib.compile(contractName, solcVersion);

    var contract = web3.eth.contract(JSON.parse(compiled.abi));

    var vnodeprotocolbase = contract.new(
        ...params,
        {
            from: baseaddr,
            data: '0x' + compiled.bin,
            gas: '8000000'
        }
    );
    var contractAddr = waitBlock(vnodeprotocolbase.transactionHash).contractAddress;
    console.log(contractName, 'deploy tx:', vnodeprotocolbase.transactionHash, 'deployed at:', contractAddr);
    return contractAddr;
}

function getContract(contractName, contractAddress) {
    const compiled = solcLib.compile(contractName, solcVersion);
    console.log('compiled:', compiled);
    var contract = web3.eth.contract(JSON.parse(compiled.abi));
    const instance = contract.at(contractAddress);
    return instance;
}


function waitBlock(transactionHash) {
    console.log('Waiting a mined block to include your transaction...');

    while (true) {
        let receipt = web3.eth.getTransactionReceipt(transactionHash);
        if (receipt) {
            // if (receipt.contractAddress) {
            console.log(transactionHash, 'receipt status:', receipt.status);
            return receipt;
            // }
        }
        console.log('block ' + web3.eth.blockNumber + '...');
        util.sleep(50000);
    }
}

module.exports = { init, deploy, getContract, waitBlock, web3 }