//const GDAX = require('gdax');
var http = require('http');
var url = require('url');
var fs = require('fs');
var mockData = require('./mock-data.js');
//var algotrade = require('./algotrade/algotrade');
const config = require('./config');
const gdaxWrapper = require('./GDAX-wrapper/gdax-wrapper');
const tradingModule = require('./algotrade/tradingModule');
const wallet = require('./wallet.js');

let startTime = new Date();
var symbols = config.symbols;
var rawData = {};
var allData = {};
wallet.funds = config.wallet.funds;
wallet.simulateTrade = config.wallet.simulateTrade;

// load allowed algorithms
let algorithms = {};
for(var c in config.runningAlgorithms) {
  const name = config.runningAlgorithms[c];
  algorithms[name] = require('./algotrade/' + name);
  algorithms[name].init(config, allData);
}

tradingModule.init(allData);

for(var c in symbols) {
  var symbol = symbols[c];
  rawData[symbol] = {};
  allData[symbol] = [];
}

//gdaxWrapper.getProducts();
gdaxWrapper.attachOnMessageCallback(incommingData);

// generate mock data if enabled
if(config.mockData.enable) {
  setInterval(function() {
    let dataPoint = mockData.getData(config.mockData.Url);
    if(typeof dataPoint != 'undefined') {
      incommingData(dataPoint);
    }
  }, config.mockData.speed);
}

/**
 * [incommingData GDAX data is comming up
 * @param  {[type]} data GDAX DATA
 * @return {[type]}      [description]
 */
function incommingData(data) {
  //orderBookScanner.analyze(data);
  //console.log(data);
  //console.log("\n=======================\n")
  if (!(data.type === 'done' && data.reason === 'filled') || data.price === undefined )
    return;

  let dateStr = data.time;

  let datapoint = {
    price: data.price,
    tradeTime: dateStr,
    trend: 0
  }

  var productData = allData[data.product_id];
  var cursor = productData.length;
  var priceThreshold = 20.00;

  if( productData.length != 0) {
      let prevPrice = productData[cursor - 1].price;
      let price = datapoint.price;
      if( price != prevPrice) {
        if(Math.abs(price - prevPrice) < priceThreshold) {
          allData[data.product_id].push(datapoint);
          for(var c in config.runningAlgorithms) {
            // Run allowed algorithms
            const algorithm = config.runningAlgorithms[c];
            props = [allData[data.product_id], {}];
            algorithms[algorithm].analyze(data.product_id);
          }
        }else {
          console.log("Price too different than the previous price!!!   price: " + datapoint.price + " previous: " + prevPrice);
          //allData[data.product_id].push(datapoint);
          //wallet = algotrade.analyze(data.product_id);
        }
      }
  }
  else {
    allData[data.product_id].push(datapoint);
  }
}

console.log("Server is starting ...");

//create a server object
http.createServer(function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var html = '';


  // serve static files
  if( url_parts.pathname.indexOf('.js') != -1 ||
      url_parts.pathname.indexOf('.css') != -1 ||
      url_parts.pathname.indexOf('.html') != -1 ||
      url_parts.pathname.indexOf('.txt') != -1) {
    filename = './frontend' + url_parts.pathname;

    if(filename.indexOf('config') != -1) {
      // prevent showing the config file
      res.writeHead(404, 'Not Found');
      res.write('404: File Not Found!');
      res.end();
      return;
    }

    fs.readFile(filename, "utf8", function(err, dataText) {
        if (err) {
            res.writeHead(404, 'Not Found');
            res.write('404: File Not Found!');
            res.end();
        }

        res.statusCode = 200;

        if(url_parts.pathname == '/index.html') {
          // if this is the index file, replace config marker with the actual config
          const _config = { symbols: config.symbols, ajaxUrl: config.ajaxUrl + ':' + config.serverPort, wallet: {init_amount: config.wallet.funds} }
          dataText = dataText.split('##!!CONFIG!!##').join('const globalConfig = ' + JSON.stringify(_config) );
        }
        res.write(dataText);
        res.end();
    });

  }
  // serve symbol JSON data
  else if(typeof query.symbol != 'undefined') {
    const symbol = query.symbol;
    const data = allData[symbol];

    html = '{"barData":{"priceBars":[';
    for(var c in data) {
      html += JSON.stringify(data[c]);
      if(c < data.length-1)
        html += ',';
    }
    html += "]},";

    // set last share price
    if(typeof data != 'undefined' && data.length > 0) {
      const last = data.length-1;
      wallet.sharePrice = parseFloat(data[last].price);
    }

    // send trades
    html += '"trades":[';
    for(var c in wallet.trades) {
      html += JSON.stringify(wallet.trades[c]);
      if(c < wallet.trades.length-1)
        html += ',';
    }
    html += '],';

    html += `"system":{
                "startTime": "${startTime}",
                "wallet": ` + JSON.stringify(wallet) + `
              }
    `;

    html += '}';
    res.write(html);
    res.end();
  }
  // execute command
  else if(typeof query.command != 'undefined') {
    html = ">>" + query.command;
    config.buy.allowed = query.command;
    res.write(html);
    res.end();
  }
}).listen(config.serverPort);
