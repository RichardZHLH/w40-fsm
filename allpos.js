const fs = require('fs');
const path = require('path');
const net = require("net");
const optimist = require('optimist');
const Web3 = require('web3');
const BigNumber=require('bignumber.js')

const prividerType = {
  http: "http"
  ,ipc: "ipc"
}
//node trace.js --type http --uri https://nodes-testnet.wandevs.org/wan
function parseScArgs() {
  let argv = optimist
  .usage("Usage: node $0 ")
  .alias('h', 'help')
  .describe('h', 'display the usage')
  // .describe('type', `identify the provider type, should be "${prividerType.http}" or "${prividerType.ipc}"`)
  // // such /Users/myuser/Library/Ethereum/geth.ipc for ipc
  // .describe('uri', `identify uri path`)
  // .describe('txHash', `identify the transaction hash to be parsed`)
  // .describe('output', `identify the output file`)
  // .default('type', prividerType.ipc)
  // .default('output', path.join("txTrace.json"))
  // .default('txHash', "0xbd0c4aecee47d0e8396d5ad1f8d66221c66520bbdefd7f779bc751ab13937db3")
  // .string(["uri", "txHash", "output"])
  // .demand(["uri", "txHash"])
  .argv;

  if (argv.help) {
    optimist.showHelp();
    process.exit(0);
  }
  return argv;
}

function insertMethod(web3, name, call, params, inputFormatter, outputFormatter) {
  return new web3.extend.Method({ name, call, params, inputFormatter, outputFormatter });
}

// const url = "https://gwan-ssl.wandevs.org:56891"
// const url = "http://127.0.0.1:8545"
const url = "http://123.123.110.44:26891"

function getClient(type, uri) {
  let client;
  if (type === prividerType.ipc) {
    client = new Web3(new Web3.providers.IpcProvider(uri, net));
  } else {
    client = new Web3(new Web3.providers.HttpProvider(uri, {timeout:111000, keepAlive: false}));
  }
  console.log("type:", type, "uri:", uri);

  client.extend({
    property: 'wan',
    methods:
    [
      insertMethod(client, 'getOTAMixSet', 'wan_getOTAMixSet', 2, [null,null], null),
      insertMethod(client, 'checkOTAUsed', 'wan_checkOTAUsed', 1, [null], null),
    ],
    properties: [],
  });
  client.extend({
    property: 'personal',
    methods:
    [
      insertMethod(client, 'getOTABalance', 'personal_getOTABalance', 1, [null], null),
    ],
    properties: [],
  });
  client.extend({
    property: 'pos',
    methods:
    [
      insertMethod(client, 'getEpochIncentive', 'pos_getEpochIncentive', 1, [null], null),
      insertMethod(client, 'getEpochGasPool', 'pos.getEpochGasPool', 1, [null], null),
    ],
    properties: [],
  });
  return client;
}

async function test() {
  const argv = parseScArgs();

  const client = getClient(url.split(':')[0], url);
  // const result = await client.wan.getOTABalance("0x23fa53c"); //  "37699743"
  // console.log("result:", result)


  let allPos = BigNumber(0)
  for(let i=18141; i<20173; i++) {
    let pi = await client.pos.getEpochIncentive(i)
    console.log("pi:", pi)
    allPos = allPos.plus(pi)
  }
  console.log("allPos:", allPos.toString())

  let allGas = BigNumber(0)
  for(let i=18141; i<20173; i++) {
    let pg = await client.pos.getEpochGasPool(i)
    console.log("pg:", pg)
    allGas = allPos.plus(pg)
  }
  console.log("allGas:", allGas.toString())
}
test()