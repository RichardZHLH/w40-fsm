const fs = require('fs');
const path = require('path');
const net = require("net");
const optimist = require('optimist');
const Web3 = require('web3');

const base = 2500000/365
console.log("one:", base)

let rate = 1
async function test() {
  let first = 18142
  let end = 20174
  let total = 0
  for(let i=first; i<end; i++) {
    let ei = base * 0.88 **(parseInt((i-first)/365))
    total += ei
    console.log("ei:", ei)
  }
  console.log("total:", total)
}
test()