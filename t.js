const fs = require('fs');
const path = require('path');
const net = require("net");
const optimist = require('optimist');
const Web3 = require('web3');
const BigNumber=require('bignumber.js')
const json2csv = require('json2csv');
const csvParse = require('csv-parser');

const prividerType = {
  http: "http"
  ,ipc: "ipc"
}


function insertMethod(web3, name, call, params, inputFormatter, outputFormatter) {
  return new web3.extend.Method({ name, call, params, inputFormatter, outputFormatter });
}

// const url = "https://gwan-ssl.wandevs.org:56891"
// const url = "http://127.0.0.1:26891"
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
      insertMethod(client, 'getEpochGasPool', 'pos_getEpochGasPool', 1, [null], null),
      insertMethod(client, 'getIncentivePool', 'pos_getIncentivePool', 1, [null], null),
    ],
    properties: [],
  });
  return client;
}



function iso8601ToTimestamp(isoString) {
  const date = new Date(isoString);
  const timestampInSeconds = Math.floor(date.getTime() / 1000);
  return timestampInSeconds;
}



function DateToEpochID(s) {
  const isoDate = s + 'T04:00:00Z';
  const timestamp = iso8601ToTimestamp(isoDate);
  return parseInt(timestamp/3600/24);
}

  
const Filename = "PosSum.csv"
function generateCsv(csvData, filename) {
  let csv = json2csv.parse(csvData, {fields:["fromDate", "endDate", "fromEpoch","endEpoch","valueAll", "valueFromGas", "valueFromPos","valueTheoretical","cap"]})
  fs.writeFileSync(filename,csv)
  
  
}



function readCSVWithParser(filename) {
  return new Promise((resolve, reject) => {
      const results = [];

      fs.createReadStream(path.join(__dirname, filename))
          .pipe(csvParse())
          .on('data', (data) => {
              // 尝试将数值字段转换为数字
              Object.keys(data).forEach(key => {
                  // 检查是否可以转换为数字
                  const numValue = Number(data[key]);
                  if (!isNaN(numValue)) {
                      data[key] = numValue;
                  }
              });
              results.push(data);
          })
          .on('end', () => {
              resolve(results);
          })
          .on('error', (error) => {
              reject(error);
          });
  });
}

async function test() {





  const client = getClient(url.split(':')[0], url);
  // const result = await client.wan.getOTABalance("0x23fa53c"); //  "37699743"
  // console.log("result:", result)


  let first = 18142
  let end = 20171


  // let allPos = BigNumber(0)
  // for(let i=first; i<=end; i++) {
  //   let pi = await client.pos.getEpochIncentive(i)
  //   // console.log("pi:", pi)
  //   allPos = allPos.plus(pi)
  // }
  // console.log("allPos:", allPos.toString())

  // let allGas = BigNumber(0)
  // for(let i=first; i<=end; i++) {
  //   let pg = await client.pos.getEpochGasPool(i)   // pos.getIncentivePool()
  //   // console.log("pg:", pg)
  //   allGas = allGas.plus(pg)
  // }
  // console.log("allGas:", allGas.toString())


  const startBlock = 21454700
  const endBlock = 37694849

  let saveTotal = BigNumber(0)
  for(let i=startBlock; i<=endBlock; i++) {
    let b = await client.eth.getBlock(i)
    saveTotal = saveTotal.plus(BigNumber(b.baseFeePerGas).times(b.gasUsed))
  }
  console.log("saveTotal:",saveTotal.toString())

}

const csvData = [
  {fromDate:'2019-09-01', endDate:'2020-08-31'},
  {fromDate:'2020-09-01', endDate:'2021-08-31'},
  {fromDate:'2021-09-01', endDate:'2022-08-31'},
  {fromDate:'2022-09-01', endDate:'2023-08-31'},
  {fromDate:'2023-09-01', endDate:'2024-08-31'},
  {fromDate:'2024-09-01', endDate:'2025-03-28'},
  {fromDate:'2024-03-28', endDate:'2025-03-28'}
]
async function main() {
  const client = getClient(url.split(':')[0], url);

  // generateCsv(csvData, Filename)
  // let data = await readCSVWithParser(Filename)
  let data = csvData
  // console.log("data:", data)
  for(let i=0; i<data.length; i++) {
    let fromEpoch = DateToEpochID(data[i].fromDate)
    console.log("fromEpoch:", fromEpoch)
    let endEpoch = DateToEpochID(data[i].endDate)
    console.log("endEpoch:", endEpoch)

    let allPos = BigNumber(0)
    for(let k=fromEpoch; k<=endEpoch; k++) {
      let pk = await client.pos.getEpochIncentive(k)
      // console.log("pk:", pk)
      allPos = allPos.plus(pk)
    }
    console.log("allPos:", allPos.toString())

    let allGas = BigNumber(0)
    let allTheoretical = BigNumber(0)
    for(let k=fromEpoch; k<=endEpoch; k++) {
      let gk = await client.pos.getIncentivePool(k)
      // console.log("gk1:", gk[1])
      allGas = allGas.plus(gk[2])
      allTheoretical = allTheoretical.plus([gk[1]])
    }
    console.log("allGas:", allGas.toString())
    data[i].fromEpoch = fromEpoch
    data[i].endEpoch = endEpoch
    data[i].valueAll = allPos.shiftedBy(-18).toFixed(4)
    data[i].valueFromGas = allGas.shiftedBy(-18).toFixed(4)
    data[i].valueFromPos = allPos.minus(allGas).shiftedBy(-18).toFixed(4)
    data[i].valueTheoretical = allTheoretical.shiftedBy(-18).toFixed(4)
    data[i].cap = allTheoretical.plus(allGas).minus(allPos).shiftedBy(-18).toFixed(4)
  }
  generateCsv(data, Filename)
}

main()