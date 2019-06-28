var fs = require('fs');
var solc = require('solc');
var path = require('path');

function compile(contractFilePath, solcVersion) {
    if (solcVersion == '0.4.24')
        return compile0425(contractFilePath);
    if (solcVersion == '0.5.3')
        return compile053(contractFilePath);
}

function compile0425(contractFilePath) {
    // var basepath = '.';
    // var solpath = basepath + '/' + contractFilePath + '.sol';
    // var solcpath = contractFilePath;
    var solName = path.basename(contractFilePath, '.sol');
    var dirName = path.dirname(contractFilePath);
    const contract = fs.readFileSync(contractFilePath, 'utf8');

    // Need to read all contract files to compile
    var input = {
        '': contract,
    };

    var regex = /import (".*"|'.*')/g;
    var match;
    while (match = regex.exec(contract)) {
        // console.log(match[1]);
        var importFileName = match[1].match(/\/(.*\.sol)/)[1];
        // console.log('importFileName:', importFileName);
        input[importFileName] = fs.readFileSync(path.join(dirName, match[1].substr(1, match[1].length - 2)), 'utf8');
    }

    var output = solc.compile({ sources: input }, 1);
    console.log('compile output:', output);

    const abi = output.contracts[':' + solName].interface;
    const bin = output.contracts[':' + solName].bytecode;
    console.log('compile', solName, 'done');
    return {
        abi: abi,
        bin: bin
    }
}

function compile053(contractFilePath) {
    var solName = path.basename(contractFilePath, '.sol');
    var dirName = path.dirname(contractFilePath);

    var input = {
        language: 'Solidity',
        sources: {},
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            },
            // Optional: Optimizer settings (enabled defaults to false)
            optimizer: {
                enabled: true,
                runs: 500
            },
        }
    };
    input.sources[`${solName}.sol`] = {
        // content: fs.readFileSync(`../src/contract/${contractFileName}.sol`, 'utf-8')
        // content: fs.readFileSync(`./${contractFilePath}.sol`, 'utf-8')
        content: fs.readFileSync(contractFilePath, 'utf-8')
    };

    var compileRst = solc.compile(JSON.stringify(input), p => findImports(path.join(dirName, p)));
    var output = JSON.parse(compileRst);
    console.log('compile output:', output);
    // return output;

    if (output.errors)
        console.log(output);
    var contractOutput = output.contracts[`${solName}.sol`][`${solName}`];
    var abi = JSON.stringify(contractOutput.abi);
    var bytecode = contractOutput.evm.bytecode.object;
    return {
        abi: abi,
        bin: bytecode
    }
}

function findImports(path) {
    // const fullPath = `../src/contract/${path.replace('./', '')}`;
    // const fullPath = `./${path.replace('./', '')}`;
    const fullPath = path;
    console.log('find imports of path:', fullPath);
    if (fs.existsSync(fullPath))
        return { contents: fs.readFileSync(fullPath, 'utf-8') }
    else
        return { error: 'File not found' }
}

module.exports = { compile }