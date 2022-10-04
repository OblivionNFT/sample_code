import https from 'https'
import { OpenSeaSDK, Network } from 'opensea-js';
import HDWalletProvider from "@truffle/hdwallet-provider";
import * as fs from 'fs';
import request from "request";
// const HDWalletProvider = require("@truffle/hdwallet-provider");
// var fs = require('fs');
// var request = require('request');

var obj_js = JSON.parse(fs.readFileSync('parameters_creeper_bot_bid.json', 'utf8'));
console.log(HDWalletProvider)
var wallets_info = JSON.parse(fs.readFileSync('wallets.json', 'utf8'));
var collections = JSON.parse(fs.readFileSync('collections.json', 'utf8'));
var proxy_file = JSON.parse(fs.readFileSync('proxies_list.json', 'utf8'));
// var assets_bid = JSON.parse(fs.readFileSync('assets_to_bid.json', 'utf8'));
// var collections_bid = JSON.parse(fs.readFileSync('collections_bid.json', 'utf8'));

// var array = fs.readFileSync('Webshare 500 proxies.txt').toString().split("\n");
// function sleep(duration) {return new Promise(resolve => {setTimeout(() => {resolve()}, duration * 1000)})}

function getAllIndexes(arr, val) {
  var indexes = [], i;
  for(i = 0; i < arr.length; i++)
      if (arr[i] >= val)
          indexes.push(i);
  return indexes;
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const tokenAddress = obj_js.tokenAddress; //
const accountAddress = wallets_info.accountAddress;

const requestget = url => {
  return new Promise((resolve, reject) => {
    request(url, (err, response, body) => {
      if (!err && response.statusCode == 200) {
        resolve(body);
      } else if (err) {
        reject(err)
        try{
          console.log(response.statusCode)
        }
        catch{
          console.log('Didnt work')
        }
      }
      else if (!err && response.statusCode == 404){
        resolve('Page doesnt exist');
      }
      else if (!err && response.statusCode != 200) {
        reject()
        try{
          console.log(response.statusCode)
        }
        catch{
          console.log('Didnt work')
        }
      }
    });
  });
};

const httpGet = url => {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', function (err) {
      console.log(err)
      reject(err)
    });
  });
};

var proxies = [];
var proxies_length = [];

var proxies_array = proxy_file.proxy_list
for (var i of obj_js.proxies_list){
  console.log(i)
  console.log(proxies_array[i])
  proxies.push(proxies_array[i]);
}

var proxies_floor = [];
var proxies_floor_length = [];

for (var i of obj_js.proxies_list){
  console.log(i)
  console.log(proxies_array[i])
  proxies_floor.push(proxies_array[i]);
}

proxies_length = proxies.length
proxies_floor_length = proxies_floor.length

// (async () => {
//   let proxy_array = await requestget({
//     'url': 'https://proxy.webshare.io/proxy/list/download/nquitkmkzvfygxiigjkwalxgeutbbvlbyerfmtvb/-/http/username/domain/',
//     'method': 'GET',
//     'timeout': 5000
//   })

//   for (var i of obj_js.proxies_list){
//     const vals = proxy_array.split('\r\n')[i].split(':')
//     const proxy_api = 'http://'+ vals[2]+ ":" + vals[3] + "@" + vals[0] + ":" + vals[1]
//     proxies.push(proxy_api);
//   }
//   proxies_length = proxies.length
//   await sleep(5000);
// })();

// var proxies_floor = [];
// var proxies_floor_length = [];
// (async () => {
//   let proxy_array = await requestget({
//     'url': 'https://proxy.webshare.io/proxy/list/download/nquitkmkzvfygxiigjkwalxgeutbbvlbyerfmtvb/-/http/username/domain/',
//     'method': 'GET',
//     'timeout': 5000
//   })

//   for (var i of obj_js.proxies_floor_list){
//     const vals = proxy_array.split('\r\n')[i].split(':')
//     const proxy_api = 'http://'+ vals[2]+ ":" + vals[3] + "@" + vals[0] + ":" + vals[1]
//     proxies_floor.push(proxy_api);
//   }
//   proxies_floor_length = proxies_floor.length
//   await sleep(5000);
// })();


var token_check = obj_js.tokenAddresses_bid;
var token_bid = token_check

const tokenAddresses_Bid = token_bid.map(function (name) {
  return name.toLowerCase();
});

const tokenAddresses_Check = token_check.map(function (name) {
  return name.toLowerCase();
});

const all_accountAddress = wallets_info.all_accountAddress.map(function (name) {
  return name.toLowerCase();
});

var key_flag = 0;
var proxy_flag = 0;
var proxy_floor_flag = 0;

var place_bid = [];
var iter_counter = 0;
var infura_key = obj_js.INFURA[key_flag];

var provider = new HDWalletProvider({
  mnemonic: wallets_info.mnemonic,
  providerOrUrl: infura_key,
  numberOfAddresses: 10,
  shareNonce: true,
  derivationPath: "m/44'/60'/0'/0/"
});

const seaport = new OpenSeaSDK(provider, {
  networkName: Network.Main,
  apiKey: obj_js.bid_apiKey[0]
}, (arg) => console.log(arg));

var bad_wallets = [];
var reset_prev_bid = Date.now() / 1000


var hist_fp = {};
var last_bid = {};
var max_bid = {};
var addr = []
var addr_check = []

for (let nft of tokenAddresses_Check){
  hist_fp[nft] = []
  addr_check.push(nft.toLowerCase().slice(2))
}

for (let nft of tokenAddresses_Bid) {
  hist_fp[nft] = []
  addr.push(nft.toLowerCase().slice(2))
}

(async () => {
  await sleep(5000)
  console.log(proxies)
  console.log(proxies_floor)
  console.log(proxies_length, proxies_floor_length)
  let hist_counter = 0;
  while (hist_counter < obj_js.hist_initial) {
    for (let nft of Object.keys(hist_fp)) {
      let flag_hist_fp = -1
      while (flag_hist_fp == -1) {
        try {
          var hist_fp_body = await requestget({
            'url': 'https://api.opensea.io/api/v1/collection/' + collections[nft]['token_name'] + '/stats',
            'method': 'GET',
            'timeout': 5000
          })
          var hist_fp_value = 0;
          hist_fp_value = JSON.parse(hist_fp_body).stats.floor_price;
          if (hist_fp_value === null) {
            console.log('Null floor for ' + nft)
          }
          else {
            hist_fp[nft].push(hist_fp_value)
            flag_hist_fp = 1;
          }
        }
        catch {
          console.log('Historical floor price api throttled. Retrying with proxies');
          try {
            var hist_fp_body = await requestget({
              'url': 'https://api.opensea.io/api/v1/collection/' + collections[nft]['token_name'] + '/stats',
              'method': 'GET',
              'proxy': proxies_floor[proxy_floor_flag],
              'timeout': 5000
            })
            proxy_floor_flag += 1
            if (proxy_floor_flag >= proxies_floor_length) {
              proxy_floor_flag = 0;
            }
            var hist_fp_value = 0;
            hist_fp_value = JSON.parse(hist_fp_body).stats.floor_price;
            if (hist_fp_value === null) {
              console.log('Null floor for ' + nft)
            }
            else {
              hist_fp[nft].push(hist_fp_value)
              flag_hist_fp = 1;
            }
          }
          catch{
            console.log('Historical floor price api throttled')
            await sleep(500)
          }
          proxy_floor_flag += 1
          if (proxy_floor_flag >= proxies_floor_length) {
            proxy_floor_flag = 0;
          }
        }
      }
    }
    hist_counter += 1
    console.log(hist_counter.toString() + ' data point added to historical floor price list.')
  }
  for (let nft of Object.keys(hist_fp)) {
    if (hist_fp[nft].every(element => element === null)) {
      console.log(hist_fp[nft])
      console.log('\x1b[31m%s\x1b[0m', 'Fix name of ' + nft)
    }
  }
  for (let nft of tokenAddresses_Bid){
    max_bid[nft] = Math.min.apply(Math, hist_fp[nft])*(1 + (obj_js.max_value_bid/100))
  }
  console.log(hist_fp)
  console.log(max_bid)

  while (true) {
    console.log('Reading new file.')
    var file_available = -1
    while (file_available == -1){
      try{
        var assets_bid = JSON.parse(fs.readFileSync('assets_to_bid.json', 'utf8'));
        console.log(Object.keys(assets_bid).length)
        file_available = 1
      }
      catch{
        console.log('Bid file not present. Waiting')
        await sleep(5000)
        file_available = -1
      }
    }
    var wallets_info = JSON.parse(fs.readFileSync('wallets.json', 'utf8'));
    const accountAddress = wallets_info.accountAddress;
    const all_accountAddress = wallets_info.all_accountAddress.map(function (name) {
      return name.toLowerCase();
    });
    if (Date.now() / (1000) - reset_prev_bid >= obj_js.bid_clear_time) {
      console.log(last_bid)
      last_bid = {}
      reset_prev_bid = Date.now() / 1000
    }
    for (let item of Object.keys(assets_bid)) { //Iterate thru each wallet and bid on collections of interest
      var asset = assets_bid[item]
      var nft = asset.address
      let prev_bid_value = []
      try {
        var bid_floors = {}
        bid_floors[nft] = []
        var bid_fp_flag = -1;
        while (bid_fp_flag == -1) { //Get floor price for bidding
          try {
            var fp_bid_body = await requestget({
              'url': 'https://api.opensea.io/api/v1/collection/' + collections[nft]['token_name'] + '/stats',
              'method': 'GET',
              'timeout': 5000
            })
            bid_info_flag = 1;
            var fp_value = 0;
            fp_value = JSON.parse(fp_bid_body).stats.floor_price;
            if (fp_value === null) {
              console.log('Null floor for ' + nft)
            }
            else {
              bid_floors[nft].push(fp_value)
              bid_fp_flag = 1;
            }
          }
          catch {
            console.log('Floor price (for bidding) api throttled. Retrying with proxies');
            try {
              var fp_bid_body = await requestget({
                'url': 'https://api.opensea.io/api/v1/collection/' + collections[nft]['token_name'] + '/stats',
                'method': 'GET',
                'proxy': proxies_floor[proxy_floor_flag],
                'timeout': 5000
              })
              bid_info_flag = 1;
              proxy_floor_flag += 1
              if (proxy_floor_flag >= proxies_floor_length) {
                proxy_floor_flag = 0;
              }
              var fp_value = 0;
              fp_value = JSON.parse(fp_bid_body).stats.floor_price;
              if (fp_value === null) {
                console.log('Null floor for ' + nft)
              }
              else {
                bid_floors[nft].push(fp_value)
                bid_fp_flag = 1;
              }
            }
            catch {
              console.log('Floor price (for bidding) api throttled. Retrying');
              await sleep(500)
              proxy_floor_flag += 1
              if (proxy_floor_flag >= proxies_floor_length) {
                proxy_floor_flag = 0;
              }
            }
          }
        }

        iter_counter += 1
        if (iter_counter % 1200 === 0) {
          key_flag += 1;
          if (key_flag == obj_js.INFURA.length) {
            key_flag = 0;
          }
          infura_key = obj_js.INFURA[key_flag];
          console.log(infura_key);
          provider.engine.stop();
          provider = new HDWalletProvider({
            mnemonic: wallets_info.mnemonic,
            providerOrUrl: infura_key,
            numberOfAddresses: 10,
            shareNonce: true,
            derivationPath: "m/44'/60'/0'/0/"
          });
          const seaport = new OpenSeaSDK(provider, {
            networkName: Network.Main,
            apiKey: obj_js.bid_apiKey[0]
          }, (arg) => console.log(arg));
        }
        global.proxy = proxies[proxy_flag]
        proxy_flag += 1
        if (proxy_flag >= proxies_length) {
          proxy_flag = 0;
        }
        // var bid_fp_flag = -1;
        // while (bid_fp_flag == -1) { //Get floor price for bidding
        //   try {
        //     var fp_bid_body = await requestget({
        //       'url': 'https://api.opensea.io/api/v1/collection/' + collections[asset.address]['token_name'] + '/',
        //       'method': 'GET',
        //       'timeout': 5000
        //     })
        //     bid_fp_flag = 1;
        //   }
        //   catch {
        //     console.log('Floor price (for bidding) api throttled. Retrying');
        //     await sleep(500)
        //     proxy_flag += 1
        //     if (proxy_flag == proxies.length) {
        //       proxy_flag = 0;
        //     }
        //   }
        // }
        var bid_info_flag = -1
        while (bid_info_flag == -1) { //Get information about bids on asset
          try {
            var body = await requestget({
              'url': 'https://api.opensea.io/api/v1/asset/' + asset.address.toLowerCase() + '/' + asset.token_id.toString() + '/offers',
              'method': 'GET',
              headers: {
                'x-api-key': obj_js.bid_apiKey[0]
              },
              'proxy': proxies[proxy_flag],
              'timeout': 10000
            })
            var body_owner = await requestget({
              'url': 'https://api.opensea.io/api/v1/asset/' + asset.address.toLowerCase() + '/' + asset.token_id.toString() + '/',
              'method': 'GET',
              headers: {
                'x-api-key': obj_js.bid_apiKey[0]
              },
              'proxy': proxies[proxy_flag],
              'timeout': 5000
            })
            bid_info_flag = 1;
            proxy_flag += 1
            if (proxy_flag >= proxies_length) {
              proxy_flag = 0;
            }
          }
          catch {
            console.log('Bid info api throttled. Retrying');
            await sleep(1000)
            console.log(proxies[proxy_flag] + ' might be bad.')
            proxy_flag += 1
            if (proxy_flag >= proxies_length) {
              proxy_flag = 0;
            }
          }
        }
        if (body == 'Page doesnt exist'){
          console.log('Skipping ' + asset['token_id'] + ' of ' + asset['asset_contract']['address'] + ' because page is broken.');
          continue;
        }
        var result = JSON.parse(body).offers;
        let actual_owner = JSON.parse(body_owner).owner.address;
        var m = []
        var m_owner = []
        for (var r of result) {
          if ((r.maker.address != actual_owner) & (r.payment_token_contract.symbol.toLowerCase() == 'weth')) {
            m.push(parseFloat(r.current_price / 1e18));
            m_owner.push(r.maker.address);
          }
        }
        // Get floor price
        var fp = bid_floors[asset.address.toLowerCase()]
        // if (obj_js.FP === 0) {
        //   var fp = 0;
        //   fp = JSON.parse(fp_bid_body).collection.stats.floor_price;
        //   if (fp === 0) {
        //     console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')
        //   }
        // } else {
        //   var fp = obj_js.FP;
        // }
        if (Math.min.apply(Math, hist_fp[asset.address]) * (1 + obj_js.threshold / 100) < fp) {
          hist_fp[asset.address].push(fp);
          if (hist_fp[asset.address].length === obj_js.hist_max) {
            hist_fp[asset.address].shift();
          }
          console.log('\x1b[31m%s\x1b[0m', 'Minimum floor price times 1.07 is ' + Math.min.apply(Math, hist_fp[asset.address]) * (1 + obj_js.threshold / 100) + ' while floor price is ' + fp.toString() + '. Skipping bidding')
          continue
        }
        else if (fp === null) {
          console.log('\x1b[31m%s\x1b[0m', 'Minimum floor price times 1.07 is null. Skipping collection')
          continue
        }
        else {
          let max_hist = Math.min.apply(Math, hist_fp[asset.address]) * (1 + obj_js.threshold / 100)
          console.log('Current floor price is ' + fp.toString() + ' historical times 1.07 is ' + max_hist.toString())
          hist_fp[asset.address].push(fp);
          if (hist_fp[asset.address].length === obj_js.hist_max) {
            hist_fp[asset.address].shift();
          }
        }
        var token_fee = collections[asset.address]['token_fee']
        if (m.length === 0) {
          console.log('Token has no bids, bidding.');
          console.log(asset.token_id.toString(), asset.address.toLowerCase());
          let bid_value = fp * (obj_js.profit_upper - token_fee)
          try {
            prev_bid_value = last_bid[asset.address.toLowerCase()][asset.token_id.toString()]
            if ((prev_bid_value !== bid_value) & (bid_value <= max_bid[asset.address.toLowerCase()])) {
              place_bid = 1
            }
            else if(bid_value > max_bid[asset.address.toLowerCase()]){
              place_bid = -1
            }
            else {
              place_bid = 0
            }
            last_bid[asset.address.toLowerCase()][asset.token_id.toString()] = bid_value
          }
          catch {
            if ((bid_value <= max_bid[asset.address.toLowerCase()])) {
              if (last_bid[asset.address.toLowerCase()] == undefined) {
                last_bid[asset.address.toLowerCase()] = {}
              }
              last_bid[asset.address.toLowerCase()][asset.token_id.toString()] = bid_value
              place_bid = 1
            }
            else{
              place_bid = -1
            }
          }
          if (place_bid == 1) {
            console.log('\x1b[33m%s\x1b[0m', 'Bidding ' + bid_value.toString() + ' on ' + collections[asset.address]['token_name'] + ' ' + asset.token_id.toString())
            seaport.createBuyOrder({
              asset: {
                tokenId: asset.token_id.toString(),
                tokenAddress: asset.address.toLowerCase()
              },
              accountAddress: accountAddress,
              startAmount: 0.015,
              // startAmount: bid_value,
              expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * obj_js.Bid_Time)
            })
              .then((res) => { console.log('\x1b[33m%s\x1b[0m', 'Bid Successful! ' + collections[asset.address]['token_name'] + ' ' + asset.token_id.toString()); }).catch((err) => {
                if (err.toString().includes('API Error 429:') || err.toString().includes('FetchError: network timeout at') || err.toString().includes('Outstanding order to wallet balance')) {
                  // console.log('\x1b[36m%s\x1b[0m', 'Will bid on ' + asset.token_id.toString() +' in next loop.');
                  console.log('\x1b[36m%s\x1b[0m', err.toString());
                  // ids_new_iter.push(id);
                }
                else if (err.toString().includes('Trading is not enabled for')) {
                  console.log(err.toString())
                  console.log('Flagged wallet');
                  bad_wallets.push(wallet);
                }
                else if (err.toString().includes('API Error 400:')) {
                  console.log(err.toString());
                  console.log('Not bidding on auction');
                }
                else{
                  console.log(err.toString())
                };
              });
          }
          else if(place_bid == -1){
            console.log('\x1b[35m%s\x1b[0m', bid_value.toString() + ' higher than ' + max_bid[asset.address.toLowerCase()].toString() + '. Skipping ' + collections[asset.address.toLowerCase()]['token_name'] + ' ' + asset.token_id.toString())
          }
          else {
            console.log('\x1b[32m%s\x1b[0m', 'Cycled back to asset too fast. Not bidding.')
          }
        }
        else {
          let cmb = Math.max.apply(Math, m);
          let owner_cmb = m_owner[m.indexOf(cmb)];
          // if (owner_cmb === accountAddress.toLowerCase()){
          if (all_accountAddress.indexOf(owner_cmb) >= 0) {
            console.log('Already own highest bid, not bidding.');
            console.log(asset.token_id.toString(), asset.address.toLowerCase())
          }
          else {
            if (cmb < fp * (obj_js.profit_lower - token_fee) & cmb >= fp * (obj_js.profit_upper - token_fee)) { //if highest bid is between 10 and 25% profit margin
              // if (1 == 1){
              // if (cmb < 0.4){
              console.log('Token has bids, bidding')
              console.log(asset.token_id.toString(), asset.address.toLowerCase())
              let bid_value = cmb + 0.0001
              try {
                prev_bid_value = last_bid[asset.address.toLowerCase()][asset.token_id.toString()]
                if ((prev_bid_value !== bid_value) & (bid_value <= max_bid[asset.address.toLowerCase()])) {
                  place_bid = 1
                }
                else if(bid_value > max_bid[asset.address.toLowerCase()]){
                  place_bid = -1
                }
                else {
                  place_bid = 0
                }
                last_bid[asset.address.toLowerCase()][asset.token_id.toString()] = bid_value
              }
              catch {
                if ((bid_value <= max_bid[asset.address.toLowerCase()])) {
                  if (last_bid[asset.address.toLowerCase()] == undefined) {
                    last_bid[asset.address.toLowerCase()] = {}
                  }
                  last_bid[asset.address.toLowerCase()][asset.token_id.toString()] = bid_value
                  place_bid = 1
                }
                else{
                  place_bid = -1
                }
              }
              if (place_bid == 1) {
                console.log('\x1b[33m%s\x1b[0m', 'Bidding ' + bid_value + ' on ' + collections[asset.address]['token_name'] + ' ' + asset.token_id.toString())
                seaport.createBuyOrder({
                  asset: {
                    tokenId: asset.token_id.toString(),
                    tokenAddress: asset.address
                  },
                  accountAddress: accountAddress,
                  startAmount: 0.015,
                  // startAmount: bid_value,
                  expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * obj_js.Bid_Time)
                })
                  .then((res) => { console.log('\x1b[33m%s\x1b[0m', 'Bid Successful! ' + collections[asset.address]['token_name'] + ' ' + asset.token_id.toString()); }).catch((err) => {
                    if (err.toString().includes('API Error 429:') || err.toString().includes('FetchError: network timeout at') || err.toString().includes('Outstanding order to wallet balance')) {
                      // console.log('\x1b[36m%s\x1b[0m', 'Will bid on ' + asset.token_id.toString() +' in next loop.');
                      console.log('\x1b[36m%s\x1b[0m', err.toString());
                      console.log(err.toString())
                      // ids_new_iter.push(id);
                    }
                    else if (err.toString().includes('Trading is not enabled for')) {
                      console.log('Flagged wallet');
                      bad_wallets.push(wallet.toLowerCase());
                      console.log(err.toString())
                    }
                    else if (err.toString().includes('API Error 400:')) {
                      console.log('Not bidding on auction');
                      console.log(err.toString())
                    }
                    else{
                      console.log(err.toString())
                    };
                  })
              }
              else if(place_bid == -1){
                console.log('\x1b[35m%s\x1b[0m', bid_value.toString() + ' higher than ' + max_bid[asset.address.toLowerCase()].toString() + '. Skipping ' + collections[asset.address.toLowerCase()]['token_name'] + ' ' + asset.token_id.toString())
              }
              else {
                console.log('\x1b[32m%s\x1b[0m', 'Cycled back to asset too fast. Not bidding.')
              }
            }
            else if (cmb < fp * (obj_js.profit_upper - token_fee)) { //if highest bid is very low
              // if (cmb < 0.4){
              console.log('Token has very low bids, bidding')
              console.log(asset.token_id.toString(), asset.address.toLowerCase())
              let bid_value = fp * (obj_js.profit_upper - token_fee)
              try {
                prev_bid_value = last_bid[asset.address.toLowerCase()][asset.token_id.toString()]
                if ((prev_bid_value !== bid_value) & (bid_value <= max_bid[asset.address.toLowerCase()])) {
                  place_bid = 1
                }
                else if(bid_value > max_bid[asset.address.toLowerCase()]){
                  place_bid = -1
                }
                else {
                  place_bid = 0
                }
                last_bid[asset.address.toLowerCase()][asset.token_id.toString()] = bid_value
              }
              catch {
                if ((bid_value <= max_bid[asset.address.toLowerCase()])) {
                  if (last_bid[asset.address.toLowerCase()] == undefined) {
                    last_bid[asset.address.toLowerCase()] = {}
                  }
                  last_bid[asset.address.toLowerCase()][asset.token_id.toString()] = bid_value
                  place_bid = 1
                }
                else{
                  place_bid = -1
                }
              }
              if (place_bid == 1) {
                console.log('\x1b[33m%s\x1b[0m', 'Bidding ' + bid_value.toString() + ' on ' + collections[asset.address]['token_name'] + ' ' + asset.token_id.toString())
                seaport.createBuyOrder({
                  asset: {
                    tokenId: asset.token_id.toString(),
                    tokenAddress: asset.address.toLowerCase()
                  },
                  accountAddress: accountAddress,
                  startAmount: 0.015,
                  // startAmount: bid_value,
                  expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * obj_js.Bid_Time)
                })
                  .then((res) => { console.log('\x1b[33m%s\x1b[0m', 'Bid Successful! ' + collections[asset.address]['token_name'] + ' ' + asset.token_id.toString()); }).catch((err) => {
                    if (err.toString().includes('API Error 429:') || err.toString().includes('FetchError: network timeout at') || err.toString().includes('Outstanding order to wallet balance')) {
                      // console.log('\x1b[36m%s\x1b[0m', 'Will bid on ' + asset.token_id.toString() +' in next loop.');
                      // ids_new_iter.push(id);
                      console.log('\x1b[36m%s\x1b[0m', err);
                    }
                    else if (err.toString().includes('Trading is not enabled for')) {
                      console.log('Flagged wallet');
                      bad_wallets.push(wallet.toLowerCase());
                      console.log(err.toString())
                    }
                    else if (err.toString().includes('API Error 400:')) {
                      console.log('Not bidding on auction');
                      console.log(err.toString())
                    }
                    else{
                      console.log(err.toString())
                    };
                  })
              }
              else if(place_bid == -1){
                console.log('\x1b[35m%s\x1b[0m', bid_value.toString() + ' higher than ' + max_bid[asset.address.toLowerCase()].toString() + '. Skipping ' + collections[asset.address.toLowerCase()]['token_name'] + ' ' + asset.token_id.toString())
              }
              else {
                console.log('\x1b[32m%s\x1b[0m', 'Cycled back to asset too fast. Not bidding.')
              }
            }
            else {
              console.log('Top bid too high. Bidding within profit margin.');
              var lower_bids = m.filter(function (x) {
                return x < fp * (obj_js.profit_lower - token_fee);
              });

              var nb = Math.max.apply(Math, lower_bids)
              let owner_nb = m_owner[m.indexOf(nb)];

              if (lower_bids.length === 0) {
                console.log('No lower bids. Bidding')
                console.log(asset.token_id.toString(), asset.address.toLowerCase())
                let bid_value = fp * (obj_js.profit_upper - token_fee)
                try {
                  prev_bid_value = last_bid[asset.address.toLowerCase()][asset.token_id.toString()]
                  if ((prev_bid_value !== bid_value) & (bid_value <= max_bid[asset.address.toLowerCase()])) {
                    place_bid = 1
                  }
                  else if(bid_value > max_bid[asset.address.toLowerCase()]){
                    place_bid = -1
                  }
                  else {
                    place_bid = 0
                  }
                  last_bid[asset.address.toLowerCase()][asset.token_id.toString()] = bid_value
                }
                catch {
                  if ((bid_value <= max_bid[asset.address.toLowerCase()])) {
                    if (last_bid[asset.address.toLowerCase()] == undefined) {
                      last_bid[asset.address.toLowerCase()] = {}
                    }
                    last_bid[asset.address.toLowerCase()][asset.token_id.toString()] = bid_value
                    place_bid = 1
                  }
                  else{
                    place_bid = -1
                  }
                }
                if (place_bid == 1) {
                  console.log('\x1b[33m%s\x1b[0m', 'Bidding ' + bid_value.toString() + ' on ' + collections[asset.address]['token_name'] + ' ' + asset.token_id.toString())
                  seaport.createBuyOrder({
                    asset: {
                      tokenId: asset.token_id.toString(),
                      tokenAddress: asset.address.toLowerCase()
                    },
                    accountAddress: accountAddress,
                    startAmount: 0.015,
                    // startAmount: bid_value,
                    expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * obj_js.Bid_Time)
                  })
                    .then((res) => { console.log('\x1b[33m%s\x1b[0m', 'Bid Successful! ' + collections[asset.address]['token_name'] + ' ' + asset.token_id.toString()); }).catch((err) => {
                      if (err.toString().includes('API Error 429:') || err.toString().includes('FetchError: network timeout at') || err.toString().includes('Outstanding order to wallet balance')) {
                        // console.log('\x1b[36m%s\x1b[0m', 'Will bid on ' + asset.token_id.toString() +' in next loop.');
                        // ids_new_iter.push(id);
                        console.log('\x1b[36m%s\x1b[0m', err.toString());
                      }
                      else if (err.toString().includes('Trading is not enabled for')) {
                        console.log('Flagged wallet');
                        bad_wallets.push(wallet.toLowerCase());
                        console.log(err.toString())
                      }
                      else if (err.toString().includes('API Error 400:')) {
                        console.log('Not bidding on auction');
                        console.log(err.toString())
                      }
                      else{
                        console.log(err.toString())
                      };
                    })
                }
                else if(place_bid == -1){
                  console.log('\x1b[35m%s\x1b[0m', bid_value.toString() + ' higher than ' + max_bid[asset.address.toLowerCase()].toString() + '. Skipping ' + collections[asset.address.toLowerCase()]['token_name'] + ' ' + asset.token_id.toString())
                }
                else {
                  console.log('\x1b[32m%s\x1b[0m', 'Cycled back to asset too fast. Not bidding.')
                }
              }
              else {
                if (all_accountAddress.indexOf(owner_nb) >= 0) {
                  console.log('Already own second highest bid, not bidding.');
                }
                else if (nb < fp * (obj_js.profit_lower - token_fee) & nb >= fp * (obj_js.profit_upper - token_fee)) { //if highest bid is between 10 and 25% profit margin
                  // if (cmb < 0.4){
                  console.log('Second highest bid within profit margin. Bidding higher than that')
                  console.log(asset.token_id.toString(), asset.address.toLowerCase())
                  let bid_value = nb + 0.0001
                  try {
                    prev_bid_value = last_bid[asset.address.toLowerCase()][asset.token_id.toString()]
                    if ((prev_bid_value !== bid_value) & (bid_value <= max_bid[asset.address.toLowerCase()])) {
                      place_bid = 1
                    }
                    else if(bid_value > max_bid[asset.address.toLowerCase()]){
                      place_bid = -1
                    }
                    else {
                      place_bid = 0
                    }
                    last_bid[asset.address.toLowerCase()][asset.token_id.toString()] = bid_value
                  }
                  catch {
                    if ((bid_value <= max_bid[asset.address.toLowerCase()])) {
                      if (last_bid[asset.address.toLowerCase()] == undefined) {
                        last_bid[asset.address.toLowerCase()] = {}
                      }
                      last_bid[asset.address.toLowerCase()][asset.token_id.toString()] = bid_value
                      place_bid = 1
                    }
                    else{
                      place_bid = -1
                    }
                  }
                  if (place_bid == 1) {
                    console.log('\x1b[33m%s\x1b[0m', 'Bidding ' + bid_value + ' on ' + collections[asset.address]['token_name'] + ' ' + asset.token_id.toString())
                    seaport.createBuyOrder({
                      asset: {
                        tokenId: asset.token_id.toString(),
                        tokenAddress: asset.address.toLowerCase()
                      },
                      accountAddress: accountAddress,
                      startAmount: 0.015,
                      // startAmount: bid_value,
                      expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * obj_js.Bid_Time)
                    })
                      .then((res) => { console.log('\x1b[33m%s\x1b[0m', 'Bid Successful! ' + collections[asset.address]['token_name'] + ' ' + asset.token_id.toString()); }).catch((err) => {
                        if (err.toString().includes('API Error 429:') || err.toString().includes('FetchError: network timeout at') || err.toString().includes('Outstanding order to wallet balance')) {
                          // console.log('\x1b[36m%s\x1b[0m', 'Will bid on ' + asset.token_id.toString() +' in next loop.');
                          // ids_new_iter.push(id);
                          console.log('\x1b[36m%s\x1b[0m', err.toString());
                        }
                        else if (err.toString().includes('Trading is not enabled for')) {
                          console.log('Flagged wallet');
                          bad_wallets.push(wallet.toLowerCase());
                          console.log(err.toString())

                        }
                        else if (err.toString().includes('API Error 400:')) {
                          console.log('Not bidding on auction');
                          console.log(err.toString())
                        }
                        else{
                          console.log(err.toString())
                        };
                      })
                  }
                  else if(place_bid == -1){
                    console.log('\x1b[35m%s\x1b[0m', bid_value.toString() + ' higher than ' + max_bid[asset.address.toLowerCase()].toString() + '. Skipping ' + collections[asset.address.toLowerCase()]['token_name'] + ' ' + asset.token_id.toString())
                  }
                  else {
                    console.log('\x1b[32m%s\x1b[0m', 'Cycled back to asset too fast. Not bidding.')
                  }
                }
                else if (nb < fp * (obj_js.profit_upper - token_fee)) { //if highest bid is very low
                  // if (cmb < 0.4){
                  console.log('Second highest bid is too low. Bidding in profit margin.')
                  let bid_value = fp * (obj_js.profit_upper - token_fee)
                  try {
                    prev_bid_value = last_bid[asset.address.toLowerCase()][asset.token_id.toString()]
                    if ((prev_bid_value !== bid_value) & (bid_value <= max_bid[asset.address.toLowerCase()])) {
                      place_bid = 1
                    }
                    else if(bid_value > max_bid[asset.address.toLowerCase()]){
                      place_bid = -1
                    }
                    else {
                      place_bid = 0
                    }
                    last_bid[asset.address.toLowerCase()][asset.token_id.toString()] = bid_value
                  }
                  catch {
                    if ((bid_value <= max_bid[asset.address.toLowerCase()])) {
                      if (last_bid[asset.address.toLowerCase()] == undefined) {
                        last_bid[asset.address.toLowerCase()] = {}
                      }
                      last_bid[asset.address.toLowerCase()][asset.token_id.toString()] = bid_value
                      place_bid = 1
                    }
                    else{
                      place_bid = -1
                    }
                  }
                  if (place_bid == 1) {
                    console.log('\x1b[33m%s\x1b[0m', 'Bidding ' + bid_value + ' on ' + collections[asset.address]['token_name'] + ' ' + asset.token_id.toString())
                    seaport.createBuyOrder({
                      asset: {
                        tokenId: asset.token_id.toString(),
                        tokenAddress: asset.address.toLowerCase()
                      },
                      accountAddress: accountAddress,
                      startAmount: 0.015,
                      // startAmount: bid_value,
                      expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * obj_js.Bid_Time)
                    })
                      .then((res) => { console.log('\x1b[33m%s\x1b[0m', 'Bid Successful! ' + collections[asset.address]['token_name'] + ' ' + asset.token_id.toString()); }).catch((err) => {
                        if (err.toString().includes('API Error 429:') || err.toString().includes('FetchError: network timeout at') || err.toString().includes('Outstanding order to wallet balance')) {
                          // console.log('\x1b[36m%s\x1b[0m', 'Will bid on ' + asset.token_id.toString() +' in next loop.');
                          // ids_new_iter.push(id);
                          console.log('\x1b[36m%s\x1b[0m', err.toString());
                        }
                        else if (err.toString().includes('Trading is not enabled for')) {
                          console.log('Flagged wallet');
                          bad_wallets.push(wallet.toLowerCase());
                          console.log(err.toString())
                        }
                        else if (err.toString().includes('API Error 400:')) {
                          console.log('Not bidding on auction');
                          console.log(err.toString())
                        }
                        else{
                          console.log(err.toString())
                        };
                      })
                  }
                  else if(place_bid == -1){
                    console.log('\x1b[35m%s\x1b[0m', bid_value.toString() + ' higher than ' + max_bid[asset.address.toLowerCase()].toString() + '. Skipping ' + collections[asset.address.toLowerCase()]['token_name'] + ' ' + asset.token_id.toString())
                  }
                  else {
                    console.log('\x1b[32m%s\x1b[0m', 'Cycled back to asset too fast. Not bidding.')
                  }
                }
              }
            }
          }
        }
        await sleep(obj_js.wait_time)
      }
      catch {
        console.log('Wallet bid api throttled. Retrying');
        await sleep(Math.random() * (obj_js.events_wait_max*1000 - obj_js.events_wait_min*1000) + obj_js.events_wait_min*1000)
        proxy_flag += 1
        if (proxy_flag >= proxies_length) {
          proxy_flag = 0;
        }
        continue
      }
    }
    await sleep(obj_js.collection_wait)
  }
})();