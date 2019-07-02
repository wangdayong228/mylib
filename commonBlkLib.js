const solcLib = require('./solcLib');
const util = require('./util');

class CommonBlkLib {

    // baseaddr = '0x17ebd41cb0bb437cd24e94e2d4cf98ebedce7ad2';//"put your wallet account";
    // basePsd = 'hello'//;"your password";
    // solcVersion = '0.5.3';
    // blk = chain3;
    // core = blk.mc;
    // blk; core; solcVersion; baseAddr; basePsd; nodeUrl;
    // solcVersion = '0.5.3';

    getEnv() {
        return {
            blk: this.blk,
            core: this.core,
            baseAddr: this.baseAddr,
            basePsd: this.basePsd,
            nodeUrl: this.nodeUrl,
            solcVersion: this.solcVersion
        }
    }

    initParams(blk, core, baseAddr, basePsd, nodeUrl, solcVersion) {
        this.blk = blk;
        this.core = core;
        this.baseAddr = baseAddr;
        this.basePsd = basePsd;
        this.nodeUrl = nodeUrl;
        this.solcVersion = solcVersion;
    }

    init(blk, core, nodeUrl, solcVersion = '0.5.3', baseAddr = '0x17ebd41cb0bb437cd24e94e2d4cf98ebedce7ad2', basePsd = 'hello') {
        this.initParams(blk, core, baseAddr, basePsd, nodeUrl, solcVersion);

        this.blk.setProvider(new this.blk.providers.HttpProvider(this.nodeUrl));

        if (!this.blk.isConnected()) {
            throw new Error('unable to connect to blockchain node at ' + this.nodeUrl);
        } else {
            console.log('connected to node at ' + this.nodeUrl);
            let balance = this.core.getBalance(this.baseAddr);
            console.log('Check src account balance:' + this.baseAddr + ' has ' + balance / 1e18 + ' MC');
        }

        if (this.blk.personal.unlockAccount(this.baseAddr, this.basePsd, 0)) {
            console.log(`${this.baseAddr} is unlocked`);
        } else {
            console.log(`unlock failed, ${this.baseAddr}`);
            throw new Error('unlock failed ' + this.baseAddr);
        }
    }

    deploy(contractName, ...params) {

        const compiled = solcLib.compile(contractName, this.solcVersion);

        var contract = this.core.contract(JSON.parse(compiled.abi));

        var gasLimit = this.core.getBlock('latest').gasLimit;

        var deployResult = contract.new(
            ...params,
            {
                from: this.baseAddr,
                data: '0x' + compiled.bin,
                gas: gasLimit.toString()//'9000000'
            }
        );
        var contractAddr = this.waitBlock(deployResult.transactionHash).contractAddress;
        console.log(contractName, 'deploy tx:', deployResult.transactionHash, 'deployed at:', contractAddr);
        return contractAddr;
    }


    getContract(contractName, contractAddress) {
        const compiled = solcLib.compile(contractName, this.solcVersion);

        var contract = this.core.contract(JSON.parse(compiled.abi));
        const instance = contract.at(contractAddress);
        return instance;
    }

    // Check if the input address has enough balance for the mc amount
    checkBalance(inaddr, inMcAmt) {
        if (this.core.getBalance(inaddr) / 1e18 >= inMcAmt) {
            return true;
        } else {
            return false;
        }
    }

    waitBalance(addr, target) {
        while (true) {
            let balance = this.core.getBalance(addr) / 1000000000000000000;
            if (balance >= target) {
                console.log('account has enough balance ' + balance);
                break;
            }
            console.log('Waiting the account has enough balance ' + balance);
            util.sleep(5000);
        }
    }

    waitBlock(transactionHash) {
        console.log('Waiting a mined block to include your transaction...');

        while (true) {
            let receipt = this.core.getTransactionReceipt(transactionHash);
            if (receipt) {
                // if (receipt.contractAddress) {
                console.log(transactionHash, 'receipt status:', receipt.status);
                return receipt;
                // }
            }
            console.log('block ' + this.core.blockNumber + '...');
            util.sleep(50000);
        }
    }
}

module.exports = { CommonBlkLib }