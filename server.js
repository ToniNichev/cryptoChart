const GDAX = require('gdax');
var http = require('http');
var url = require('url');
var fs = require('fs');
var mockData = require('./mock-data.js');
var algotrade = require('./algotrade/algotrade');
const config = require('./config');


let startTime = new Date();

var symbols = config.symbols;

var rawData = {};
var allData = {};
var wallet = {trades:[]}

for(var c in symbols) {
  var symbol = symbols[c];
  rawData[symbol] = {};
  allData[symbol] = [];
}

const authenticatedClient = new GDAX.AuthenticatedClient( config.account.apiKey, 
                                                          config.account.base64secret, 
                                                          config.account.passPhrase, 
                                                          config.account.apiURI);


algotrade.init(symbols, allData, 100);

const websocket = new GDAX.WebsocketClient(  
  symbols,
  config.account.wss,
  {
    key: config.account.apiKey,
    secret: config.account.base64secret,
    passphrase: config.account.passPhrase,
  },
  { heartbeat: true }
);

websocket.on('error', err => {
  console.log("Error !");
  console.log(err);
});

websocket.on('close', () => { 
  console.log("Socket closed !");
  console.log(err);
});

websocket.on('message', data => { 
  if(!config.mockData.enable) {    
    // ignore GDAX messages if mock data is enabled
    incommingData(data);  
  }
});

if(config.mockData.enable) {
  setInterval(function() {
    let dataPoint = mockData.getData(config.mockData.Url);
    if(typeof dataPoint != 'undefined') {
      incommingData(dataPoint);
    }
  }, config.mockData.speed);
}


function incommingData(data) {
  if (!(data.type === 'done' && data.reason === 'filled') || data.price === undefined )      
    return;

  let dateStr = data.time;

  let datapoint = {
    price: data.price,
    tradeTime: dateStr
  }

  var productData = allData[data.product_id];
  var cursor = productData.length;
  var priceThreshold = 40.00;

  
  if( productData.length != 0) {
      let prevPrice = productData[cursor - 1].price;
      let price = datapoint.price;
      if( price != prevPrice) { 
        if(Math.abs(price - prevPrice) < priceThreshold) {
          allData[data.product_id].push(datapoint);   
          wallet = algotrade.analyze(data.product_id); 
        }else {
          console.log("Price too different than the previous price!!!   price: " + datapoint.price);   
        }
      }    
  }
  else {
    allData[data.product_id].push(datapoint); 
  }  
}



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
    filename = '.' + url_parts.pathname;

    fs.readFile(filename, "utf8", function(err, dataText) {
        if (err) {
            res.writeHead(404, 'Not Found');
            res.write('404: File Not Found!');
            res.end();
        }

        res.statusCode = 200;

        if(url_parts.pathname == '/index.html') {
          // if this is the index file, replace config marker with the actual config
          const _config = { symbols: config.symbols, ajaxUrl: config.ajaxUrl }
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
    wallet.sharePrice = '12234';

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
    algotrade.command(query.command);
    res.write(html);
    res.end();    
  }


}).listen(1140);